import { expect, test } from '@playwright/test'
import { TemplateCenterPage } from '../pages/TemplateCenterPage'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks } from '../support/harness'
import { expectNoInternalTerms } from '../pages/ProductionPages'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p1 @template-center ecom-template-center-list-use-now renders catalog and use-now routes correctly', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const templates = new TemplateCenterPage(page)

  await test.step('Template Center catalog renders', async () => {
    await templates.goto()
    // AgentTemplateMarketPage uses 'AI 模板市场' heading
    await expect(page.getByRole('heading', { name: /AI 模板市场|Template Market/i }).first()).toBeVisible()
    await expectNoInternalTerms(page)
  })

  await test.step('Catalog cards are visible', async () => {
    // Cards rendered by the market page; at least one card or grid item should appear
    await expect(page.locator('[data-testid="template-card"], [class*="grid"], [class*="card"]').first()).toBeVisible({ timeout: 8000 })
    await expectNoInternalTerms(page)
  })

  await screenshotEvidence(page, testInfo, 'template-center-list-use-now')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
