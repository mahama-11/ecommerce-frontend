import { expect, test } from '@playwright/test'
import { ProductDetailPage } from '../pages/ProductDetailPage'
import { ProductionPrepPage, ProductionSandboxPage, ProductionWorkshopPage, expectNoInternalTerms } from '../pages/ProductionPages'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks, QA_PRODUCT_ID } from '../support/harness'
import { selector } from '../support/selectors'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p0 @production-prep-sandbox ecom-production-prep-sandbox-workshop exposes Prep/Sandbox/Workshop controls without internal copy leakage', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const prep = new ProductionPrepPage(page)
  const sandbox = new ProductionSandboxPage(page)
  const workshop = new ProductionWorkshopPage(page)

  await test.step('Prep exposes source uploads, parse CTA and fixed-choice contract', async () => {
    await prep.goto(QA_PRODUCT_ID)
    await prep.expectSelectorContract()
    await expectNoInternalTerms(page)
  })

  await test.step('Sandbox exposes prompt compose and generation readiness gates', async () => {
    await sandbox.goto(QA_PRODUCT_ID)
    await sandbox.expectReadinessControls()
    await expect(page.locator(selector('productionGenerationStart'))).toBeVisible()
    await expectNoInternalTerms(page)
  })

  await test.step('Workshop opens only as result workspace and does not expose placeholders in URL', async () => {
    await workshop.goto(QA_PRODUCT_ID)
    await expect(page).not.toHaveURL(/:productId|:id/)
    await expect(page.locator(selector('productionWorkshopPage'))).toBeVisible()
    await expectNoInternalTerms(page)
  })

  await screenshotEvidence(page, testInfo, 'production-prep-sandbox-workshop')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})

test('@business @p0 @listing-export-download ecom-listing-export-download surfaces listing/export/download selectors', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const detail = new ProductDetailPage(page)

  await page.goto(`/products/${QA_PRODUCT_ID}?dev=1`)
  await detail.expectLoadedWithSku('QA-BIZ-001')
  await expectNoInternalTerms(page)
  await detail.openCreateListing()
  await expect(page.locator(selector('listingCreateSubmit'))).toBeVisible()
  await detail.closeListingModal()

  await expect(page.locator(selector('listingAdoptSubmit')).first()).toBeVisible()
  await detail.openExport()
  await expect(page.locator(selector('exportCreateSubmit'))).toBeVisible()

  await page.goto(`/products/workbench/downloads?productIds=${QA_PRODUCT_ID}&dev=1`)
  await expect(page.locator(selector('downloadRecordCard')).first()).toBeVisible()
  await expect(page.locator(selector('downloadRecordDownload')).first()).toBeVisible()

  await screenshotEvidence(page, testInfo, 'listing-export-download')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
