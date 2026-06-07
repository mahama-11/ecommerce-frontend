import { expect, test } from '@playwright/test'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks } from '../support/harness'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p0 @ops-workbench ecom-ops-workbench-history-advances-record-state', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/aiChat/history?dev=1')
  await expect(page.getByText(/历史会话资产层|Conversation Asset Layer/)).toBeVisible()
  await expect(page.getByText(/当前选中详情|Selected Detail/)).toBeVisible()
  await page.getByRole('button', { name: /同步知识库|Sync to Knowledge Base/i }).click()
  await expect(page.getByText(/统一状态回流|Unified Workflow Feed/)).toBeVisible()

  await screenshotEvidence(page, testInfo, 'ops-workbench-history-advance')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})

test('@business @p0 @ops-workbench ecom-ops-workbench-search-empty-state-is-clear', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/aiChat/analysisRecords?dev=1')
  await expect(page.getByText(/分析结果中心|Insight Result Center/)).toBeVisible()
  await page.getByPlaceholder(/搜索任务、记录或结论|Search tasks/).fill('no-such-record-qa')
  await expect(page.getByText(/当前筛选条件下没有匹配记录|No records match/)).toBeVisible()

  await screenshotEvidence(page, testInfo, 'ops-workbench-search-empty')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
