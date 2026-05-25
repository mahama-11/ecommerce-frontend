import { expect, test } from '@playwright/test'
import { expectNoRuntimeErrors, installEcommerceMocks } from './ecommerce-fixtures'

test.beforeEach(async ({ page }) => {
  await installEcommerceMocks(page)
})

test('@smoke Product Center renders authenticated product workflow', async ({ page }) => {
  const errors = await expectNoRuntimeErrors(page)
  await page.goto('/products?dev=1')
  await expect(page.getByText(/商品中心|Product Center/).first()).toBeVisible()
  await expect(page.getByText(/SKU|QA Style Governance/).first()).toBeVisible()
  expect(errors()).toEqual([])
})

test('@smoke Visual Tools route renders SKU-bound generation surface', async ({ page }) => {
  const errors = await expectNoRuntimeErrors(page)
  await page.goto('/products/workbench/visual-tools?dev=1')
  await expect(page.getByText(/Visual Tools/).first()).toBeVisible()
  await expect(page.getByText(/Image generation|图片/).first()).toBeVisible()
  expect(errors()).toEqual([])
})

test('@smoke Production Prep renders fixed decision flow', async ({ page }) => {
  const errors = await expectNoRuntimeErrors(page)
  await page.goto('/products/dev-product/production/prep?dev=1')
  await expect(page.getByText(/Production Prep|出图四问|生产准备/).first()).toBeVisible()
  await expect(page.getByText(/Four choices|出图四问/).first()).toBeVisible()
  expect(errors()).toEqual([])
})
