import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()
const script = join(root, 'scripts/ecommerce-design-governance-gate.mjs')

function copyFixture(overrides = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'design-governance-gate-'))
  const files = [
    'docs/ecommerce-site-ia-map.md',
    'docs/ecommerce-page-contracts.md',
    'docs/ecommerce-page-type-patterns.md',
    'docs/ecommerce-design-system-rules.md',
    'src/styles/tokens.css',
    'src/components/product-composition/index.tsx',
    'src/components/layout/index.tsx',
    'src/pages/product/ProductListPage.tsx',
    'src/pages/ProductVisualToolsPage.tsx',
  ]
  for (const rel of files) {
    const target = join(dir, rel)
    mkdirSync(dirname(target), { recursive: true })
    const content = Object.prototype.hasOwnProperty.call(overrides, rel)
      ? overrides[rel]
      : readFileSync(join(root, rel), 'utf8')
    writeFileSync(target, content)
  }
  return dir
}

function runGate(fixtureRoot) {
  const cp = spawnSync('node', [script, '--root', fixtureRoot, '--report', join(fixtureRoot, 'report.json')], {
    cwd: root,
    encoding: 'utf8',
  })
  let report = null
  try { report = JSON.parse(readFileSync(join(fixtureRoot, 'report.json'), 'utf8')) } catch {}
  return { cp, report }
}

test('complete IA, page contracts, design system, tokens, and layout primitives pass', () => {
  const fixtureRoot = copyFixture()
  const { cp, report } = runGate(fixtureRoot)
  assert.equal(cp.status, 0, cp.stderr || cp.stdout)
  assert.equal(report.status, 'PASS')
  assert.equal(report.required_documents.length, 4)
  assert.ok(report.required_components.includes('src/components/layout/index.tsx'))
})

test('missing site IA map fails closed', () => {
  const fixtureRoot = copyFixture({ 'docs/ecommerce-site-ia-map.md': '' })
  const { cp, report } = runGate(fixtureRoot)
  assert.equal(cp.status, 1)
  assert.match(report.failures.join('\n'), /docs\/ecommerce-site-ia-map\.md: missing required section P0/)
})

test('page contracts must include Visual Tools production-station contract fields', () => {
  const valid = readFileSync(join(root, 'docs/ecommerce-page-contracts.md'), 'utf8')
  const fixtureRoot = copyFixture({ 'docs/ecommerce-page-contracts.md': valid.replace('结果输出到哪里: SKU.assets', '结果输出到哪里:') })
  const { cp, report } = runGate(fixtureRoot)
  assert.equal(cp.status, 1)
  assert.match(report.failures.join('\n'), /Visual Tools contract missing result destination/)
})

test('design system rules must ban ad-hoc button and dark surface styles', () => {
  const valid = readFileSync(join(root, 'docs/ecommerce-design-system-rules.md'), 'utf8')
  const fixtureRoot = copyFixture({ 'docs/ecommerce-design-system-rules.md': valid.replace('禁止页面自写 `bg-black` / `hover:bg-*` / raw hex button。', '') })
  const { cp, report } = runGate(fixtureRoot)
  assert.equal(cp.status, 1)
  assert.match(report.failures.join('\n'), /design system rules missing ad-hoc button ban/)
})

test('tokens and layout shells are mandatory for P3 implementation', () => {
  const fixtureRoot = copyFixture({ 'src/styles/tokens.css': ':root {}', 'src/components/layout/index.tsx': '' })
  const { cp, report } = runGate(fixtureRoot)
  assert.equal(cp.status, 1)
  assert.match(report.failures.join('\n'), /src\/styles\/tokens\.css: missing token --ecom-bg/)
  assert.match(report.failures.join('\n'), /src\/components\/layout\/index\.tsx: missing shell MarketingShell/)
})

test('core pages must consume their declared shell and product-composition primitives', () => {
  const productList = readFileSync(join(root, 'src/pages/product/ProductListPage.tsx'), 'utf8')
  const fixtureRoot = copyFixture({
    'src/pages/product/ProductListPage.tsx': productList
      .replace('data-page-shell="workspace-home"', '')
      .replaceAll('ProductHeroStage', 'MissingHeroPrimitive'),
  })
  const { cp, report } = runGate(fixtureRoot)
  assert.equal(cp.status, 1)
  assert.match(report.failures.join('\n'), /src\/pages\/product\/ProductListPage\.tsx: must declare page shell workspace-home/)
  assert.match(report.failures.join('\n'), /src\/pages\/product\/ProductListPage\.tsx: must consume product-composition primitive ProductHeroStage/)
})
