import { expect, test } from '@playwright/test'
import { installEcommerceMocks } from './ecommerce-fixtures'

const routes = [
  ['product-center', '/products?dev=1', /商品中心|Product Center/],
  ['visual-tools', '/products/workbench/visual-tools?dev=1', /Visual Tools/],
  ['production-prep', '/products/dev-product/production/prep?dev=1', /Production Prep|出图四问|生产准备/],
] as const

test.beforeEach(async ({ page }) => {
  await installEcommerceMocks(page)
})

for (const [id, route, readyText] of routes) {
  test(`@visual ${id} screenshot matches baseline`, async ({ page }) => {
    await page.goto(route)
    await expect(page.getByText(readyText).first()).toBeVisible()
    await page.addStyleTag({ content: '* { caret-color: transparent !important; }' })
    await expect(page).toHaveScreenshot(`${id}.png`, { fullPage: true })
  })
}
