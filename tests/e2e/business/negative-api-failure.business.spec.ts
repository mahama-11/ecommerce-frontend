import { expect, test } from '@playwright/test'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { selector } from '../support/selectors'

test('@business @p0 @negative ecom-negative-api-failure shows user-facing error on product list failure', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await test.step('Inject dev session but mock API failure', async () => {
    await page.addInitScript(() => {
      window.localStorage.setItem('ecommerce_access_token', 'dev-fail-token')
    })
    await page.route('**/api/v1/ecommerce/products', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, message: 'Internal server error', data: null }) })
    })
  })

  await test.step('Product list shows error state, not infinite loading', async () => {
    await page.goto('/products?dev=1')
    await expect(page.locator(selector('productListPage'))).toBeVisible()
    await expect(page.getByText(/error|失败|retry|重试/i).first()).toBeVisible({ timeout: 10000 })
  })

  await screenshotEvidence(page, testInfo, 'negative-api-failure')
  // Allow console errors for this negative test since API 500 is expected to log
  const clean = expectCleanEvidence(evidence)
  expect(clean.networkFailures).toEqual([])
})
