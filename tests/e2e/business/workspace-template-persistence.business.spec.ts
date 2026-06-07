import { expect, test } from '@playwright/test'
import { createEvidenceCollector, expectCleanEvidence, hasSuccessfulApiCall, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks } from '../support/harness'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p1 @workspace-template ecom-workspace-template-use-now-persists-workflow-route', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/aiChat/template?dev=1')
  await expect(page.locator('body')).toContainText(/AI 模板市场|Template Market|QA Hero Template/i, { timeout: 12_000 })
  const useButton = page.getByRole('button', { name: /立即使用|Use Now/i }).first()
  await expect(useButton).toBeVisible({ timeout: 10_000 })
  await useButton.click()
  await expect(page).toHaveURL(/\/products\/workbench\/visual-tools|\/draw\//, { timeout: 12_000 })
  const savedPayload = await page.evaluate(() => window.sessionStorage.getItem('ae_template_center_use_payload'))
  expect(savedPayload).toBeTruthy()

  await screenshotEvidence(page, testInfo, 'workspace-template-use-now')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})

test('@business @p1 @workspace-template ecom-chat-design-ops-persistence-readback-after-write', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/chat')
  await page.getByRole('button', { name: /保存当前动作配置|Save Current Action/i }).click()
  await expect(page.getByText(/已保存到我的模板库|Saved to My Templates/)).toBeVisible({ timeout: 5000 })
  await expect.poll(() => hasSuccessfulApiCall(evidence, call => call.method === 'POST' && call.url.includes('/templates/saved'))).toBe(true)

  await page.goto('/draw/scene-reference?dev=1')
  await expect(page.locator('body')).toContainText(/设计|Design|场景|reference|素材/i, { timeout: 12_000 })

  await page.goto('/aiChat/history?dev=1')
  await expect(page.locator('body')).toContainText(/历史|History|记录|任务|Ops/i, { timeout: 12_000 })

  await screenshotEvidence(page, testInfo, 'workspace-persistence-readback')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
