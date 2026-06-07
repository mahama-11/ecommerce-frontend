import { expect, type Locator, type Page } from '@playwright/test'
import { selector } from '../support/selectors'

export class DownloadsPage {
  constructor(private readonly page: Page) {}

  get root(): Locator { return this.page.locator(selector('downloadRecordCard')).first() }
  get downloadButtons(): Locator { return this.page.locator(selector('downloadRecordDownload')) }

  async goto(productIds?: string[]) {
    const qs = productIds?.length ? `?productIds=${productIds.join(',')}` : ''
    await this.page.goto(`/products/workbench/downloads${qs}&dev=1`)
    await expect(this.page.locator(selector('downloadRecordCard')).first()).toBeVisible()
  }

  async expectDownloadCardVisible() {
    await expect(this.page.locator(selector('downloadRecordCard')).first()).toBeVisible()
  }

  async clickFirstDownload() {
    const btn = this.page.locator(selector('downloadRecordDownload')).first()
    await expect(btn).toBeVisible()
    await btn.click()
  }
}
