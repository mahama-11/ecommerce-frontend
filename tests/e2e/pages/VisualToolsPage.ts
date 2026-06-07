import { expect, type Locator, type Page } from '@playwright/test'
import { selector } from '../support/selectors'

export class VisualToolsPage {
  constructor(private readonly page: Page) {}

  get root(): Locator { return this.page.locator(selector('visualToolsPage')) }

  async goto(productId?: string) {
    const qs = productId ? `?productId=${encodeURIComponent(productId)}&dev=1` : '?dev=1'
    await this.page.goto(`/products/workbench/visual-tools${qs}`)
    await expect(this.page.getByText(/Product Visual Studio|视觉生产/i).first()).toBeVisible()
  }

  async expectSkuContext(sku: string) {
    await expect(this.page.locator(`[data-sku-code="${sku}"]`).first()).toBeVisible()
  }

  async openTool(toolName: string) {
    const btn = this.page.getByRole('button', { name: new RegExp(toolName, 'i') }).first()
    await expect(btn).toBeVisible()
    await btn.click()
  }
}
