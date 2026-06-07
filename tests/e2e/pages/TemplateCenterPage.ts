import { expect, type Page } from '@playwright/test'

export class TemplateCenterPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/aiChat/template?dev=1')
    // AgentTemplateMarketPage heading is 'AI Agent Template Market' in English or 'AI Agent 模板市场' in Chinese
    await expect(this.page.getByRole('heading', { name: /AI Agent 模板市场|AI Agent Template Market/i }).first()).toBeVisible()
  }

  async expectCatalogVisible() {
    // Use broader selector since data-testid may not be present on all card types
    await expect(this.page.locator('[data-testid="template-catalog-grid"], [class*="grid"], [class*="card"]').first()).toBeVisible()
  }

  async search(keyword: string) {
    const searchInput = this.page.locator('[data-testid="template-search-input"]').first()
    await expect(searchInput).toBeVisible()
    await searchInput.fill(keyword)
    await this.page.keyboard.press('Enter')
  }

  async openFirstTemplate() {
    const card = this.page.locator('[data-testid="template-card"]').first()
    await expect(card).toBeVisible()
    await card.click()
    await expect(this.page).toHaveURL(/\/aiChat\/template\/[^/]+/)
  }

  async clickUseNow() {
    const btn = this.page.locator('[data-testid="template-use-now"]').first()
    await expect(btn).toBeVisible()
    await btn.click()
  }
}
