import { expect, type Locator, type Page } from '@playwright/test'
import { selector } from '../support/selectors'

export class ProductDetailPage {
  constructor(private readonly page: Page) {}

  get root(): Locator { return this.page.locator(selector('productDetailPage')) }

  async goto(productId: string) {
    await this.page.goto(`/products/${productId}?dev=1`)
    await expect(this.root).toBeVisible()
  }

  async expectLoadedWithSku(sku: string) {
    await expect(this.root).toBeVisible()
    await expect(this.root).toHaveAttribute('data-sku-code', sku)
    await expect(this.page).not.toHaveURL(/:productId|:id/)
  }

  // ─── Listing ─────────────────────────────────────────────────
  async openCreateListing() {
    const headerAction = this.page.locator(selector('listingCreateOpen'))
    const secondaryAction = this.page.locator(selector('listingCreateOpenSecondary'))
    await (await headerAction.count() ? headerAction : secondaryAction).first().click()
    await expect(this.page.locator(selector('listingCreateSubmit'))).toBeVisible()
  }

  async closeListingModal() {
    await this.page.getByRole('button', { name: /cancel|取消|product\.detail\.listingModal\.cancel/i }).last().click()
    await expect(this.page.locator(selector('listingCreateSubmit'))).toBeHidden()
  }

  async fillListingForm(fields: { versionLabel: string; title: string; description?: string }) {
    // Find the listing modal by its heading text
    const modal = this.page.locator('div.fixed.inset-0').filter({ hasText: /新建 Listing 版本|Create Listing Version|编辑 Listing 版本|Edit Listing Version/ })
    await expect(modal).toBeVisible()
    // Use placeholder text matching Chinese translations
    await modal.locator('input').nth(0).fill(fields.versionLabel) // versionLabel is the first input after selects
    await modal.locator('input').nth(1).fill(fields.title) // title is the second input
    if (fields.description) {
      await modal.locator('textarea').fill(fields.description)
    }
  }

  async submitListingForm() {
    await this.page.locator(selector('listingCreateSubmit')).click()
    await expect(this.page.locator(selector('listingCreateSubmit'))).toBeHidden()
  }

  async createListing(fields: { versionLabel: string; title: string; description?: string }) {
    await this.openCreateListing()
    await this.fillListingForm(fields)
    await this.submitListingForm()
  }

  async adoptListingByIndex(index = 0) {
    const adoptButtons = this.page.locator(selector('listingAdoptSubmit'))
    await expect(adoptButtons.nth(index)).toBeVisible()
    await adoptButtons.nth(index).click()
  }

  // ─── Export ──────────────────────────────────────────────────
  async openExport() {
    await this.page.locator(selector('exportCreateOpen')).click()
    await expect(this.page.locator(selector('exportCreateSubmit'))).toBeVisible()
  }

  async submitExportForm() {
    await this.page.locator(selector('exportCreateSubmit')).click()
    await expect(this.page.locator(selector('exportCreateSubmit'))).toBeHidden()
  }

  async createExport() {
    await this.openExport()
    await this.submitExportForm()
  }

  // ─── AI Pipeline ─────────────────────────────────────────────
  async expectAIPipelineVisible() {
    await expect(this.page.locator(selector('productAIPipeline'))).toBeVisible()
  }

  async expectPipelineHeaderVisible() {
    await expect(this.page.locator(selector('productDetailHeader'))).toBeVisible()
  }

  async expectHealthBadgeVisible() {
    await expect(this.page.locator(selector('productDetailHealthBadge'))).toBeVisible()
  }

  async expectPrimaryCtaVisible() {
    await expect(this.page.locator(selector('productDetailPrimaryCta'))).toBeVisible()
  }

  async expectParsedInfoPanelVisible() {
    await expect(this.page.locator(selector('productParsedInfoPanel'))).toBeVisible()
  }

  async expectPromptVersionsPanelVisible() {
    await expect(this.page.locator(selector('productPromptVersionsPanel'))).toBeVisible()
  }

  async expectNextActionCardVisible() {
    await expect(this.page.locator(selector('pipelineNextActionCard'))).toBeVisible()
  }

  get pipelineBlockers() {
    return this.page.locator(selector('pipelineBlockersList'))
  }
}
