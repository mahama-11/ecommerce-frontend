import { expect, test } from '@playwright/test'
import { installEcommerceMocks } from './ecommerce-fixtures'

const routes = [
  ['product-center', '/products?dev=1', /商品队列工作台|SKU 工作台|SKU queue/i],
  ['visual-tools', '/products/workbench/visual-tools?dev=1', /Product Visual Studio|Create product visuals/i],
  ['production-prep', '/products/dev-product/production/prep?dev=1', /Production Prep|出图四问|生产准备/],
  ['production-sandbox', '/products/dev-product/production/sandbox?dev=1', /策略输入摘要|出图方案|Production Sandbox/],
  ['production-workshop', '/products/dev-product/production/workshop?dev=1', /版本谱系|生成结果|Production Workshop/],
] as const

test.beforeEach(async ({ page }) => {
  await installEcommerceMocks(page)
})

for (const [id, route, readyText] of routes) {
  test(`@visual ${id} screenshot matches baseline`, async ({ page }) => {
    await page.goto(route)
    await expect(page.getByText(readyText).first()).toBeVisible()
    await page.waitForLoadState('networkidle')
    if (id === 'production-workshop') {
      await page.waitForFunction(() => document.images.length >= 6, null, { timeout: 10000 })
    }
    await page.waitForFunction(() => Array.from(document.images).every(image => image.complete && image.naturalWidth > 0), null, { timeout: 10000 })
    await page.evaluate(async () => {
      await Promise.all(Array.from(document.images).map(async image => {
        if (image.complete && image.naturalWidth > 0) return
        try { await image.decode() } catch { /* ignore broken fixture images; network failures are checked elsewhere */ }
      }))
      window.scrollTo(0, 0)
    })
    await page.addStyleTag({ content: '* { caret-color: transparent !important; }' })
    await expect(page).toHaveScreenshot(`${id}.png`, { fullPage: true })
  })
}
