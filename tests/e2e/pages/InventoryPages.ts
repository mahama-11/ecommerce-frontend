import { expect, type Page } from '@playwright/test'
import { selector } from '../support/selectors'

export class InventoryDashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/inventory?dev=1')
    await expect(this.page.locator(selector('inventoryDashboardPage'))).toBeVisible()
  }

  async expectLoaded() {
    await expect(this.page.locator(selector('inventoryDashboardTitle'))).toBeVisible()
    await expect(this.page.locator(selector('inventoryStatsPanel'))).toBeVisible()
    await expect(this.page.locator(selector('inventoryProductTable'))).toBeVisible()
    await expect(this.page.locator(selector('inventoryTableToolbar'))).toBeVisible()
  }

  get productRows() {
    return this.page.locator(selector('inventoryProductRow'))
  }
}
