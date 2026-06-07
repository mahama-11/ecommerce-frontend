import { expect, test } from '@playwright/test'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks } from '../support/harness'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p0 @inventory-alerts ecom-inventory-alerts-renders-unread-and-read-groups', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/inventory/alerts?dev=1')
  await expect(page.getByRole('heading', { name: /预警|Alerts/i }).first()).toBeVisible()
  await expect(page.getByText('INV-SKU-001')).toBeVisible()
  await expect(page.getByText('库存低于安全库存，建议补货')).toBeVisible()
  await expect(page.getByText('INV-SKU-002')).toBeVisible()

  await screenshotEvidence(page, testInfo, 'inventory-alerts-render')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})

test('@business @p0 @inventory-alerts ecom-inventory-alerts-mark-all-read', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/inventory/alerts?dev=1')
  await expect(page.getByText(/未读预警/)).toBeVisible()
  await page.getByRole('button', { name: /^全部已读$|^Mark All Read$/ }).click()
  await expect(page.getByText(/已读预警/)).toBeVisible({ timeout: 8000 })

  await screenshotEvidence(page, testInfo, 'inventory-alerts-mark-read')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
