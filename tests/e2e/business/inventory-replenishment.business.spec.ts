import { expect, test } from '@playwright/test'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks } from '../support/harness'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p0 @inventory-replenishment ecom-inventory-replenishment-calculates-sample-csv', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/inventory/replenishment?dev=1')
  await expect(page.getByRole('heading', { name: /补货|Replenishment/i }).first()).toBeVisible()
  await page.getByRole('button', { name: /填充示例|Fill Sample/i }).click()
  await expect(page.locator('textarea')).toContainText('AMZ-EAR-1024')
  await page.getByRole('button', { name: /计算|Calculate/ }).first().click()
  await expect(page.getByRole('heading', { name: /计算结果|Calculation Results Overview/i })).toBeVisible({ timeout: 8000 })
  await expect(page.getByText('INV-SKU-001')).toBeVisible()

  await screenshotEvidence(page, testInfo, 'inventory-replenishment-calculate')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})

test('@business @p0 @inventory-replenishment ecom-inventory-replenishment-filters-result-table', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/inventory/replenishment?dev=1')
  await page.getByRole('button', { name: /计算|Calculate/ }).first().click()
  await expect(page.getByText('INV-SKU-001')).toBeVisible({ timeout: 8000 })
  await page.getByPlaceholder(/搜索 SKU|Search/i).fill('INV-SKU-001')
  await expect(page.getByText('QA Inventory Product')).toBeVisible()

  await screenshotEvidence(page, testInfo, 'inventory-replenishment-filter')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
