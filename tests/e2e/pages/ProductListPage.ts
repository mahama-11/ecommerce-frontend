import { expect, type Locator, type Page } from '@playwright/test'
import { selector } from '../support/selectors'

export class ProductListPage {
  constructor(private readonly page: Page) {}

  get root(): Locator { return this.page.locator(selector('productListPage')) }
  get rows(): Locator { return this.page.locator(selector('productRow')) }

  async goto() {
    await this.page.goto('/products?dev=1')
    await expect(this.root).toBeVisible()
  }

  async createProduct(sku: string, title: string) {
    await this.page.locator(selector('productCreateOpen')).click()
    await this.page.locator(selector('productCreateSkuCode')).fill(sku)
    await this.page.locator(selector('productCreateTitle')).fill(title)
    await this.page.locator(selector('productCreateSubmit')).click()
  }

  rowBySku(sku: string) {
    return this.page.locator(`${selector('productRow')}[data-sku-code="${sku}"]`)
  }

  async openDetailBySku(sku: string) {
    const row = this.rowBySku(sku)
    await expect(row).toBeVisible()
    await row.locator(selector('productRowOpenDetail')).click()
    await expect(this.page).toHaveURL(/\/products\/[^/?#]+/)
  }

  async openVisualProductionBySku(sku: string) {
    const row = this.rowBySku(sku)
    await expect(row).toBeVisible()
    await row.locator(selector('productVisualEntry')).click()
    await expect(this.page).toHaveURL(/\/products\/[^/?#]+\/production\/prep/)
  }
}
