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

test('Product Center row actions keep SKU context for detail, legacy visual production, and visual-tools center', () => {
  const source = productList()
  assert.match(source, /to=\{`\/products\/\$\{product\.id\}`\}/)
  assert.match(source, /return `\/products\/\$\{encodeURIComponent\(productId\)\}\/production\/prep`/)
  assert.match(source, /to=\{visualProductionHref\(product\.id\)\}/)
  assert.match(source, /new URLSearchParams\(searchParams\)/)
  assert.match(source, /params\.set\('productId', productId\)/)
  assert.match(source, /params\.set\('source', source\)/)
  assert.match(source, /function visualToolsCenterHref\(productId: string\)/)
  assert.match(source, /return `\/products\/workbench\/visual-tools\?\$\{scopedSearchParams\(productId, 'sku-queue'\)\.toString\(\)\}`/)
  assert.match(source, /function openVisualToolsCenter\(productId: string\)/)
  assert.match(source, /navigate\(visualToolsCenterHref\(productId\)\)/)
  assert.match(source, /openVisualToolsCenter\(product\.id\)/)
  assert.match(source, /进入视觉生产/)
  assert.match(source, /进入视觉工具中心/)
  assert.doesNotMatch(source, /function openProductCenter\(productId: string\)/)
  assert.doesNotMatch(source, /focusProductCenter\(productId\)/)
  assert.doesNotMatch(source, /role="button" tabIndex=\{0\} onClick=\{\(\) => navigate\(`\/products\/\$\{product\.id\}`\)\}/)
})

test('Product Center row actions stay compact without icon-only pressure in the limited action column', () => {
  const source = productList()
  assert.doesNotMatch(source, /<Image className="h-3\.5 w-3\.5" \/>进入视觉生产/)
  assert.doesNotMatch(source, /<PackageCheck className="h-3\.5 w-3\.5" \/>进入产品中心/)
  assert.doesNotMatch(source, /Image, LoaderCircle, PackageCheck/)
  assert.match(source, /max-2xl:grid-cols-1/)
  assert.match(source, /2xl:flex-nowrap/)
  assert.match(source, /minmax\(260px,1\.2fr\)/)
})

test('Product Center visible copy does not expose internal page-type or abstract governance wording', () => {
  const source = productList()
  assert.doesNotMatch(source, /Workspace Home|Business Entry|业务入口，不是单纯|页面重点|完整能力清单|首屏主角/)
  assert.match(source, /查看每个 SKU 的素材、Listing 和交付状态，直接进入下一步处理。/)
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
