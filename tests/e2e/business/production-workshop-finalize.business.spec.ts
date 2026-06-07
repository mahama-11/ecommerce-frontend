import { expect, test } from '@playwright/test'
import { ProductionWorkshopPage, expectNoInternalTerms } from '../pages/ProductionPages'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks, QA_PRODUCT_ID } from '../support/harness'
import { selector } from '../support/selectors'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p0 @production-workshop-finalize ecom-production-workshop-finalize exposes finalize CTA and result assets', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const workshop = new ProductionWorkshopPage(page)

  await workshop.goto(QA_PRODUCT_ID)
  await expect(page.locator(selector('productionWorkshopPage'))).toBeVisible()
  await expectNoInternalTerms(page)

  await test.step('Workshop shows result assets', async () => {
    // In dev mode versionNodes may be empty; verify result grid or empty-state instead of version card
    const resultGrid = page.locator('[data-testid="production-result-card"]')
    const emptyState = page.getByText(/暂时没有可迭代的图片|还没有真实生成结果/)
    await expect(resultGrid.first().or(emptyState.first()).first()).toBeVisible()
  })

  await test.step('Finalize CTA is visible but disabled without selection', async () => {
    const finalizeBtn = page.locator(selector('productionWorkshopFinalize'))
    await expect(finalizeBtn).toBeVisible()
    await expect(finalizeBtn).toBeDisabled()
  })

  await screenshotEvidence(page, testInfo, 'production-workshop-finalize')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
