#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const root = process.cwd()
const reportRel = 'reports/frontend-quality/quality-dashboard-latest.json'

function readJson(rel, fallback = null) {
  const path = join(root, rel)
  if (!existsSync(path)) return fallback
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    return { status: 'INVALID_JSON', error: error instanceof Error ? error.message : String(error) }
  }
}

function walk(dir, predicate, acc = []) {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walk(path, predicate, acc)
    else if (predicate(path)) acc.push(path)
  }
  return acc
}

function coverageSummary() {
  const coverage = readJson('coverage/coverage-final.json', {})
  const files = Object.entries(coverage || {}).filter(([file]) => /\/src\/(utils|store)\//.test(file))
  const totals = { statements: { total: 0, covered: 0 }, branches: { total: 0, covered: 0 }, functions: { total: 0, covered: 0 }, lines: { total: 0, covered: 0 } }
  for (const [_file, item] of files) {
    const statementMap = item.s || {}
    totals.statements.total += Object.keys(statementMap).length
    totals.statements.covered += Object.values(statementMap).filter(value => Number(value) > 0).length
    const fnMap = item.f || {}
    totals.functions.total += Object.keys(fnMap).length
    totals.functions.covered += Object.values(fnMap).filter(value => Number(value) > 0).length
    const branchMap = item.b || {}
    totals.branches.total += Object.values(branchMap).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
    totals.branches.covered += Object.values(branchMap).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.filter(value => Number(value) > 0).length : 0), 0)
    totals.lines.total = totals.statements.total
    totals.lines.covered = totals.statements.covered
  }
  const pct = Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value.total === 0 ? 0 : Number(((value.covered / value.total) * 100).toFixed(2))]))
  return { files: files.map(([file]) => relative(root, file)), totals, pct }
}

function countMatches(relDir, suffix) {
  return walk(join(root, relDir), file => file.endsWith(suffix)).map(file => relative(root, file))
}

const requiredPhase2Specs = [
  'tests/e2e/business/production-ai-runtime-closure.business.spec.ts',
  'tests/e2e/business/downloads-delivery-guards.business.spec.ts',
  'tests/e2e/business/inventory-expanded.business.spec.ts',
  'tests/e2e/business/account-commercial-coverage.business.spec.ts',
  'tests/e2e/business/auth-rbac-registration.business.spec.ts',
  'tests/e2e/business/workspace-template-persistence.business.spec.ts',
  'tests/e2e/business/portal-public-smoke.business.spec.ts',
  'tests/e2e/business/org-admin.business.spec.ts',
  'tests/e2e/business/chat-workspace.business.spec.ts',
  'tests/e2e/business/design-workbench.business.spec.ts',
  'tests/e2e/business/ops-workbench.business.spec.ts',
  'tests/e2e/business/tool-page.business.spec.ts',
  'tests/e2e/business/inventory-replenishment.business.spec.ts',
  'tests/e2e/business/inventory-alerts.business.spec.ts',
  'tests/e2e/business/account-profile.business.spec.ts',
]
const requiredDocs = ['docs/qa-debt.md', 'docs/soft-quality-issues.md', 'docs/api-mock-sync-log.md']
const requiredUnitFiles = [
  'tests/unit/utils/commercialDisplay.test.ts',
  'tests/unit/store/inventoryStore.test.ts',
  'tests/unit/store/storeInteractions.test.ts',
  'tests/unit/components/productionWorkflowComponents.test.tsx',
]

const unitCoverage = coverageSummary()
const businessSpecs = countMatches('tests/e2e/business', '.business.spec.ts')
const contractSpecs = countMatches('tests/e2e/contract', '.contract.spec.ts')
const mockContractReport = readJson('reports/frontend-quality/playwright-report.json')
const apiContractReport = readJson('reports/frontend-quality/api-contract-latest.json')
const realContractReport = readJson('reports/frontend-quality/real-contract-preflight-latest.json')
const liveMutatingReport = readJson('reports/business-interaction-qa/live-mutating-latest.json')
const requireReal = process.env.ECOMMERCE_QA_REQUIRE_REAL === '1' || process.env.ECOMMERCE_REAL_CONTRACT_REQUIRED === '1'
const allowOffline = process.env.ECOMMERCE_QA_ALLOW_OFFLINE === '1'

