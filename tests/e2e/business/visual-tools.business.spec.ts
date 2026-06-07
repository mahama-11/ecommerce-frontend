import { expect, test } from '@playwright/test'
import { VisualToolsPage } from '../pages/VisualToolsPage'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks, QA_PRODUCT_SKU } from '../support/harness'
import { expectNoInternalTerms } from '../pages/ProductionPages'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p1 @visual-tools ecom-visual-tools-entry opens SKU-scoped visual tools workspace', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const visual = new VisualToolsPage(page)

  await test.step('Visual Tools renders with product context', async () => {
    await visual.goto()
    await expect(page.getByRole('heading', { name: /Create product visuals|创建商品视觉|视觉工具/i })).toBeVisible()
    await expectNoInternalTerms(page)
  })

  await test.step('SKU-scoped entry carries product context', async () => {
    await visual.goto(QA_PRODUCT_SKU)
    // ProductVisualToolsPage uses data-page-shell="production-station" instead of data-testid
    await expect(page.locator('[data-page-shell="production-station"]')).toBeVisible()
    await expect(page).not.toHaveURL(/:productId|:id/)
    await expectNoInternalTerms(page)
  })

  await screenshotEvidence(page, testInfo, 'visual-tools-entry')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
