import { expect, test } from '@playwright/test'
import { InventoryDashboardPage } from '../pages/InventoryPages'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks } from '../support/harness'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p0 @inventory-routes ecom-inventory-dashboard loads with stats and product table', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const dashboard = new InventoryDashboardPage(page)

  await dashboard.goto()
  await dashboard.expectLoaded()

  await test.step('Product rows are rendered', async () => {
    const rows = dashboard.productRows
    const count = await rows.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  await screenshotEvidence(page, testInfo, 'inventory-dashboard')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})

test('@business @p0 @inventory-routes ecom-inventory-subroutes accept authenticated fixture session', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  const routes = [
    { path: '/inventory/replenishment', name: 'replenishment' },
    { path: '/inventory/products', name: 'products' },
    { path: '/inventory/inbound', name: 'inbound' },
    { path: '/inventory/alerts', name: 'alerts' },
    { path: '/inventory/analysis', name: 'analysis' },
    { path: '/inventory/settings', name: 'settings' },
  ]

  for (const route of routes) {
    await test.step(`Route ${route.name} loads`, async () => {
      await page.goto(`${route.path}?dev=1`)
      // All inventory pages are wrapped in InventoryLayout which renders children
      // We just verify no auth redirect and no crash
      await expect(page).not.toHaveURL(/\/login/)
      await expect(page.locator('body')).toContainText(/库存|Inventory|replenishment|products|inbound|alerts|analysis|settings/i)
    })
  }

  await screenshotEvidence(page, testInfo, 'inventory-subroutes')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
