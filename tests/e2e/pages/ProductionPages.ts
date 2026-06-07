import { expect, type Page } from '@playwright/test'
import { INTERNAL_TERM_PATTERNS, selector } from '../support/selectors'

export class ProductionPrepPage {
  constructor(private readonly page: Page) {}

  async goto(productId: string) {
    await this.page.goto(`/products/${productId}/production/prep?dev=1`)
    await expect(this.page.locator(selector('productionPrepPage'))).toBeVisible()
  }

  async expectSelectorContract() {
    await expect(this.page.locator(selector('productionSourceUploadSku'))).toBeVisible()
    await expect(this.page.locator(selector('productionSourceUploadReference'))).toBeVisible()
    await expect(this.page.locator(selector('productionParseStart'))).toBeVisible()
  }
}

export class ProductionSandboxPage {
  constructor(private readonly page: Page) {}

  async goto(productId: string) {
    await this.page.goto(`/products/${productId}/production/sandbox?dev=1`)
    await expect(this.page.locator(selector('productionSandboxPage'))).toBeVisible()
  }

  async expectReadinessControls() {
    await expect(this.page.locator(selector('productionPromptCompose'))).toBeVisible()
    await expect(this.page.locator(selector('productionGenerationStart'))).toBeVisible()
  }
}

export class ProductionWorkshopPage {
  constructor(private readonly page: Page) {}

  async goto(productId: string) {
    await this.page.goto(`/products/${productId}/production/workshop?dev=1`)
    await expect(this.page.locator(selector('productionWorkshopPage'))).toBeVisible()
  }
}

export async function expectNoInternalTerms(page: Page) {
  const bodyText = await page.locator('body').innerText()
  for (const pattern of INTERNAL_TERM_PATTERNS) {
    expect(bodyText, `user-facing page should not expose ${pattern}`).not.toMatch(pattern)
  }
}
