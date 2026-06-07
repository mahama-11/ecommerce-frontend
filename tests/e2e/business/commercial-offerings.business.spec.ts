import { expect, test } from '@playwright/test'
import { CommercialPage } from '../pages/CommercialPage'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks } from '../support/harness'
import { expectNoInternalTerms } from '../pages/ProductionPages'

test.beforeEach(async ({ page }) => {
  await installBusinessRuntimeMocks(page)
})

test('@business @p1 @commercial ecom-commercial-offerings-wallet surfaces offerings and wallet summary', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  const commercial = new CommercialPage(page)

  await test.step('Billing page renders with wallet summary', async () => {
    await commercial.gotoBilling()
    await expect(page.getByText(/Wallet|钱包|Credits|积分/i).first()).toBeVisible()
    await expectNoInternalTerms(page)
  })

  await test.step('Orders list renders', async () => {
    await expect(page.locator('body')).toContainText(/order|订单|plan|套餐/i)
    await expectNoInternalTerms(page)
  })

  await screenshotEvidence(page, testInfo, 'commercial-offerings-wallet')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
