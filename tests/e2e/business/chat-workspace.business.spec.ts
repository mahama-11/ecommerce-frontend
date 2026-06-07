import { expect, test } from '@playwright/test'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks } from '../support/harness'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p0 @chat-workspace ecom-chat-workspace-sends-message-and-shows-loading', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/chat?dev=1')
  await expect(page.getByRole('heading', { name: /AI 对话|AI Chat|Chat/i }).first()).toBeVisible()

  const input = page.locator('input').last()
  await input.fill('生成一版适合美国站的五点卖点')
  await page.getByRole('button', { name: /^发送$|^Send$/ }).click()
  await expect(page.getByText(/AI 正在生成结果|AI is generating/i)).toBeVisible()
  await expect(page.getByText(/已根据当前挂载资料生成一版可执行草稿|actionable draft/i)).toBeVisible({ timeout: 2000 })

  await screenshotEvidence(page, testInfo, 'chat-workspace-send')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})

test('@business @p0 @chat-workspace ecom-chat-workspace-save-to-template-records-workflow', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/chat?dev=1')
  await expect(page.getByText(/对话面板|Conversation Panel/)).toBeVisible()
  await page.getByRole('button', { name: /保存当前动作配置|Save Current Action/i }).click()
  await expect(page.getByText(/已保存到我的模板库|Saved to My Templates/)).toBeVisible({ timeout: 5000 })
  await expect(page.getByRole('button', { name: /已保存当前动作|Current Action Saved/i })).toBeVisible({ timeout: 5000 })

  await screenshotEvidence(page, testInfo, 'chat-workspace-template-save')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})

test('@business @p0 @chat-workspace ecom-chat-doc-workspace-loads-knowledge-context', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/chat/doc?dev=1')
  await expect(page.getByText(/知识库问答工作台|Knowledge Chat Workbench/)).toBeVisible()
  await expect(page.getByText(/平台合规文档|Platform Compliance Docs/)).toBeVisible()
  await expect(page.getByText(/品牌规则手册|Brand Rule Handbook/)).toBeVisible()

  await screenshotEvidence(page, testInfo, 'chat-doc-workspace')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
