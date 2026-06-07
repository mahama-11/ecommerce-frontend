import { expect, test } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { selector } from '../support/selectors'

test('@business @p0 @negative ecom-negative-auth-failure blocks unauthenticated and shows error on bad credentials', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const login = new LoginPage(page)

  await test.step('Unauthenticated /products redirects to login', async () => {
    await login.expectRedirectToLogin('/products')
    await expect(page.locator(selector('authLoginForm'))).toBeVisible()
  })

  await test.step('Bad credentials show error', async () => {
    await login.goto()
    const responsePromise = page.waitForResponse(response => response.url().includes('/api/v1/ecommerce/auth/login'))
    await login.login('bad@example.com', 'wrongpassword')
    const response = await responsePromise
    expect(response.status()).toBe(401)
    await expect(page.locator(selector('authLoginForm'))).toBeVisible()
    await expect(page.locator(selector('authLoginForm')).getByText(/Check your email and password and try again/i)).toBeVisible()
  })

  await test.step('Token invalid clears session and redirects', async () => {
    await page.evaluate(() => {
      window.localStorage.setItem('ecommerce_access_token', 'invalid-token')
    })
    await page.goto('/products')
    await expect(page.locator(selector('authLoginForm'))).toBeVisible()
  })

  await screenshotEvidence(page, testInfo, 'negative-auth-failure')
  // Allow 401 network console errors for this negative auth test
  const clean = expectCleanEvidence(evidence)
  expect(clean.networkFailures).toEqual([])
})
