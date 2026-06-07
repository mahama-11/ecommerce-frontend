import { expect, type Locator, type Page } from '@playwright/test'
import { selector } from '../support/selectors'

export class LoginPage {
  constructor(private readonly page: Page) {}

  get root(): Locator { return this.page.locator(selector('authLoginForm')) }
  get submitButton(): Locator { return this.page.locator(selector('authLoginSubmit')) }

  async goto(redirect?: string) {
    const url = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'
    await this.page.goto(url)
    await expect(this.root).toBeVisible()
  }

  async login(email: string, password: string) {
    await this.page.getByPlaceholder(/email/i).fill(email)
    await this.page.getByPlaceholder(/password/i).fill(password)
    await this.submitButton.click()
  }

  async expectRedirectToLogin(fromPath: string) {
    await this.page.goto(fromPath)
    await expect(this.root).toBeVisible()
    await expect(this.page).toHaveURL(/\/login\?redirect=/)
  }
}
