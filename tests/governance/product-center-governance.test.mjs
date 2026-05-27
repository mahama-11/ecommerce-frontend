import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()
const productList = () => readFileSync(join(root, 'src/pages/product/ProductListPage.tsx'), 'utf8')
const productLayout = () => readFileSync(join(root, 'src/layouts/ProductWorkbenchLayout.tsx'), 'utf8')
const evidenceScript = () => readFileSync(join(root, 'scripts/ecommerce-frontend-visual-evidence.mjs'), 'utf8')

test('Product Center queue consumes workspace governance and semantic product composition', () => {
  const source = productList()
  assert.match(source, /data-page-shell="workspace-home"/)
  assert.match(source, /ProductHeroStage/)
  assert.match(source, /WorkflowProgressRail/)
  assert.match(source, /ProductAssetStrip/)
})

test('Product Center row actions keep SKU context for detail, visual production, and product-center focus', () => {
  const source = productList()
  assert.match(source, /to=\{`\/products\/\$\{product\.id\}`\}/)
  assert.match(source, /to=\{visualProductionHref\(product\.id\)\}/)
  assert.match(source, /to=\{productCenterFocusHref\(product\.id\)\}/)
  assert.match(source, /进入视觉生产/)
  assert.match(source, /进入产品中心/)
})

test('Product Workbench top nav does not expose redundant Product Center brand/menu item', () => {
  const source = productLayout()
  assert.doesNotMatch(source, /<Link to="\/products" className="whitespace-nowrap font-semibold tracking-tight text-white">Product Center<\/Link>/)
})

test('visual evidence counts page exceptions but does not downgrade on browser warning noise', () => {
  const source = evidenceScript()
  assert.match(source, /Runtime\.exceptionThrown/)
  assert.doesNotMatch(source, /Runtime\.consoleAPICalled' && event\.params\?\.type === 'error'/)
  assert.doesNotMatch(source, /\['error', 'warning'\]\.includes/)
})

test('visual evidence mocks downloads as a list so Delivery Center has no runtime exception', () => {
  const source = evidenceScript()
  assert.match(source, /\/api\/v1\/ecommerce\/downloads/)
  assert.match(source, /data: \[\]/)
})
