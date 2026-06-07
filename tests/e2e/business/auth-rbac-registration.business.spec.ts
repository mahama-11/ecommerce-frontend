import { expect, test } from '@playwright/test'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks } from '../support/harness'

test('@business @p1 @auth-rbac ecom-auth-register-forgot-password-and-session-expiry-guards', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/register')
  await expect(page.locator('body')).toContainText(/注册|Register|Create account|Sign up/i)
  await expect(page.locator('a[href*="login"], button, input').first()).toBeVisible()

  await page.goto('/forgot-password')
  await expect(page.locator('body')).toContainText(/忘记|Forgot|reset|找回/i)
  await expect(page.locator('input[type="email"], input').first()).toBeVisible()

  await page.evaluate(() => {
    window.localStorage.setItem('ecommerce_access_token', 'expired-token')
    window.localStorage.removeItem('ecommerce_session')
  })
  await page.route('**/api/v1/ecommerce/auth/session', async route => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 401, message: 'session expired', data: null }) })
  })
  await page.goto('/products')
  await expect(page).toHaveURL(/\/login/)

  await screenshotEvidence(page, testInfo, 'auth-register-forgot-expiry')
  expect(expectCleanEvidence(evidence).networkFailures).toEqual([])
})

test('@business @p1 @auth-rbac ecom-auth-rbac-org-admin-allows-admin-and-blocks-member', async ({ page, browser }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await installBusinessRuntimeMocks(page)
  await page.goto('/org/overview')
  await expect(page).not.toHaveURL(/\/account\/assets|\/login/)
  await expect(page.locator('body')).toContainText(/组织|Organization|成员|Member|权限|workspace/i, { timeout: 12_000 })

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
  await expect(memberPage).toHaveURL(/\/account\/assets/)
  await memberContext.close()

  await screenshotEvidence(page, testInfo, 'auth-rbac-org-admin')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
