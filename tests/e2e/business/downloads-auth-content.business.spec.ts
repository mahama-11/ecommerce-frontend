import { expect, test } from '@playwright/test'
import { DownloadsPage } from '../pages/DownloadsPage'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
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

  await test.step('Download button is visible and clickable', async () => {
    await downloads.clickFirstDownload()
    expect(evidence.apiCalls.some(call => call.method === 'GET' && call.url.includes('/api/v1/ecommerce/downloads'))).toBeTruthy()
  })

  await screenshotEvidence(page, testInfo, 'downloads-auth-content')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
