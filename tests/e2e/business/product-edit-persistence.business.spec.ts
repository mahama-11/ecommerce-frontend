import { expect, test } from '@playwright/test'
import { ProductDetailPage } from '../pages/ProductDetailPage'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks, QA_PRODUCT_ID } from '../support/harness'
import { expectNoInternalTerms } from '../pages/ProductionPages'
import { selector } from '../support/selectors'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p0 @product-edit ecom-product-edit-persistence updates title and retains after reload', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const detail = new ProductDetailPage(page)

  await test.step('Open detail, edit title, and assert PATCH payload', async () => {
    await page.goto(`/products/${QA_PRODUCT_ID}?dev=1`)
    await detail.expectLoadedWithSku('QA-BIZ-001')
    await expectNoInternalTerms(page)

    const nextTitle = `Business QA SKU Edited ${Date.now()}`
    const titleInput = page.locator(selector('productDetailTitleInput'))
    await expect(titleInput).toHaveValue('Business QA SKU')
    const patchPromise = page.waitForResponse(response => {
      const request = response.request()
      return request.method() === 'PATCH' && response.url().includes(`/products/${QA_PRODUCT_ID}`)
    })
    await titleInput.fill(nextTitle)
    await titleInput.blur()
    const patchResponse = await patchPromise
    expect(patchResponse.ok()).toBeTruthy()
    expect(JSON.parse(patchResponse.request().postData() || '{}')).toMatchObject({ title: nextTitle })
    await expect(page.locator(selector('productDetailSaveStatus'))).toBeVisible()
    await expect(page.getByText(nextTitle).first()).toBeVisible()
  })

  await test.step('Reload retains edited product context from mock readback', async () => {
    const editedTitle = await page.locator(selector('productDetailTitleInput')).inputValue()
    await page.reload()
    await detail.expectLoadedWithSku('QA-BIZ-001')
    await expect(page.locator(selector('productDetailTitleInput'))).toHaveValue(editedTitle)
    await expect(page.getByText(editedTitle).first()).toBeVisible()
    await expectNoInternalTerms(page)
  })

  await screenshotEvidence(page, testInfo, 'product-edit-persistence')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
