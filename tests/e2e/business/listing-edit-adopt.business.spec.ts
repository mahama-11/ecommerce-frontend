import { expect, test } from '@playwright/test'
import { ProductDetailPage } from '../pages/ProductDetailPage'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks, QA_PRODUCT_ID } from '../support/harness'
import { expectNoInternalTerms } from '../pages/ProductionPages'
import { selector } from '../support/selectors'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p0 @listing-edit-adopt ecom-listing-edit-adopt updates listing and adopts version', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const detail = new ProductDetailPage(page)

  await test.step('Open detail and create listing', async () => {
    await page.goto(`/products/${QA_PRODUCT_ID}?dev=1`)
    await detail.expectLoadedWithSku('QA-BIZ-001')
    await detail.openCreateListing()
    await expect(page.locator(selector('listingCreateSubmit'))).toBeVisible()

    // Fill required fields before submit
    // Labels are in English; scope input search within the label's parent container
    await page.locator('label:has-text("Version Label")').locator('..').locator('input').fill('QA v1')
    await page.locator('label:has-text("Title")').locator('..').locator('input').fill('QA Listing Title')

    const createListingResponse = page.waitForResponse(response =>
      response.request().method() === 'POST' && response.url().includes('/listing-versions'),
    )
    await page.locator(selector('listingCreateSubmit')).click()
    await expect.poll(async () => (await createListingResponse).ok()).toBe(true)
    expect(evidence.apiCalls.some(call => call.method === 'POST' && call.url.includes('/listing-versions'))).toBeTruthy()
    await expectNoInternalTerms(page)
  })

  await test.step('Adopt listing version', async () => {
    await expect(page.locator(selector('listingAdoptSubmit')).first()).toBeVisible()
    const adoptListingResponse = page.waitForResponse(response =>
      response.request().method() === 'POST' && response.url().includes('/adopt'),
    )
    await page.locator(selector('listingAdoptSubmit')).first().click()
    await expect.poll(async () => (await adoptListingResponse).ok()).toBe(true)
    expect(evidence.apiCalls.some(call => call.method === 'POST' && call.url.includes('/adopt'))).toBeTruthy()
    await expectNoInternalTerms(page)
  })

  await screenshotEvidence(page, testInfo, 'listing-edit-adopt')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
