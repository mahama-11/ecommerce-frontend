import { expect, test } from '@playwright/test'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks } from '../support/harness'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p1 @account-profile ecom-account-profile-edit-save-persists-to-local-state', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/account/profile?dev=1')
  await expect(page.getByRole('heading', { name: /编辑你的身份|Profile|identity/i }).first()).toBeVisible()
  await page.getByLabel(/显示名称|Display Name/i).fill('Business QA Operator')
  await page.getByLabel(/头像地址|Avatar/i).fill('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22%3E%3Crect width=%2264%22 height=%2264%22 fill=%22%230891b2%22/%3E%3C/svg%3E')
  await page.getByRole('button', { name: /保存变更|Save/ }).click()
  await expect(page.getByText(/账户资料已保存|saved/i)).toBeVisible({ timeout: 5000 })

  await screenshotEvidence(page, testInfo, 'account-profile-edit-save')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})

test('@business @p1 @account-profile ecom-account-profile-language-and-workspace-controls-are-usable', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/account/profile?dev=1')
  await page.getByLabel(/默认工作区|Default Workspace/i).selectOption('/chat')
  await page.getByLabel(/界面语言|Language/i).selectOption('en')
  await page.getByRole('button', { name: /保存变更|Save/ }).click()
  await expect(page.getByText(/账户资料已保存|saved/i)).toBeVisible({ timeout: 5000 })

  await screenshotEvidence(page, testInfo, 'account-profile-controls')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})

test('@business @p1 @account-profile ecom-account-profile-notification-toggle-changes-state', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/account/profile?dev=1')
  await expect(page.getByRole('heading', { name: /通知偏好|Notification preferences/i })).toBeVisible()
  const firstSwitch = page.locator('section').filter({ hasText: /系统邮件|System Mail|Notification/i }).getByRole('button').first()
  await firstSwitch.click()
  await expect(page.locator('body')).toContainText(/已关闭|已开启|Enabled|Disabled/i)

  await screenshotEvidence(page, testInfo, 'account-profile-notifications')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
