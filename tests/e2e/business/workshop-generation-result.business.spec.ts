import { expect, test } from '@playwright/test'
import { ProductionWorkshopPage } from '../pages/ProductionPages'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks, QA_PRODUCT_ID } from '../support/harness'
import { expectNoInternalTerms } from '../pages/ProductionPages'
import { selector } from '../support/selectors'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p0 @workshop-generation ecom-workshop-generation-result exposes result assets and no internal terms', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const workshop = new ProductionWorkshopPage(page)

  await test.step('Workshop renders with generation version cards', async () => {
    await workshop.goto(QA_PRODUCT_ID)
    // Workshop uses MOCK_VARIANTS in dev mode; result cards should appear.
    await expect(page.locator(selector('productionVersionCard')).first()).toBeVisible({ timeout: 8000 })
    await expectNoInternalTerms(page)
  })

  await test.step('Result asset thumbnail is visible', async () => {
    // ResultAssetCard uses data-testid="production-result-card"
    await expect(page.locator('[data-testid="production-result-card"]').first()).toBeVisible()
    await expectNoInternalTerms(page)
  })

  await screenshotEvidence(page, testInfo, 'workshop-generation-result')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
