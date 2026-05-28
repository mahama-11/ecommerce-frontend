#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = process.cwd()
const args = process.argv.slice(2)
const reportRel = valueAfter('--report') ?? 'reports/frontend-style-consistency/historical-page-burn-down.json'

function valueAfter(name) {
  const idx = args.indexOf(name)
  if (idx >= 0 && args[idx + 1]) return args[idx + 1]
  const prefixed = args.find(arg => arg.startsWith(`${name}=`))
  return prefixed ? prefixed.slice(name.length + 1) : null
}
function writeJson(rel, payload) {
  const path = join(root, rel)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(payload, null, 2) + '\n')
}
function fileStatus(path) {
  return existsSync(join(root, path)) ? 'present' : 'missing'
}

const batches = [
  {
    id: 'batch-01-production-pipeline',
    priority: 'P0',
    status: 'in_progress',
    surfaces: ['Production Prep', 'Production Sandbox', 'Production Workshop'],
    files: ['src/pages/production/PrepHubPage.tsx', 'src/pages/production/SandboxPage.tsx', 'src/pages/production/WorkshopPage.tsx'],
    shared_components: ['ProductionSectionCard', 'DecisionStepCard', 'DecisionOptionCard', 'EditablePromptCard', 'VersionLineage', 'VersionLineageItem', 'ResultAssetCard'],
    required_evidence: ['storybook long-Chinese/mobile states', 'Playwright desktop/tablet/mobile baselines', 'CDP overflow/clipping manifest'],
    next_exit_criteria: ['zero new style drift', 'zero layout-density findings', 'visual baseline pass on Prep/Sandbox/Workshop'],
  },
  {
    id: 'batch-02-product-detail',
    priority: 'P1',
    status: 'queued',
    surfaces: ['Product Detail'],
    files: ['src/pages/product/ProductDetailPage.tsx', 'src/pages/product/components'],
    shared_components: ['Product dossier tabs', 'asset/version summary cards', 'empty/error state cards'],
    required_evidence: ['detail screenshot desktop/tablet/mobile', 'long SKU/title story or fixture', 'no duplicate tab/action hierarchy review'],
    next_exit_criteria: ['local tab/card styling replaced by shared product components', 'listing/export/readiness states use product IA copy'],
  },
  {
    id: 'batch-03-listing-delivery',
    priority: 'P1',
    status: 'queued',
    surfaces: ['Listing', 'Delivery'],
    files: ['src/pages/product/BatchListingPage.tsx', 'src/pages/delivery', 'src/pages/DeliveryCenterPage.tsx'],
    shared_components: ['listing readiness card', 'delivery history row', 'download/export empty states'],
    required_evidence: ['listing and delivery screenshots', 'empty/error/downstream unavailable states', 'real API smoke when command actions change'],
    next_exit_criteria: ['primary/secondary action hierarchy matches IA governance', 'no internal/runtime/provider copy leaks'],
  },
  {
    id: 'batch-04-account-downloads',
    priority: 'P2',
    status: 'queued',
    surfaces: ['Account', 'Downloads'],
    files: ['src/pages/account/AccountDownloadsPage.tsx', 'src/pages/account'],
    shared_components: ['download item card', 'billing/download empty states'],
    required_evidence: ['account/download screenshots', 'long filename/SKU states', 'mobile safe-area check'],
    next_exit_criteria: ['downloads reuse shared states/buttons', 'account pages do not diverge from product dark shell'],
  },
  {
    id: 'batch-05-product-workbench-auxiliary',
    priority: 'P2',
    status: 'queued',
    surfaces: ['Product Workbench auxiliary pages'],
    files: ['src/pages/ProductVisualToolsPage.tsx', 'src/components/product-workbench'],
    shared_components: ['tool selection card', 'station section card', 'SKU-bound source strip'],
    required_evidence: ['visual-tools multi-viewport screenshots', 'overflow report', 'tool-card selected/disabled/loading states'],
    next_exit_criteria: ['tool cards wrap on mobile', 'CTA hierarchy is singular per tool station'],
  },
]

const result = {
  schema_version: '1.0',
  generated_at: new Date().toISOString(),
  policy: 'Historical frontend pages burn down style/IA/detail inconsistency in batches; each batch must reduce drift and add Storybook/visual evidence before baseline refresh.',
  order: batches.map(batch => batch.id),
  batches: batches.map(batch => ({
    ...batch,
    file_status: Object.fromEntries(batch.files.map(file => [file, fileStatus(file)])),
  })),
}
writeJson(reportRel, result)
console.log(JSON.stringify(result, null, 2))
