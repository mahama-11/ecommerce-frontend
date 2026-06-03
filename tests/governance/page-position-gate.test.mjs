import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()
const script = join(root, 'scripts/ecommerce-page-position-gate.mjs')

function baseRegistry() {
  const actual = JSON.parse(readFileSync(join(root, 'docs/ecommerce-page-position-registry.json'), 'utf8'))
  return JSON.parse(JSON.stringify(actual))
}

function runGate(registry, changedFiles = []) {
  const dir = mkdtempSync(join(tmpdir(), 'page-position-gate-'))
  const registryPath = join(dir, 'registry.json')
  const reportPath = join(dir, 'report.json')
  const changedPath = join(dir, 'changed-files.txt')
  writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n')
  writeFileSync(changedPath, changedFiles.join('\n') + '\n')
  const cp = spawnSync('node', [script, '--registry', registryPath, '--report', reportPath, '--changed-files', changedPath], {
    cwd: root,
    encoding: 'utf8',
  })
  let report = null
  try {
    report = JSON.parse(readFileSync(reportPath, 'utf8'))
  } catch {
    report = null
  }
  return { cp, report }
}

test('valid page-position registry passes', () => {
  const { cp, report } = runGate(baseRegistry())
  assert.equal(cp.status, 0, cp.stderr || cp.stdout)
  assert.equal(report.status, 'PASS')
  assert.ok(report.route_count >= 20)
})

test('missing Visual Tools contract fails', () => {
  const registry = baseRegistry()
  registry.routes = registry.routes.filter(route => route.route !== '/products/workbench/visual-tools')
  const { cp, report } = runGate(registry)
  assert.equal(cp.status, 1)
  assert.match(report.failures.join('\n'), /missing required page-position route contract: \/products\/workbench\/visual-tools/)
})

test('Visual Tools cannot be classified as marketing page', () => {
  const registry = baseRegistry()
  const route = registry.routes.find(item => item.route === '/products/workbench/visual-tools')
  route.pageType = 'marketing-page'
  const { cp, report } = runGate(registry)
  assert.equal(cp.status, 1)
  assert.match(report.failures.join('\n'), /\/products\/workbench\/visual-tools: must be classified as production-station/)
})

test('redirect without canonicalRoute fails', () => {
  const registry = baseRegistry()
  const route = registry.routes.find(item => item.route === '/downloadCenter')
  delete route.canonicalRoute
  const { cp, report } = runGate(registry)
  assert.equal(cp.status, 1)
  assert.match(report.failures.join('\n'), /\/downloadCenter: redirect-legacy route must define canonicalRoute/)
})

test('production station without resultDestination fails', () => {
  const registry = baseRegistry()
  const route = registry.routes.find(item => item.route === '/products/:id/production/sandbox')
  delete route.resultDestination
  const { cp, report } = runGate(registry)
  assert.equal(cp.status, 1)
  assert.match(report.failures.join('\n'), /production-station must define resultDestination/)
})

test('changed critical page reports route evidence requirement', () => {
  const { cp, report } = runGate(baseRegistry(), ['src/pages/ProductVisualToolsPage.tsx'])
  assert.equal(cp.status, 0, cp.stderr || cp.stdout)
  assert.ok(report.changed_route_contracts.some(item => item.route === '/products/workbench/visual-tools'))
  assert.ok(report.changed_routes_requiring_evidence.some(item => item.route === '/products/workbench/visual-tools'))
})
