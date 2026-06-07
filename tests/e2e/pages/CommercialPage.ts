import { expect, type Page } from '@playwright/test'

export class CommercialPage {
  constructor(private readonly page: Page) {}

  async gotoBilling() {
    await this.page.goto('/account/billing?dev=1')
    await expect(this.page.getByRole('heading', { name: /Billing|账单|Wallet|钱包/i }).first()).toBeVisible()
  }

  async gotoOfferings() {
    await this.page.goto('/account/offerings?dev=1')
    await expect(this.page.getByRole('heading', { name: /Offerings|套餐|Pricing/i }).first()).toBeVisible()
  }

  async expectOfferingsVisible() {
    await expect(this.page.locator('[data-testid="commercial-offering-card"]').first()).toBeVisible()
  }

  async clickFirstOffering() {
    const card = this.page.locator('[data-testid="commercial-offering-card"]').first()
    await expect(card).toBeVisible()
    await card.click()
  }

  async confirmOrder() {
    const btn = this.page.locator('[data-testid="commercial-order-confirm"]').first()
    await expect(btn).toBeVisible()
    await btn.click()
  }
}
