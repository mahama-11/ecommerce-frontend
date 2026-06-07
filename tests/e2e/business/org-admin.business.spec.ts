import { expect, test } from '@playwright/test'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks } from '../support/harness'

test('@business @p1 @org-admin ecom-org-admin-overview-membership-and-permission-boundary', async ({ page, browser }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  await installBusinessRuntimeMocks(page)

  await test.step('Workspace admin opens org overview and sees organization context', async () => {
    await page.goto('/org/overview')
    await expect(page).not.toHaveURL(/\/login|\/account\/assets/)
    await expect(page.locator('body')).toContainText(/组织|Organization|成员|Member|权限|角色|workspace/i, { timeout: 12_000 })
  })

  await test.step('Non-admin is redirected away from org admin route', async () => {
    const origin = new URL(page.url()).origin
    const memberSession = { access_token: 'member-token', user: { full_name: 'Member User', email: 'member@agent-ecommerce.local', org_name: 'Local QA', org_role: 'member' }, access: { product_roles: [] } }
    const memberContext = await browser.newContext({ baseURL: origin })
    const memberPage = await memberContext.newPage()
    await memberPage.route('**/api/v1/ecommerce/auth/session', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: { user: memberSession.user, access: memberSession.access, credits: null } }) })
    })
    await memberPage.goto('/login')
    await memberPage.evaluate(session => {
      window.localStorage.setItem('ecommerce_access_token', session.access_token)
      window.localStorage.setItem('ecommerce_session', JSON.stringify(session))
    }, memberSession)
    await memberPage.goto('/org/overview')
    await expect(memberPage).toHaveURL(/\/account\/assets|redirect=%2Faccount%2Fassets|redirect=%2Forg%2Foverview/)
    await memberContext.close()
  })

  await screenshotEvidence(page, testInfo, 'org-admin-permission-boundary')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
