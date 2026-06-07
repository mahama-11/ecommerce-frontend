import { expect, test } from '@playwright/test'
import { ProductDetailPage } from '../pages/ProductDetailPage'
import { ProductListPage } from '../pages/ProductListPage'
import { expectNoInternalTerms } from '../pages/ProductionPages'
import { createEvidenceCollector, expectCleanEvidence, hasSuccessfulApiCall, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks, QA_PRODUCT_SKU } from '../support/harness'
import { selector } from '../support/selectors'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p0 @product-core ecom-product-create-list-detail creates SKU, refetches list, opens detail', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const products = new ProductListPage(page)
  const detail = new ProductDetailPage(page)
  const sku = `QA-CREATED-${testInfo.workerIndex}`
  const title = `Created Business QA ${testInfo.workerIndex}`

  await products.goto()
  await expectNoInternalTerms(page)
  await products.createProduct(sku, title)
  await expect(products.rowBySku(sku)).toBeVisible()
  await expectNoInternalTerms(page)
  await products.openDetailBySku(sku)
  await detail.expectLoadedWithSku(sku)
  await expectNoInternalTerms(page)

  expect(hasSuccessfulApiCall(evidence, call => call.method === 'POST' && call.url.includes('/api/v1/ecommerce/products'))).toBeTruthy()
  expect(hasSuccessfulApiCall(evidence, call => call.method === 'GET' && Boolean(call.url.match(/\/api\/v1\/ecommerce\/products(\?|$)/)))).toBeTruthy()
  expect(hasSuccessfulApiCall(evidence, call => call.method === 'GET' && call.url.includes('/api/v1/ecommerce/products/qa-created-product'))).toBeTruthy()
  await screenshotEvidence(page, testInfo, 'product-create-list-detail')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})

test('@business @p0 @product-entry ecom-product-scoped-visual-entry opens SKU-scoped production route', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const products = new ProductListPage(page)

  await products.goto()
  await expectNoInternalTerms(page)
  await products.openVisualProductionBySku(QA_PRODUCT_SKU)
  await expect(page.locator(selector('productionPrepPage'))).toBeVisible()
  await expect(page).not.toHaveURL(/:productId|:id|\/draw\//)
  await screenshotEvidence(page, testInfo, 'product-scoped-visual-entry')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
