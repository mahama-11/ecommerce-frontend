import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

const repoRoot = resolve(import.meta.dirname, '../..')
const runtimeGateScript = join(repoRoot, 'scripts/ecommerce-runtime-layout-gate.mjs')
const evidenceScript = join(repoRoot, 'scripts/ecommerce-frontend-visual-evidence.mjs')

function makeProject() {
  const root = mkdtempSync(join(tmpdir(), 'ecom-runtime-layout-gate-'))
  mkdirSync(join(root, 'reports/frontend-style-consistency'), { recursive: true })
  mkdirSync(join(root, 'reports/frontend-quality'), { recursive: true })
  return root
}

function writeManifest(root, manifest) {
  writeFileSync(join(root, 'reports/frontend-style-consistency/evidence-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
}

function runNode(script, root, extraArgs = []) {
  return spawnSync(process.execPath, [script, ...extraArgs], { cwd: root, encoding: 'utf8' })
}

const completeRoutes = [
  { id: 'product-center', path: '/products?dev=1' },
  { id: 'template-center', path: '/aiChat/template?dev=1' },
  { id: 'batch-listing-legacy', path: '/aiChat/batchListing?dev=1' },
  { id: 'product-batch-listing-legacy', path: '/products/workbench/batch-listing?dev=1' },
  { id: 'visual-tools-index', path: '/products/workbench/visual-tools?dev=1' },
  { id: 'visual-tools-ai-wearable', path: '/products/workbench/visual-tools/ai-wearable?dev=1' },
  { id: 'product-ai-product', path: '/products/dev-product/ai/ai-product?dev=1' },
  { id: 'product-detail', path: '/products/dev-product?dev=1' },
  { id: 'production-prep', path: '/products/dev-product/production/prep?dev=1' },
  { id: 'production-sandbox', path: '/products/dev-product/production/sandbox?dev=1' },
  { id: 'production-workshop', path: '/products/dev-product/production/workshop?dev=1' },
  { id: 'downloads', path: '/products/workbench/downloads?dev=1' },
]

function baseManifest(overrides = {}) {
  return {
    schema_version: '1.2',
    status: 'PASS',
    acceptance_status: 'PASS',
    routes: completeRoutes,
    screenshots: completeRoutes.map(route => ({
      route_id: route.id,
      viewport_id: 'desktop',
      console_error_count: 0,
      network_failure_count: 0,
      overflow_finding_count: 0,
      overflow_findings: [],
      screenshot: `screenshots/${route.id}.png`,
    })),
    overflow_report: { status: 'PASS', finding_count: 0, findings: [] },
    ...overrides,
  }
}

test('runtime layout gate fails closed when Chromium evidence contains clipping or overflow findings', () => {
  const root = makeProject()
  writeManifest(root, baseManifest({
    overflow_report: {
      status: 'FAIL',
      finding_count: 1,
      findings: [{ route_id: 'visual-tools-ai-wearable', viewport_id: 'mobile', type: 'potential-text-clipping-y', text: '长文案被固定高度裁剪' }],
    },
  }))

  const result = runNode(runtimeGateScript, root)
  assert.notEqual(result.status, 0, result.stdout + result.stderr)
  const payload = JSON.parse(result.stdout)
  assert.equal(payload.status, 'FAIL')
  assert.match(payload.failures.join('\n'), /visual-tools-ai-wearable.*clipping|overflow/i)
})

test('runtime layout gate requires template center and ai-wearable in the page inventory', () => {
  const root = makeProject()
  const routes = completeRoutes.filter(route => !['template-center', 'visual-tools-ai-wearable'].includes(route.id))
  writeManifest(root, baseManifest({ routes, screenshots: routes.map(route => ({ route_id: route.id, viewport_id: 'desktop', overflow_finding_count: 0 })) }))

  const result = runNode(runtimeGateScript, root)
  assert.notEqual(result.status, 0, result.stdout + result.stderr)
  const payload = JSON.parse(result.stdout)
  assert.match(payload.failures.join('\n'), /template-center/)
  assert.match(payload.failures.join('\n'), /visual-tools-ai-wearable/)
})


test('runtime layout gate fails when manifest contains route ids not declared by page-position registry', () => {
  const root = makeProject()
  writeManifest(root, baseManifest({
    routes: [...completeRoutes, { id: 'unknown-route', path: '/unknown' }],
    screenshots: [
      ...completeRoutes.map(route => ({ route_id: route.id, viewport_id: 'desktop', overflow_finding_count: 0 })),
      { route_id: 'unknown-route', viewport_id: 'desktop', overflow_finding_count: 0 },
    ],
  }))

  const result = runNode(runtimeGateScript, root)
  assert.notEqual(result.status, 0, result.stdout + result.stderr)
  const payload = JSON.parse(result.stdout)
  assert.match(payload.failures.join('\n'), /not declared in the page-position registry: unknown-route/)
})

test('visual evidence route plan includes legacy redirects and critical SKU flow routes', () => {
  const root = makeProject()
  const result = runNode(evidenceScript, root, ['--route-plan-only'])
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const payload = JSON.parse(result.stdout)
  const ids = payload.routes.map(route => route.id)
  assert.ok(ids.includes('template-center'))
  assert.ok(ids.includes('batch-listing-legacy'))
  assert.ok(ids.includes('product-batch-listing-legacy'))
  assert.ok(ids.includes('visual-tools-ai-wearable'))
  assert.ok(ids.includes('product-ai-product'))
  assert.ok(ids.includes('product-detail'))
  assert.ok(ids.includes('production-sandbox'))
  assert.ok(ids.includes('production-workshop'))
  assert.ok(ids.includes('downloads'))
})
