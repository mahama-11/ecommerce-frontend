import { expect, test } from '@playwright/test'
import { createEvidenceCollector, expectCleanEvidence, hasSuccessfulApiCall, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks } from '../support/harness'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p1 @account-commercial ecom-account-commercial-billing-wallet-subscription-surfaces-real-client-calls', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/account/billing?dev=1')
  await expect(page.locator('body')).toContainText(/账单|Billing|wallet|余额|费用|summary|100|999/i, { timeout: 12_000 })
  await expect.poll(() => hasSuccessfulApiCall(evidence, call => call.url.includes('/wallet/summary'))).toBe(true)
  await expect.poll(() => hasSuccessfulApiCall(evidence, call => call.url.includes('/billing/summary'))).toBe(true)
  await expect.poll(() => hasSuccessfulApiCall(evidence, call => call.url.includes('/billing/charges'))).toBe(true)
  await expect.poll(() => hasSuccessfulApiCall(evidence, call => call.url.includes('/commercial/orders'))).toBe(true)

  await screenshotEvidence(page, testInfo, 'account-commercial-billing-wallet')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})

test('@business @p1 @account-commercial ecom-account-commercial-account-subpages-render-with-auth-context', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const routes = [
    { path: '/account/assets?dev=1', expected: /资产|Assets|素材|library/i },
    { path: '/account/templates?dev=1', expected: /模板|Templates|template/i },
    { path: '/account/promotion?dev=1', expected: /推广|Promotion|campaign|邀请/i },
    { path: '/account/commission?dev=1', expected: /佣金|Commission|返佣|收益/i },
    { path: '/account/history?dev=1', expected: /历史|History|记录|activity/i },
  ]

  for (const route of routes) {
    await page.goto(route.path)
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).toContainText(route.expected, { timeout: 10_000 })
  }

  await screenshotEvidence(page, testInfo, 'account-commercial-subpages')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
