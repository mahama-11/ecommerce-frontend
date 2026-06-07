import { expect, test } from '@playwright/test'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks, QA_PRODUCT_ID } from '../support/harness'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p0 @tool-page ecom-tool-page-product-scoped-context-loads', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto(`/products/${QA_PRODUCT_ID}/ai/scene-image?dev=1`)
  await expect(page.getByText(/商品上下文 AI 工作区|Product-scoped AI workspace/)).toBeVisible()
  await expect(page.getByText(/当前绑定 QA-BIZ-001|Bound to QA-BIZ-001/)).toBeVisible()
  await expect(page.locator('[data-testid="ai-product-canvas"]')).toBeVisible()

  await screenshotEvidence(page, testInfo, 'tool-page-product-context')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})

test('@business @p0 @tool-page ecom-tool-page-text-to-image-generation-shows-result', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto(`/products/${QA_PRODUCT_ID}/ai/scene-image?dev=1`)
  await expect(page.locator('[data-testid="ai-product-canvas"]')).toBeVisible()
  await page.getByPlaceholder(/描述你想要生成的图片效果|Describe/i).fill('生成一张干净的厨房场景背景图')
  await page.getByRole('button', { name: /开始生成|Generate/ }).click()
  await expect(page.locator('[data-testid="result-preview-image"]')).toBeVisible({ timeout: 12000 })

  await screenshotEvidence(page, testInfo, 'tool-page-text-generation-result')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
