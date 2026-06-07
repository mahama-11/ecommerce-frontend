import { expect, test } from '@playwright/test'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks, QA_PRODUCT_ID } from '../support/harness'
import { expectNoInternalTerms } from '../pages/ProductionPages'
import { selector } from '../support/selectors'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p0 @production-ai-runtime ecom-production-ai-runtime-plan-generate-workshop-select-writeback completes stage-view to writeback loop', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await test.step('Prep reads stage-view choices and can persist a fixed choice', async () => {
    await page.goto(`/products/${QA_PRODUCT_ID}/production/prep`)
    await expect(page.locator(selector('productionPrepPage'))).toBeVisible()
    await expect(page.locator(selector('productionChoiceCard')).first()).toBeVisible({ timeout: 12_000 })
    const choicePatch = page.waitForResponse(response => response.request().method() === 'PATCH' && response.url().includes('/api/v1/ecommerce/v2/visual-workflows/'))
    await page.locator(selector('productionChoiceSubmit')).first().click()
    await expect((await choicePatch).status()).toBeLessThan(300)
    await expectNoInternalTerms(page)
  })

  await test.step('Sandbox refreshes user-facing prompt plan and creates completed fanout result', async () => {
    await page.goto(`/products/${QA_PRODUCT_ID}/production/sandbox`)
    await expect(page.locator(selector('productionSandboxPage'))).toBeVisible()
    await expect(page.locator('[data-testid="production-prompt-editor"]')).toBeVisible({ timeout: 12_000 })
    const promptPlanner = page.waitForResponse(response => response.request().method() === 'POST' && response.url().includes('/prompt-planner-jobs'))
    await page.locator(selector('productionPromptCompose')).click()
    await expect((await promptPlanner).status()).toBeLessThan(300)
    await expect(page.locator('[data-testid="production-prompt-editor"]')).toContainText(/电商主图|材质|构图/i)

    const fanout = page.waitForResponse(response => response.request().method() === 'POST' && response.url().includes('/generation-version-fanouts'))
    await page.locator(selector('productionGenerationStart')).click()
    await expect((await fanout).status()).toBeLessThan(300)
    await expect(page).toHaveURL(new RegExp(`/products/${QA_PRODUCT_ID}/production/workshop`), { timeout: 20_000 })
  })

  await test.step('Workshop displays completed result asset and writes selection back to SKU assets + delivery package', async () => {
    await expect(page.locator(selector('productionWorkshopPage'))).toBeVisible()
    await expect(page.locator(selector('productionResultAsset')).first()).toBeVisible({ timeout: 12_000 })
    await page.getByRole('button', { name: /选择生成结果 1/ }).first().click()
    await expect(page.getByRole('button', { name: /取消选择生成结果 1/ }).first()).toBeVisible()

    const select = page.waitForResponse(response => response.request().method() === 'POST' && response.url().includes('/select'))
    const writeback = page.waitForResponse(response => response.request().method() === 'POST' && response.url().includes('/writeback-selected-asset'))
    const exportPackage = page.waitForResponse(response => response.request().method() === 'POST' && response.url().includes('/export-packages'))
    await page.locator(selector('productionWorkshopFinalize')).click()
    await expect((await select).status()).toBeLessThan(300)
    await expect((await writeback).status()).toBeLessThan(300)
    await expect((await exportPackage).status()).toBeLessThan(300)
    await expect(page.locator('body')).toContainText(/已回流 Product Center|下载包/i, { timeout: 8000 })
    await expectNoInternalTerms(page)
  })

  await screenshotEvidence(page, testInfo, 'production-ai-runtime-writeback')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})

test('@business @p0 @production-ai-runtime ecom-production-ai-runtime-regenerate-refreshes-version-lineage', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)

  await page.goto(`/products/${QA_PRODUCT_ID}/production/workshop`)
  await expect(page.locator(selector('productionWorkshopPage'))).toBeVisible()
  await expect(page.locator(selector('productionVersionCard')).first()).toBeVisible({ timeout: 12_000 })

  const createGenerationVersion = page.waitForResponse(response => response.request().method() === 'POST' && response.url().includes('/generation-versions'))
  await page.getByRole('button', { name: /重新生成|Re-generate/i }).click()
  await expect((await createGenerationVersion).status()).toBeLessThan(300)
  await expect(page.locator(selector('productionVersionCard'))).toHaveCount(2, { timeout: 20_000 })
  await expect(page.locator(selector('productionResultAsset')).first()).toBeVisible()
  await expectNoInternalTerms(page)

  await screenshotEvidence(page, testInfo, 'production-ai-runtime-regenerate')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
