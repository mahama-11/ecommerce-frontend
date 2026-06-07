import { expect, test } from '@playwright/test'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks } from '../support/harness'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p0 @design-workbench ecom-design-workbench-syncs-selected-asset', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/draw/designer-home?dev=1')
  await expect(page.getByText(/设计加工工作台|Design Post-Processing Workbench/)).toBeVisible()
  await expect(page.getByText(/当前选中产物|Selected Asset/)).toBeVisible()
  await page.getByRole('button', { name: /同步到图片素材库|Sync to Image Library/ }).click()
  await expect(page.getByText(/已同步到图片素材库|Synced to image library/)).toBeVisible({ timeout: 5000 })

  await screenshotEvidence(page, testInfo, 'design-workbench-sync-asset')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})

test('@business @p0 @design-workbench ecom-design-workbench-search-filters-task-board', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto('/draw/team-space?dev=1')
  await expect(page.getByText(/团队协作空间|Team Collaboration Space/)).toBeVisible()
  await page.getByPlaceholder(/搜索阶段、动作或流程节点|Search stages/).fill('审批')
  await expect(page.locator('body')).toContainText(/审批|没有找到匹配节点|Approval|No matching node/i)

  await screenshotEvidence(page, testInfo, 'design-workbench-search')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
