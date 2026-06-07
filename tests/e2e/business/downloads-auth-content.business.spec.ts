import { expect, test } from '@playwright/test'
import { DownloadsPage } from '../pages/DownloadsPage'
import { createEvidenceCollector, expectCleanEvidence, hasSuccessfulApiCall, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks, QA_PRODUCT_ID } from '../support/harness'
import { expectNoInternalTerms } from '../pages/ProductionPages'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p0 @downloads ecom-downloads-auth-content surfaces download records and authenticated download action', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const downloads = new DownloadsPage(page)

  await test.step('Downloads page renders with records', async () => {
    await downloads.goto([QA_PRODUCT_ID])
    await downloads.expectDownloadCardVisible()
    await expectNoInternalTerms(page)
  })

  await test.step('Download button emits a successful content download request', async () => {
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
  })

  await screenshotEvidence(page, testInfo, 'downloads-auth-content')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
