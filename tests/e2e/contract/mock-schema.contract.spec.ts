import { expect, test } from '@playwright/test'
import { installBusinessRuntimeMocks, QA_PRODUCT_ID } from '../support/harness'

async function jsonFetch(page: import('@playwright/test').Page, path: string, init?: RequestInit) {
  return page.evaluate(
    async ({ path, init }) => {
      const response = await fetch(path, init)
      const contentType = response.headers.get('content-type') ?? ''
      const body = contentType.includes('application/json') ? await response.json() : await response.text()
      return { status: response.status, contentType, body }
    },
    { path, init },
  )
}

function expectEnvelope(payload: unknown) {
  expect(payload).toMatchObject({ code: expect.any(Number), message: expect.any(String) })
  expect(payload).toHaveProperty('data')
}

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
  await page.goto('/home?dev=1')
})

test('@contract @mock-schema ecommerce mock auth/template/commercial endpoints match envelope schema', async ({ page }) => {
  const endpoints = [
    '/api/v1/ecommerce/auth/session',
    '/api/v1/ecommerce/auth/me',
    '/api/v1/ecommerce/template-center/catalog/recommendations?locale=zh',
    '/api/v1/ecommerce/template-center/catalog/facets?locale=zh',
    '/api/v1/ecommerce/template-center/catalog?locale=zh',
    '/api/v1/ecommerce/template-center/favorites?locale=zh',
    '/api/v1/ecommerce/commercial/offerings',
    '/api/v1/ecommerce/wallet/summary',
    '/api/v1/ecommerce/billing/summary',
    '/api/v1/ecommerce/workflow/events',
  ]

  for (const endpoint of endpoints) {
    await test.step(`GET ${endpoint}`, async () => {
      const res = await jsonFetch(page, endpoint)
      expect(res.status).toBe(200)
      expectEnvelope(res.body)
    })
  }
})

test('@contract @mock-schema ecommerce mock product/listing/export endpoints match schema', async ({ page }) => {
  const list = await jsonFetch(page, '/api/v1/ecommerce/products')
  expect(list.status).toBe(200)
  expectEnvelope(list.body)
  expect(Array.isArray(list.body.data)).toBe(true)
  expect(list.body.data[0]).toMatchObject({ id: expect.any(String), sku_code: expect.any(String), title: expect.any(String), status: expect.any(String) })

  const created = await jsonFetch(page, '/api/v1/ecommerce/products', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sku_code: 'CONTRACT-SKU-001', title: 'Contract SKU' }),
  })
  expect(created.status).toBe(200)
  expect(created.body.data).toMatchObject({ id: expect.any(String), sku_code: 'CONTRACT-SKU-001', title: 'Contract SKU' })

  const detail = await jsonFetch(page, `/api/v1/ecommerce/products/${QA_PRODUCT_ID}`)
  expect(detail.status).toBe(200)
  expect(detail.body.data).toMatchObject({ product: expect.any(Object), assets: expect.any(Array), listing_versions: expect.any(Array), export_tasks: expect.any(Array) })

  const patched = await jsonFetch(page, `/api/v1/ecommerce/products/${QA_PRODUCT_ID}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Patched Contract SKU' }),
  })
  expect(patched.status).toBe(200)
  expect(patched.body.data).toMatchObject({ title: 'Patched Contract SKU' })

  const listing = await jsonFetch(page, `/api/v1/ecommerce/products/${QA_PRODUCT_ID}/listing-versions`, { method: 'POST' })
  expect(listing.status).toBe(200)
  expect(listing.body.data).toMatchObject({ id: expect.any(String), status: expect.any(String) })

  const adopt = await jsonFetch(page, `/api/v1/ecommerce/products/${QA_PRODUCT_ID}/listing-versions/listing-v1/adopt`, { method: 'POST' })
  expect(adopt.status).toBe(200)
  expect(adopt.body.data).toMatchObject({ ok: true })

  const exportTask = await jsonFetch(page, '/api/v1/ecommerce/export-tasks', { method: 'POST' })
  expect(exportTask.status).toBe(200)
  expect(exportTask.body.data).toMatchObject({ id: expect.any(String), status: expect.any(String) })

  const downloads = await jsonFetch(page, '/api/v1/ecommerce/downloads')
  expect(downloads.status).toBe(200)
  expect(Array.isArray(downloads.body.data)).toBe(true)
})

test('@contract @mock-schema ecommerce mock production/image endpoints match schema', async ({ page }) => {
  const endpoints = [
    '/api/v1/ecommerce/v2/visual-workflows/sessions',
    '/api/v1/ecommerce/v2/visual-workflows/session-qa-1/stage-view',
    '/api/v1/ecommerce/v2/visual-workflows/session-qa-1/generation-versions',
    '/api/v1/ecommerce/image-jobs?sceneType=scene&productID=qa-business-product&limit=6',
  ]

  for (const endpoint of endpoints) {
    const res = await jsonFetch(page, endpoint)
    expect(res.status).toBe(200)
    expectEnvelope(res.body)
  }

  const promptJob = await jsonFetch(page, '/api/v1/ecommerce/v2/visual-workflows/session-qa-1/prompt-planner-jobs', { method: 'POST' })
  expect(promptJob.body.data).toMatchObject({ status: expect.any(String) })

  const fanout = await jsonFetch(page, '/api/v1/ecommerce/v2/visual-workflows/session-qa-1/generation-version-fanouts', { method: 'POST' })
  expect(fanout.body.data).toMatchObject({ batch_id: expect.any(String), tasks: expect.any(Array) })

  const imageJob = await jsonFetch(page, '/api/v1/ecommerce/image-jobs', { method: 'POST' })
  expect(imageJob.body.data).toMatchObject({ job_id: expect.any(String), status: expect.any(String), progress: expect.any(Number) })
})

test('@contract @mock-schema ecommerce mock inventory endpoints match schema', async ({ page }) => {
  const stats = await jsonFetch(page, '/api/v1/ecommerce/inventory/stats')
  expect(stats.status).toBe(200)
  expect(stats.body.data).toMatchObject({ totalQuantity: expect.any(Number), skuCount: expect.any(Number) })

  const products = await jsonFetch(page, '/api/v1/ecommerce/inventory/products', { method: 'POST' })
  expect(products.body.data).toMatchObject({ items: expect.any(Array), total: expect.any(Number), page: expect.any(Number), pageSize: expect.any(Number) })
  expect(products.body.data.items[0]).toMatchObject({ sku: expect.any(String), title: expect.any(String), available: expect.any(Number) })

  const alerts = await jsonFetch(page, '/api/v1/ecommerce/inventory/alerts')
  expect(Array.isArray(alerts.body.data)).toBe(true)
  expect(alerts.body.data[0]).toMatchObject({ id: expect.any(String), sku: expect.any(String), alertLevel: expect.any(String), read: expect.any(Boolean) })

  const markRead = await jsonFetch(page, '/api/v1/ecommerce/inventory/alerts/alert-qa-1/read', { method: 'PATCH' })
  expect(markRead.body.data).toMatchObject({ ok: true })

  const replenish = await jsonFetch(page, '/api/v1/ecommerce/inventory/replenishment/calculate', { method: 'POST' })
  expect(replenish.body.data).toMatchObject({ id: expect.any(String), rows: expect.any(Array), totalSuggested: expect.any(Number) })
})
