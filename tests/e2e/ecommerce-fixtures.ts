import type { Page, Route } from '@playwright/test'

const devSession = {
  access_token: 'dev',
  user: { full_name: 'Dev User', email: 'dev@agent-ecommerce.com', org_name: 'Local QA' },
  access: { product_roles: ['admin'] },
}

function payloadFor(url: string) {
  if (url.includes('/api/v1/ecommerce/auth/session') || url.includes('/api/v1/ecommerce/auth/me')) {
    return { code: 0, message: 'ok', data: { user: devSession.user, credits: { balance: 999 }, access: devSession.access } }
  }
  if (url.includes('/api/v1/ecommerce/products')) {
    const product = {
      id: 'dev-product', product_id: 'dev-product', title: 'QA Style Governance SKU', sku_code: 'QA-STYLE-001', skuCode: 'QA-STYLE-001', status: 'ready', assets: [], created_at: '2026-05-25T00:00:00.000Z', updated_at: '2026-05-25T00:00:00.000Z',
    }
    if (/\/api\/v1\/ecommerce\/products\/[^/?]+/.test(url)) return { code: 0, message: 'ok', data: product }
    return { code: 0, message: 'ok', data: [product] }
  }
  if (url.includes('/api/v1/ecommerce/production') || url.includes('/api/v1/ecommerce/stage-view')) {
    return { code: 0, message: 'ok', data: { product_id: 'dev-product', status: 'ready', stages: [], source_assets: [], decisions: [] } }
  }
  if (url.includes('/api/v1/ecommerce/downloads')) return { code: 0, message: 'ok', data: { items: [], total: 0 } }
  return { code: 0, message: 'ok', data: {} }
}

export async function installEcommerceMocks(page: Page) {
  await page.addInitScript(session => {
    window.localStorage.setItem('ecommerce_access_token', 'dev')
    window.localStorage.setItem('ecommerce_session', JSON.stringify(session))
  }, devSession)
  await page.route('**/api/**', async (route: Route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payloadFor(route.request().url())) })
  })
}

export async function expectNoRuntimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  return () => errors
}
