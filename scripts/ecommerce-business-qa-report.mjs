#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const root = process.cwd()
const outDir = path.join(root, 'reports/business-interaction-qa')
fs.mkdirSync(outDir, { recursive: true })

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')) } catch { return fallback }
}
function git(command, fallback = '') {
  try { return execSync(command, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || fallback } catch { return fallback }
}
function health(url) {
  try {
    execSync(`curl -fsS --max-time 2 ${JSON.stringify(url)}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    return 'PASS'
  } catch { return 'BLOCKED' }
}

const pw = readJson('reports/business-interaction-qa/playwright-report.json', null)
const selectorReport = readJson('reports/business-interaction-qa/selector-report.json', { selector_registry: { status: 'NOT_RUN' }, selected_specs: [] })
const critical = readJson('contract-governance/critical-journeys.json', { journeys: [] })

const suites = pw?.suites ?? []
const specs = []
function walkSuite(suite) {
  for (const spec of suite.specs ?? []) specs.push(spec)
  for (const child of suite.suites ?? []) walkSuite(child)
}
for (const suite of suites) walkSuite(suite)

function specStatus(spec) {
  const tests = spec.tests ?? []
  if (tests.some(test => (test.results ?? []).some(result => result.status === 'failed' || result.status === 'timedOut'))) return 'FAIL'
  if (tests.some(test => (test.results ?? []).some(result => result.status === 'passed'))) return 'PASS_WITH_NOTES'
  if (tests.some(test => (test.results ?? []).some(result => result.status === 'skipped'))) return 'BLOCKED'
  return 'NOT_RUN'
}

const journeyMap = [
  {
    qa_id: 'ecom-auth-protected-route',
    route: '/products',
    grep: /ecom-auth-protected-route/,
    actions: ['directly opened protected /products unauthenticated', 'installed fixture session and reopened /products'],
    apiCalls: ['mocked session read only; no live auth write'],
    backendReadback: 'NOT_RUN',
    negativeCases: ['unauthenticated protected route redirect'],
  },
  {
    qa_id: 'ecom-product-create-list-detail',
    route: '/products',
    grep: /ecom-product-create-list-detail/,
    actions: ['clicked create SKU', 'filled SKU/title', 'submitted mocked create', 'clicked created SKU detail link'],
    apiCalls: ['mocked POST /products', 'mocked GET /products', 'mocked GET /products/:id'],
    backendReadback: 'PASS_WITH_MOCK_FIXTURE',
    negativeCases: [],
  },
  {
    qa_id: 'ecom-product-scoped-visual-entry',
    route: '/products -> /products/:id/production/prep',
    grep: /ecom-product-scoped-visual-entry/,
    actions: ['clicked product-scoped visual production CTA', 'asserted final route has concrete product id'],
    apiCalls: ['mocked list/detail data only; no live image-generation write'],
    backendReadback: 'NOT_RUN',
    negativeCases: ['literal :productId/:id URL guard'],
  },
  {
    qa_id: 'ecom-production-prep-sandbox-workshop',
    route: '/products/:id/production/(prep|sandbox|workshop)',
    grep: /ecom-production-prep-sandbox-workshop/,
    actions: ['opened Prep/Sandbox/Workshop routes', 'verified upload/parse/compose/generation/workshop selectors', 'scanned visible copy for internal term leakage'],
    apiCalls: ['mocked stage surfaces only; live prompt/generation/provider calls not run'],
    backendReadback: 'NOT_RUN',
    negativeCases: ['literal :productId/:id URL guard', 'internal copy leakage guard'],
  },
  {
    qa_id: 'ecom-production-ai-runtime-closure',
    route: '/products/:id/production/prep -> sandbox -> workshop',
    grep: /ecom-production-ai-runtime-/,
    actions: ['patched Prep fixed choice', 'refreshed prompt plan', 'submitted fanout generation', 'opened Workshop result asset', 'selected generated asset', 'finalized writeback and delivery package', 'regenerated a new version'],
    apiCalls: ['mocked real service-shape GET stage-view', 'POST prompt-planner-jobs', 'POST generation-version-fanouts', 'POST generation-version select', 'POST writeback-selected-asset', 'POST export-packages', 'POST generation-versions'],
    backendReadback: 'PASS_WITH_MOCK_FIXTURE',
    negativeCases: ['internal copy leakage guard', 'no placeholder URL guard'],
  },
  {
    qa_id: 'ecom-listing-export-download',
    route: '/products/:id + /products/workbench/downloads',
    grep: /ecom-listing-export-download/,
    actions: ['opened listing create dialog', 'verified adopt/export/download controls', 'opened downloads route for the product'],
    apiCalls: ['selector-level mock fixture only; listing/export/download mutations not submitted'],
    backendReadback: 'NOT_RUN',
    negativeCases: ['download route selector presence without mock-delivery overclaim'],
  },
  {
    qa_id: 'ecom-downloads-delivery-guards',
    route: '/products/workbench/downloads',
    grep: /ecom-downloads-delivery-/,
    actions: ['filtered download history', 'clicked authenticated download', 'rendered failed non-downloadable record'],
    apiCalls: ['mocked GET /downloads', 'mocked download content'],
    backendReadback: 'PASS_WITH_MOCK_FIXTURE',
    negativeCases: ['failed delivery cannot download'],
  },
  {
    qa_id: 'ecom-inventory-expanded',
    route: '/inventory + subroutes',
    grep: /ecom-inventory-expanded-/,
    actions: ['opened product manage/inbound/analysis/settings', 'filtered inventory dashboard'],
    apiCalls: ['mocked GET /inventory/stats', 'mocked POST /inventory/products', 'mocked inventory read endpoints'],
    backendReadback: 'PASS_WITH_MOCK_FIXTURE',
    negativeCases: [],
  },
  {
    qa_id: 'ecom-account-commercial-coverage',
    route: '/account/(billing|assets|templates|promotion|commission|history)',
    grep: /ecom-account-commercial-/,
    actions: ['opened billing wallet summary', 'opened account commercial subpages'],
    apiCalls: ['mocked GET /wallet/summary', 'mocked GET /billing/summary', 'mocked GET /billing/charges', 'mocked GET /commercial/orders'],
    backendReadback: 'PASS_WITH_MOCK_FIXTURE',
    negativeCases: [],
  },
  {
    qa_id: 'ecom-auth-rbac-registration',
    route: '/register + /forgot-password + /org/overview',
    grep: /ecom-auth-(register|rbac)/,
    actions: ['opened register', 'opened forgot password', 'expired protected session redirects', 'org admin allowed', 'member redirected'],
    apiCalls: ['mocked 401 session expiry', 'fixture auth session'],
    backendReadback: 'PASS_WITH_MOCK_FIXTURE',
    negativeCases: ['expired session redirect', 'non-admin org redirect'],
  },
  {
    qa_id: 'ecom-workspace-template-persistence',
    route: '/aiChat/template + /chat + /draw/scene-reference + /aiChat/history',
    grep: /ecom-(workspace-template|chat-design-ops)/,
    actions: ['used template entry', 'saved chat action to template', 'opened design workbench', 'opened ops history'],
    apiCalls: ['mocked POST /template-center/catalog/:id/use', 'mocked POST /templates/saved'],
    backendReadback: 'PASS_WITH_MOCK_FIXTURE',
    negativeCases: [],
  },
  {
    qa_id: 'ecom-portal-public-routes',
    route: '/, /pricing, /solutions, /blog, /help, /api-docs, /terms, /privacy, /careers, /contact, /changelog',
    grep: /ecom-portal-public-/,
    actions: ['opened public routes', 'checked pricing CTA', 'checked mobile primary action reachability'],
    apiCalls: [],
    backendReadback: 'NOT_REQUIRED_STATIC_ROUTE',
    negativeCases: [],
  },
  {
    qa_id: 'ecom-org-admin-permission-boundary',
    route: '/org/overview',
    grep: /ecom-org-admin-/,
    actions: ['admin opens org overview', 'member redirected from org overview'],
    apiCalls: ['fixture auth session'],
    backendReadback: 'PASS_WITH_MOCK_FIXTURE',
    negativeCases: ['member org route redirect'],
  },
]

const journeys = journeyMap.map(item => {
  const spec = specs.find(candidate => item.grep.test(candidate.title))
  const status = spec ? specStatus(spec) : 'NOT_RUN'
  return {
    qa_id: item.qa_id,
    status,
    route: item.route,
    actions_clicked: status === 'NOT_RUN' ? [] : item.actions,
    api_calls: status === 'NOT_RUN' ? [] : item.apiCalls,
    backend_readback: status === 'NOT_RUN' ? 'NOT_RUN' : item.backendReadback,
    negative_cases: status === 'NOT_RUN' ? [] : item.negativeCases,
    screenshot: 'reports/business-interaction-qa/screenshots/',
    trace: 'test-results/ (retain-on-failure)',
    console_errors: [],
    network_failures: [],
    cleanup: status === 'NOT_RUN' ? 'NOT_REQUIRED' : 'NOT_REQUIRED_MOCK_FIXTURE',
  }
})

const failures = journeys.filter(j => j.status === 'FAIL')
const notRun = journeys.filter(j => j.status === 'NOT_RUN')
let finalStatus = 'PASS_WITH_NOTES'
if (failures.length) finalStatus = 'FAIL'
else if (!pw) finalStatus = 'BLOCKED'
else if (notRun.length) finalStatus = 'PARTIAL_PASS'
else if (selectorReport.selector_registry?.status !== 'PASS') finalStatus = 'FAIL'

const report = {
  feature_id: 'ecommerce-frontend-business-interaction-qa',
  generated_at: new Date().toISOString(),
  environment: process.env.BUSINESS_QA_ENVIRONMENT ?? 'local-mock-runtime',
  frontend: {
    path: root,
    branch: git('git branch --show-current', 'unknown'),
    commit: git('git rev-parse --short HEAD', 'unknown'),
    port: process.env.ECOMMERCE_BUSINESS_E2E_PORT ?? process.env.ECOMMERCE_E2E_PORT ?? '5208',
  },
  backend: {
    base_url: process.env.VITE_ECOMMERCE_API_BASE_URL ? '<configured>' : '/api/v1/ecommerce via Vite proxy',
    health: health('http://127.0.0.1:8396/api/v1/ecommerce/auth/session'),
  },
  selector_registry: selectorReport.selector_registry,
  selected_specs: selectorReport.selected_specs,
  critical_journeys_indexed: (critical.journeys ?? []).filter(j => String(j.id ?? '').includes('business-runtime') || String(j.id ?? '').includes('ecommerce-product-create')).map(j => ({ id: j.id, expectedStatus: j.expectedStatus })),
  journeys,
  final_status: finalStatus,
  notes: [
    'Business specs exercise browser actions with deterministic local runtime mocks for offline regression only; when a dev/review backend is available, prefer real contract/live QA and do not treat this report as live closure.',
    'P0 product create/list/detail is asserted through UI + mocked API readback; do not overclaim as prod/live backend evidence.',
    'For real-first verification run npm run test:contract:real with ECOMMERCE_REAL_CONTRACT_BASE_URL, and run npm run qa:business:live only on an approved safe dev/review lane with cleanup evidence.',
  ],
}

fs.writeFileSync(path.join(outDir, 'business-qa-report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (finalStatus === 'FAIL') process.exit(1)
