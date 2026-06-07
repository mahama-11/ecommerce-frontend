import { expect, test } from '@playwright/test'
import { expectNoRuntimeErrors, installEcommerceMocks } from './ecommerce-fixtures'

test.beforeEach(async ({ page }) => {
  await installEcommerceMocks(page)
})

test('@smoke Product Center renders authenticated product workflow', async ({ page }) => {
  const errors = await expectNoRuntimeErrors(page)
  await page.goto('/products?dev=1')
  await expect(page.getByTestId('product-list-page')).toBeVisible()
  await expect(page.getByRole('heading', { name: /商品队列工作台|SKU queue workspace/i })).toBeVisible()
  await expect(page.getByText(/QA-STYLE-001|QA Style Governance SKU/).first()).toBeVisible()
  expect(errors()).toEqual([])
})

test('@smoke Visual Tools route renders SKU-bound generation surface', async ({ page }) => {
  const errors = await expectNoRuntimeErrors(page)
  await page.goto('/products/workbench/visual-tools?dev=1')
  await expect(page.getByText(/Product Visual Studio|视觉生产/i).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /Create product visuals|创建商品视觉/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Generate Product Visuals|生成商品视觉/i }).first()).toBeVisible()
  expect(errors()).toEqual([])
})

test('@smoke Production Prep renders fixed decision flow', async ({ page }) => {
  const errors = await expectNoRuntimeErrors(page)
  await page.goto('/products/dev-product/production/prep?dev=1')
  await expect(page.getByText(/Production Prep|出图四问|生产准备/).first()).toBeVisible()
  await expect(page.getByText(/Four choices|出图四问/).first()).toBeVisible()
  expect(errors()).toEqual([])
})
