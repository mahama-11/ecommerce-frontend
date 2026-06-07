import { expect, test } from '@playwright/test'
import { DownloadsPage } from '../pages/DownloadsPage'
import { createEvidenceCollector, expectCleanEvidence, hasSuccessfulApiCall, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks, QA_PRODUCT_ID } from '../support/harness'
import { expectNoInternalTerms } from '../pages/ProductionPages'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p1 @downloads-delivery ecom-downloads-delivery-filter-preview-and-auth-boundary', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const downloads = new DownloadsPage(page)

  await downloads.goto([QA_PRODUCT_ID])
  await downloads.expectDownloadCardVisible()
  await expect(page.locator('body')).toContainText(/QA-BIZ-001|Business QA SKU|amazon|csv/i)

  const search = page.locator('input[placeholder*="Product"], input[placeholder*="SKU"], input[placeholder*="搜索"], input[placeholder*="任务"]').filter({ visible: true }).first()
  if (await search.count()) {
    await search.fill('QA-BIZ-001')
    await expect(page.locator('[data-testid="download-record-card"]').first()).toBeVisible()
    await search.fill('NO-SUCH-DOWNLOAD')
    await expect(page.locator('body')).toContainText(/没有|暂无|No/i)
    await search.fill('QA-BIZ-001')
  }

  const downloadResponse = page.waitForResponse(response =>
    response.request().method() === 'GET'
    && response.url().includes('/api/v1/ecommerce/')
    && (response.url().endsWith('/content') || response.url().endsWith('/download'))
    && response.status() >= 200
    && response.status() < 300,
  )
  await downloads.clickFirstDownload()
  await downloadResponse
  await expect.poll(() => hasSuccessfulApiCall(evidence, call => call.method === 'GET' && call.url.includes('/api/v1/ecommerce/') && (call.url.endsWith('/content') || call.url.endsWith('/download')))).toBe(true)
  await expect(page.locator('[data-testid="download-record-download"]').first()).toBeEnabled()
  await expectNoInternalTerms(page)

  await screenshotEvidence(page, testInfo, 'downloads-delivery-filter-preview')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})

test('@business @p1 @downloads-delivery ecom-downloads-delivery-failed-record-is-not-downloadable', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  await page.route('**/api/v1/ecommerce/downloads**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data: [{ id: 'download-failed-1', status: 'failed', downloadable: false, product_id: QA_PRODUCT_ID, product_title: 'Business QA SKU', product_sku: 'QA-BIZ-001', platform: 'amazon', site: 'US', locale: 'en_US', format: 'csv', asset_count: 0, download_file_name: '', created_at: new Date().toISOString() }] }),
    })
  })

  await page.goto(`/products/workbench/downloads?productIds=${QA_PRODUCT_ID}&dev=1`)
  await expect(page.locator('[data-testid="download-record-card"]').first()).toBeVisible()
  await expect(page.locator('body')).toContainText(/failed|失败|不可下载|待处理/i)
  await expect(page.locator('[data-testid="download-record-download"]').first()).toBeDisabled()

  await screenshotEvidence(page, testInfo, 'downloads-delivery-failed-state')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
