import { expect, test } from '@playwright/test'
import { createEvidenceCollector, expectCleanEvidence, screenshotEvidence } from '../support/evidence'
import { installBusinessRuntimeMocks } from '../support/harness'

test('@business @p1 @portal-public ecom-portal-public-routes-cta-seo-smoke', async ({ page }, testInfo) => {
  const evidence = createEvidenceCollector(page)
  await installBusinessRuntimeMocks(page)
  const routes = [
    { path: '/', expected: /Agent Ecommerce|AI|电商|SKU|商品/i },
    { path: '/pricing', expected: /Pricing|价格|套餐|Starter|Enterprise/i },
    { path: '/solutions', expected: /Solution|解决方案|场景|电商/i },
    { path: '/blog', expected: /Blog|博客|文章|insight/i },
    { path: '/help', expected: /Help|帮助|中心|support/i },
    { path: '/api-docs', expected: /API|Docs|文档|开发/i },
    { path: '/terms', expected: /Terms|条款|服务/i },
    { path: '/privacy', expected: /Privacy|隐私/i },
    { path: '/careers', expected: /Careers|招聘|加入/i },
    { path: '/contact', expected: /Contact|联系|咨询/i },
    { path: '/changelog', expected: /Changelog|更新|日志/i },
  ]

  for (const route of routes) {
    await test.step(`Public route ${route.path} renders`, async () => {
      await page.goto(route.path)
      await expect(page.locator('body')).toContainText(route.expected, { timeout: 10_000 })
      await expect(page.locator('a[href], button').first()).toBeVisible()
      const title = await page.title()
      expect(title.length).toBeGreaterThan(0)
    })
  }

  await test.step('Pricing conversion CTA creates and confirms an authenticated order', async () => {
    await page.goto('/pricing')
    const cta = page.getByRole('button', { name: /查看详情|View details/i }).first()
    await expect(cta).toBeVisible()
    const createOrder = page.waitForResponse(response =>
      response.request().method() === 'POST'
      && /\/api\/v1\/ecommerce\/commercial\/orders$/.test(new URL(response.url()).pathname)
      && response.status() >= 200
      && response.status() < 300,
    )
    const confirmPayment = page.waitForResponse(response =>
      response.request().method() === 'POST'
      && response.url().includes('/api/v1/ecommerce/commercial/orders/')
      && response.url().endsWith('/confirm-payment')
      && response.status() >= 200
      && response.status() < 300,
    )
    await cta.click()
    await createOrder
    await confirmPayment
    await expect(page).toHaveURL(/\/account\/assets/i)
  })

  await test.step('Mobile viewport keeps primary CTA reachable', async () => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const primaryCta = page.getByRole('link', { name: /免费开始|Get Started Free|进入生产线|Enter Pipeline/i }).first()
    await expect(primaryCta).toBeVisible()
    await primaryCta.click()
    await expect(page).toHaveURL(/\/login|\/products/i)
  })

  await screenshotEvidence(page, testInfo, 'portal-public-routes-cta')
  expect(expectCleanEvidence(evidence)).toEqual({ consoleErrors: [], networkFailures: [] })
})
