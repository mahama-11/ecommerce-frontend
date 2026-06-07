import { expect, test } from '@playwright/test'
import { ProductDetailPage } from '../pages/ProductDetailPage'
import { expectNoInternalTerms } from '../pages/ProductionPages'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks, QA_PRODUCT_ID } from '../support/harness'
import { selector } from '../support/selectors'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p0 @product-detail-pipeline ecom-product-detail-pipeline exposes AI pipeline header, health badge, stages and next-action card', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const detail = new ProductDetailPage(page)

  await detail.goto(QA_PRODUCT_ID)
  await detail.expectLoadedWithSku('QA-BIZ-001')
  await expectNoInternalTerms(page)

  await test.step('AI Pipeline section is visible', async () => {
    await detail.expectAIPipelineVisible()
  })

  await test.step('Pipeline header with SKU and metrics', async () => {
    await detail.expectPipelineHeaderVisible()
    await expect(page.locator(selector('productDetailHeader'))).toContainText('QA-BIZ-001')
  })

  await test.step('Health badge shows readiness state', async () => {
    await detail.expectHealthBadgeVisible()
  })

  await test.step('Primary CTA performs the next action', async () => {
    await detail.expectPrimaryCtaVisible()
    const cta = page.locator(selector('productDetailPrimaryCta'))
    await expect(cta).toBeEnabled()
    await cta.click()
    await expect(page.locator(selector('exportCreateSubmit'))).toBeVisible()
    await page.getByRole('button', { name: /cancel|取消|product\.detail\.exportModal\.cancel/i }).last().click()
    await expect(page.locator(selector('exportCreateSubmit'))).toBeHidden()
  })

  await test.step('Parsed info panel visible', async () => {
    await detail.expectParsedInfoPanelVisible()
  })

  await test.step('Prompt versions panel visible', async () => {
    await detail.expectPromptVersionsPanelVisible()
  })

  await test.step('Prompt generate CTA routes to Sandbox composer', async () => {
    await page.locator(selector('productPromptGenerateButton')).click()
    await expect(page).toHaveURL(/\/products\/qa-business-product\/production\/sandbox.*source=sku-detail-prompt/)
    await detail.goto(QA_PRODUCT_ID)
  })

  await test.step('Next action card with button visible', async () => {
    await detail.expectNextActionCardVisible()
    await expect(page.locator(selector('pipelineNextActionButton'))).toBeVisible()
  })

  await test.step('Pipeline stages show status badges', async () => {
    for (const stageKey of ['base-info', 'parsed-info', 'prompt', 'assets-listing', 'export-ready']) {
      await expect(page.locator(`[data-testid="pipeline-step-status-${stageKey}"]`)).toBeVisible()
    }
  })

  await screenshotEvidence(page, testInfo, 'product-detail-pipeline')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