const failures = []
const warnings = []
const notes = []

for (const rel of requiredPhase2Specs) if (!existsSync(join(root, rel))) failures.push(`missing required Phase 2 business spec: ${rel}`)
for (const rel of requiredUnitFiles) if (!existsSync(join(root, rel))) failures.push(`missing required unit/component test: ${rel}`)
for (const rel of requiredDocs) if (!existsSync(join(root, rel))) failures.push(`missing governance doc: ${rel}`)
if (businessSpecs.length < 32) failures.push(`business spec count below threshold: ${businessSpecs.length} < 32`)
if (contractSpecs.length < 1) failures.push('mock schema contract spec is missing')
if (unitCoverage.pct.statements < 60 || unitCoverage.pct.branches < 60 || unitCoverage.pct.functions < 60 || unitCoverage.pct.lines < 60) {
  failures.push(`unit coverage below 60% threshold: ${JSON.stringify(unitCoverage.pct)}`)
}
if (!mockContractReport) warnings.push('mock contract Playwright JSON report not found; run npm run test:contract before release evidence')
if (apiContractReport && apiContractReport.status === 'FAIL') failures.push('generated API contract gate report is FAIL')
if (!realContractReport) warnings.push('real contract preflight report missing; run npm run test:contract:real')
else if (realContractReport.status === 'FAIL' || realContractReport.status === 'BLOCKED') failures.push(`real contract preflight ${realContractReport.status}: ${realContractReport.reason || 'see report'}`)
else if (realContractReport.status === 'SKIPPED') {
  const message = 'real contract preflight is SKIPPED because no real backend is configured; mock business QA is offline regression evidence only'
  if (requireReal) failures.push(message)
  else warnings.push(message)
} else if (realContractReport.status === 'PASS' && realContractReport.authenticated === false) {
  warnings.push('real contract preflight PASS is unauthenticated/non-mutating; provide ECOMMERCE_REAL_CONTRACT_TOKEN or run qa:business:live for critical mutations')
}
if (!liveMutatingReport) {
  const message = 'live mutating business QA report missing; run npm run qa:business:live'
  if (allowOffline) warnings.push(`${message}; offline regression explicitly allowed`)
  else failures.push(message)
}
else if (liveMutatingReport.status !== 'PASS') failures.push(`live mutating business QA ${liveMutatingReport.status || 'UNKNOWN'}: see reports/business-interaction-qa/live-mutating-latest.json`)
else if (!Array.isArray(liveMutatingReport.cleanup) || liveMutatingReport.cleanup.some(item => item.status !== 'PASS')) failures.push('live mutating business QA cleanup is not fully PASS')

const result = {
  status: failures.length ? 'FAIL' : (warnings.length ? 'PASS_WITH_NOTES' : 'PASS'),
  thresholds: {
    unit_coverage_min_percent: 60,
    business_spec_min_count: 32,
    required_phase2_business_specs: requiredPhase2Specs.length,
  },
  policy: 'real-first: use real frontend proxy/backend evidence when configured; mock business specs are deterministic offline regression and must not be reported as live business closure',
  require_real: requireReal,
  allow_offline: allowOffline,
  unit_coverage: unitCoverage,
  business_specs: { count: businessSpecs.length, files: businessSpecs },
  contract_specs: { count: contractSpecs.length, files: contractSpecs },
  reports: {
    mock_contract_playwright: mockContractReport ? 'reports/frontend-quality/playwright-report.json' : null,
    generated_api_contract: apiContractReport ? 'reports/frontend-quality/api-contract-latest.json' : null,
    real_contract_preflight: realContractReport ? 'reports/frontend-quality/real-contract-preflight-latest.json' : null,
    live_mutating_business_qa: liveMutatingReport ? 'reports/business-interaction-qa/live-mutating-latest.json' : null,
  },
  governance_docs: requiredDocs,
  notes,
  warnings,
  failures,
}

const reportPath = join(root, reportRel)
mkdirSync(dirname(reportPath), { recursive: true })
writeFileSync(reportPath, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
process.exit(failures.length ? 1 : 0)
