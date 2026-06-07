import { expect, test } from '@playwright/test'
import { createEvidenceCollector, expectCleanEvidence, hasSuccessfulApiCall, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks } from '../support/harness'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p1 @inventory-expanded ecom-inventory-expanded-product-inbound-analysis-settings-routes-render-business-data', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const routes = [
    { path: '/inventory/products?dev=1', expected: /商品|产品|Product|库存|INV-SKU/i },
    { path: '/inventory/inbound?dev=1', expected: /入库|Inbound|库存|到货/i },
    { path: '/inventory/analysis?dev=1', expected: /分析|Analysis|销量|Sales|库存/i },
    { path: '/inventory/settings?dev=1', expected: /设置|Settings|安全库存|alert|默认/i },
  ]

  for (const route of routes) {
    await test.step(`Inventory route ${route.path} renders`, async () => {
      await page.goto(route.path)
      await expect(page).not.toHaveURL(/\/login/)
      await expect(page.locator('body')).toContainText(route.expected, { timeout: 10_000 })
    })
  }

  await screenshotEvidence(page, testInfo, 'inventory-expanded-routes')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})

test('@business @p1 @inventory-expanded ecom-inventory-expanded-dashboard-filter-and-api-readback', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  await page.goto('/inventory?dev=1')
  await expect(page.locator('[data-testid="inventory-dashboard-page"]')).toBeVisible()
  await expect.poll(() => hasSuccessfulApiCall(evidence, call => call.url.includes('/inventory/stats'))).toBe(true)
  await expect.poll(() => hasSuccessfulApiCall(evidence, call => call.url.includes('/inventory/products'))).toBe(true)

  const search = page.getByPlaceholder(/搜索|Search|SKU|商品/i).first()
  if (await search.count()) {
    await search.fill('INV-SKU-001')
    await expect(page.locator('[data-testid="inventory-product-row"]').first()).toBeVisible()
  }

  await screenshotEvidence(page, testInfo, 'inventory-dashboard-filter-readback')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
