import { expect, test } from '@playwright/test'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks } from '../support/harness'
import { selector } from '../support/selectors'

test('@business @p0 @auth ecom-auth-protected-route blocks unauthenticated workspace and accepts fixture session', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await test.step('unauthenticated /products redirects to login', async () => {
    await page.goto('/products')
    await expect(page.locator(selector('authLoginForm'))).toBeVisible()
    await expect(page).toHaveURL(/\/login\?redirect=/)
  })

  await test.step('authenticated fixture opens Product Center', async () => {
    await installBusinessRuntimeMocks(page)
    await page.goto('/products?dev=1')
    await expect(page.locator(selector('productListPage'))).toBeVisible()
    await expect(page.locator(selector('productRow')).first()).toBeVisible()
  })

  await screenshotEvidence(page, testInfo, 'auth-protected-route')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
