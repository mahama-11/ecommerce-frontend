import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()
const script = join(root, 'scripts/ecommerce-acceptance-governance-gate.mjs')

function write(rel, content, dir) {
  const target = join(dir, rel)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, content)
}

function copyFixture(overrides = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'acceptance-governance-gate-'))
  const files = [
    'package.json',
    'docs/acceptance-tdd-governance.md',
    'docs/templates/frontend-cta-acceptance-matrix.md',
    'docs/agent-acceptance-tdd-workflow.md',
  ]
  for (const rel of files) {
    const target = join(dir, rel)
    mkdirSync(dirname(target), { recursive: true })
    if (Object.prototype.hasOwnProperty.call(overrides, rel)) {
      writeFileSync(target, overrides[rel])
      continue
    }
    writeFileSync(target, readFileSync(join(root, rel), 'utf8'))
  }
  return dir
}

function runGate(fixtureRoot, extra = []) {
  const report = join(fixtureRoot, 'report.json')
  const cp = spawnSync('node', [script, '--root', fixtureRoot, '--report', report, ...extra], {
    cwd: root,
    encoding: 'utf8',
  })
  let payload = null
  try { payload = JSON.parse(readFileSync(report, 'utf8')) } catch {}
  return { cp, report: payload }
}

test('acceptance/TDD governance docs and package script are mandatory', () => {
  const fixtureRoot = copyFixture()
  const { cp, report } = runGate(fixtureRoot)
  assert.equal(cp.status, 0, cp.stderr || cp.stdout)
  assert.equal(report.status, 'PASS')
  assert.ok(report.required_documents.includes('docs/acceptance-tdd-governance.md'))
  assert.equal(report.policy_levels.P0.mode, 'acceptance_and_red_test_first')
  assert.equal(report.package_scripts['acceptance:governance'], 'node scripts/ecommerce-acceptance-governance-gate.mjs')
})

test('missing P0/P1/P2/P3 strategy fails closed', () => {
  const valid = readFileSync(join(root, 'docs/acceptance-tdd-governance.md'), 'utf8')
  const fixtureRoot = copyFixture({
    'docs/acceptance-tdd-governance.md': valid.replace('## P0/P1/P2/P3 分级策略', '## 分级策略'),
  })
  const { cp, report } = runGate(fixtureRoot)
  assert.equal(cp.status, 1)
  assert.match(report.failures.join('\n'), /missing required section P0\/P1\/P2\/P3 分级策略/)
})

test('CTA acceptance matrix must bind user semantics instead of only URL shape', () => {
  const valid = readFileSync(join(root, 'docs/templates/frontend-cta-acceptance-matrix.md'), 'utf8')
  const fixtureRoot = copyFixture({
    'docs/templates/frontend-cta-acceptance-matrix.md': valid.replaceAll('目标页面身份', '目标页面'),
  })
  const { cp, report } = runGate(fixtureRoot)
  assert.equal(cp.status, 1)
  assert.match(report.failures.join('\n'), /frontend CTA acceptance template missing field: 目标页面身份/)
})

test('P0 product-flow changes require acceptance matrix and runtime evidence', () => {
  const fixtureRoot = copyFixture()
  write('changed-files.txt', 'src/pages/product/ProductListPage.tsx\n', fixtureRoot)
  const { cp, report } = runGate(fixtureRoot, ['--changed-files', join(fixtureRoot, 'changed-files.txt')])
  assert.equal(cp.status, 1)
  assert.match(report.failures.join('\n'), /P0 changes require an acceptance matrix artifact/)
  assert.match(report.failures.join('\n'), /P0 frontend CTA\/route changes require runtime browser evidence/)
})

test('P0 product-flow evidence passes when matrix and browser route identity evidence exist', () => {
  const fixtureRoot = copyFixture()
  write('changed-files.txt', 'src/pages/product/ProductListPage.tsx\n', fixtureRoot)
  write('reports/frontend-quality/acceptance-matrix-latest.json', JSON.stringify({
    status: 'PASS',
    change_object: 'SKU queue third CTA',
    user_action: 'click 进入视觉工具中心',
    current_page: '/products',
    target_page: '/products/workbench/visual-tools',
    required_context: ['productId', 'source=sku-queue'],
    success_signal: '视觉工具中心显示并选中该 SKU',
    forbidden_result: '停留 /products 顶部',
    verification: 'Playwright click + URL + page identity + selector value',
    red_green_evidence: { red: 'failed before fix', green: 'passed after fix' },
  }, null, 2), fixtureRoot)
  write('reports/frontend-style-consistency/evidence-manifest.json', JSON.stringify({
    status: 'PASS',
    acceptance_status: 'PASS',
    changed_files: ['src/pages/product/ProductListPage.tsx'],
    screenshots: ['product-center.png'],
    runtime_assertions: {
      final_url: '/products/workbench/visual-tools?productId=qa-sku-001&source=sku-queue',
      page_identity: '视觉工具中心',
      selected_context: 'qa-sku-001',
      forbidden_stay_on_source: true,
      console_errors: 0,
      network_failures: 0,
      overflow_findings: 0,
    },
  }, null, 2), fixtureRoot)
  const { cp, report } = runGate(fixtureRoot, ['--changed-files', join(fixtureRoot, 'changed-files.txt')])
  assert.equal(cp.status, 0, cp.stderr || cp.stdout)
  assert.equal(report.status, 'PASS')
  assert.equal(report.changed_file_classification.highest_level, 'P0')
})
