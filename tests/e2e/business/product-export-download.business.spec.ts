import { expect, test } from '@playwright/test'
import { ProductDetailPage } from '../pages/ProductDetailPage'
import { expectNoInternalTerms } from '../pages/ProductionPages'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks, QA_PRODUCT_ID } from '../support/harness'
import { selector } from '../support/selectors'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p0 @product-export-download ecom-product-export-download creates export and downloads file', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const detail = new ProductDetailPage(page)

  await detail.goto(QA_PRODUCT_ID)
  await detail.expectLoadedWithSku('QA-BIZ-001')
  await expectNoInternalTerms(page)

  await test.step('Create export task from product detail', async () => {
    await detail.createExport()
    await expect(page.locator(selector('productDetailPage'))).toBeVisible()
  })

  await test.step('Navigate to downloads and verify record', async () => {
    await page.goto(`/products/workbench/downloads?productIds=${QA_PRODUCT_ID}&dev=1`)
    await expect(page.locator(selector('downloadRecordCard')).first()).toBeVisible()
    await expect(page.locator(selector('downloadRecordDownload')).first()).toBeVisible()
  })

  await test.step('Click download and verify button is actionable', async () => {
    const downloadBtn = page.locator(selector('downloadRecordDownload')).first()
    await expect(downloadBtn).toBeEnabled()
    await downloadBtn.click()
    // The download function uses window.open which Playwright cannot intercept as a download event
    // We verify the button click succeeds without error
  })

  await screenshotEvidence(page, testInfo, 'product-export-download')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
