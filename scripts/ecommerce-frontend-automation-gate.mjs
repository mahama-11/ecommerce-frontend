#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const args = process.argv.slice(2)
const failOnWarnings = args.includes('--fail-on-warnings')
const reportRel = valueAfter('--report') ?? 'reports/frontend-style-consistency/automation-gate-latest.json'
const styleReportRel = 'reports/frontend-style-consistency/style-consistency-latest.json'
const repairQueueReportRel = 'reports/frontend-style-consistency/style-drift-repair-queue.json'
const eslintReportRel = 'reports/frontend-quality/eslint-baseline-latest.json'
const staticQualityReportRel = 'reports/frontend-quality/static-quality-latest.json'
const layoutDensityReportRel = 'reports/frontend-quality/layout-density-latest.json'
const designSystemReportRel = 'reports/frontend-quality/design-system-registry-latest.json'
const frontendIaReportRel = 'reports/frontend-quality/frontend-ia-latest.json'
const apiContractReportRel = 'reports/frontend-quality/api-contract-latest.json'
const runtimeLayoutReportRel = 'reports/frontend-quality/runtime-layout-latest.json'
const autoEvidenceChangedFilesRel = 'reports/frontend-style-consistency/changed-files-for-evidence.txt'

function valueAfter(name) {
  const idx = args.indexOf(name)
  if (idx >= 0 && args[idx + 1]) return args[idx + 1]
  const prefixed = args.find(arg => arg.startsWith(`${name}=`))
  return prefixed ? prefixed.slice(name.length + 1) : null
}

function run(cmd, argv, options = {}) {
  const cp = spawnSync(cmd, argv, { cwd: root, encoding: 'utf8', ...options })
  return { status: cp.status ?? 127, stdout: cp.stdout || '', stderr: cp.stderr || '' }
}

function gitFiles(argv) {
  const cp = run('git', argv)
  if (cp.status !== 0) return []
  return cp.stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
}

function unique(values) {
  return [...new Set(values)].sort()
}

function changedFiles() {
  const explicit = valueAfter('--changed-files')
  if (explicit) {
    const abs = isAbsolute(explicit) ? explicit : join(root, explicit)
    if (!existsSync(abs)) return []
    return readFileSync(abs, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean)
  }
  return unique([
    ...gitFiles(['diff', '--name-only', '--diff-filter=ACMRTUXB', 'HEAD', '--']),
    ...gitFiles(['diff', '--cached', '--name-only', '--diff-filter=ACMRTUXB', '--']),
    ...gitFiles(['ls-files', '--others', '--exclude-standard']),
  ])
}

function isUiFile(file) {
  return /^src\/.+\.(tsx|jsx|css)$/.test(file) || file === 'src/index.css'
}

function isSharedDesignSystemFile(file) {
  return file === 'src/index.css' || /^src\/components\/ui\//.test(file) || file === 'scripts/ecommerce-style-consistency.mjs'
}

const globalStyleFiles = new Set([
  'src/components/ui/Button.tsx',
  'src/components/ui/EcomShell.tsx',
  'src/index.css',
])

function isCriticalSurfaceFile(file) {
  return [
    'src/layouts/ProductWorkbenchLayout.tsx',
    'src/layouts/ProductionLayout.tsx',
    ...globalStyleFiles,
  ].includes(file)
}

function isGlobalStyleFile(file) {
  return globalStyleFiles.has(file)
}

function isProductFlowFile(file) {
  return /^src\/pages\/(product|production)\//.test(file)
    || /^src\/pages\/(ProductListPage|ProductDetailPage|BatchListingPage|ProductVisualToolsPage)\.tsx$/.test(file)
    || /^src\/components\/product-workbench\//.test(file)
    || /^src\/layouts\/(ProductWorkbenchLayout|ProductionLayout)\.tsx$/.test(file)
}

function hasEvidenceManifest(requiredFiles = []) {
  const candidates = [
    'reports/frontend-style-consistency/evidence-manifest.json',
    'reports/frontend-style-consistency/FRONTEND_EVIDENCE_MANIFEST.json',
    'FRONTEND_EVIDENCE_MANIFEST.json',
  ]
  for (const rel of candidates) {
    const path = join(root, rel)
    if (!existsSync(path)) continue
    try {
      const data = JSON.parse(readFileSync(path, 'utf8'))
      const screenshots = data.screenshots || data.visual_evidence || []
      const decision = data.acceptance_status || data.status || data.human_decision?.decision
      if (Array.isArray(screenshots) && screenshots.length > 0 && /^(PASS|ACCEPTED|ACCEPTED_WITH_NOTES)$/i.test(String(decision || ''))) {
        const coveredFiles = data.changed_files || data.changedFiles || data.source_files || []
        if (requiredFiles.length > 0) {
          if (!Array.isArray(coveredFiles) || coveredFiles.length === 0) {
            return { rel, status: 'INVALID', reason: 'manifest is stale or not change-scoped: changed_files must list the product-flow files covered by the screenshots' }
          }
          const missing = requiredFiles.filter(file => !coveredFiles.includes(file))
          if (missing.length > 0) {
            return { rel, status: 'INVALID', reason: `manifest does not cover changed product-flow files: ${missing.join(', ')}` }
          }
        }
        return { rel, status: 'FOUND' }
      }
      return { rel, status: 'INVALID', reason: 'manifest exists but lacks screenshots plus PASS/ACCEPTED decision' }
    } catch (error) {
      return { rel, status: 'INVALID', reason: `manifest JSON invalid: ${error.message}` }
    }
  }
  return { status: 'MISSING' }
}

function hasStyleChangeProposal() {
  const rel = 'reports/frontend-style-consistency/style-change-proposal.json'
  const path = join(root, rel)
  if (!existsSync(path)) return { status: 'MISSING', rel }
  try {
    const data = JSON.parse(readFileSync(path, 'utf8'))
    const decision = data.decision || data.status || data.acceptance_status
    const screenshots = data.screenshots || data.visual_evidence || []
    const requiredText = ['rationale', 'scope', 'migration_plan']
    const missingText = requiredText.filter(key => !String(data[key] || '').trim())
    const affectedSurfaces = data.affected_surfaces || data.affectedSurfaces || []
    if (!/^(ACCEPTED|ACCEPTED_WITH_NOTES|APPROVED)$/i.test(String(decision || ''))) {
      return { status: 'INVALID', rel, reason: 'decision must be ACCEPTED, ACCEPTED_WITH_NOTES, or APPROVED' }
    }
    if (missingText.length > 0) {
      return { status: 'INVALID', rel, reason: `missing required fields: ${missingText.join(', ')}` }
    }
    if (!Array.isArray(affectedSurfaces) || affectedSurfaces.length === 0) {
      return { status: 'INVALID', rel, reason: 'affected_surfaces must list the surfaces impacted by the global style change' }
    }
    if (!Array.isArray(screenshots) || screenshots.length === 0) {
      return { status: 'INVALID', rel, reason: 'screenshots or visual_evidence must include local before/after evidence' }
    }
    return { status: 'FOUND', rel, decision, affected_surfaces: affectedSurfaces }
  } catch (error) {
    return { status: 'INVALID', rel, reason: `style-change proposal JSON invalid: ${error.message}` }
  }
}

function writeJson(rel, payload) {
  const path = isAbsolute(rel) ? rel : join(root, rel)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(payload, null, 2) + '\n')
}

const files = changedFiles().filter(file => !file.startsWith('dist/'))
const uiFiles = files.filter(isUiFile)
const criticalSurfaceFiles = files.filter(isCriticalSurfaceFile)
const globalStyleChangedFiles = files.filter(isGlobalStyleFile)
const productFlowFiles = files.filter(isProductFlowFile)
const sharedOnly = uiFiles.length > 0 && uiFiles.every(isSharedDesignSystemFile)

const style = run('node', ['scripts/ecommerce-style-consistency.mjs', '--report', styleReportRel])
const repairQueue = run('node', ['scripts/ecommerce-style-drift-repair-queue.mjs', '--report', repairQueueReportRel])
const eslintGate = run('node', ['scripts/ecommerce-eslint-baseline-gate.mjs', '--report', eslintReportRel])
const staticQualityGate = run('node', ['scripts/ecommerce-static-quality-gate.mjs', '--report', staticQualityReportRel])
const layoutDensityGate = run('node', ['scripts/ecommerce-layout-density-gate.mjs', '--report', layoutDensityReportRel])
const designSystemGate = run('node', ['scripts/ecommerce-design-system-registry-gate.mjs', '--report', designSystemReportRel])
const frontendIaGate = run('node', ['scripts/ecommerce-frontend-ia-gate.mjs', '--report', frontendIaReportRel])
const apiContractGate = run('node', ['scripts/ecommerce-api-contract-gate.mjs'])
let styleJson = null
try {
  styleJson = JSON.parse(style.stdout)
} catch {
  styleJson = { status: 'UNKNOWN', raw_stdout: style.stdout.slice(-4000) }
}
let eslintJson = null
try {
  eslintJson = JSON.parse(eslintGate.stdout)
} catch {
  eslintJson = { status: 'UNKNOWN', raw_stdout: eslintGate.stdout.slice(-4000) }
}
let staticQualityJson = null
try {
  staticQualityJson = JSON.parse(staticQualityGate.stdout)
} catch {
  staticQualityJson = { status: 'UNKNOWN', raw_stdout: staticQualityGate.stdout.slice(-4000) }
}
let layoutDensityJson = null
try {
  layoutDensityJson = JSON.parse(layoutDensityGate.stdout)
} catch {
  layoutDensityJson = { status: 'UNKNOWN', raw_stdout: layoutDensityGate.stdout.slice(-4000) }
}
let designSystemJson = null
try {
  designSystemJson = JSON.parse(designSystemGate.stdout)
} catch {
  designSystemJson = { status: 'UNKNOWN', raw_stdout: designSystemGate.stdout.slice(-4000) }
}
let frontendIaJson = null
try {
  frontendIaJson = JSON.parse(frontendIaGate.stdout)
} catch {
  frontendIaJson = { status: 'UNKNOWN', raw_stdout: frontendIaGate.stdout.slice(-4000) }
}
let apiContractJson = null
try {
  apiContractJson = JSON.parse(apiContractGate.stdout)
} catch {
  apiContractJson = { status: 'UNKNOWN', raw_stdout: apiContractGate.stdout.slice(-4000) }
}

const failures = []
const warnings = []
if (style.status !== 0 || styleJson.status !== 'PASS') {
  failures.push('style:consistency failed; no frontend increment may proceed while style drift guard is red')
}
if (repairQueue.status !== 0) {
  failures.push('style drift repair queue generation failed; burn-down backlog must remain machine-readable')
}
if (eslintGate.status !== 0 || eslintJson.status === 'FAIL') {
  failures.push('ESLint baseline gate failed; existing lint debt may burn down but cannot increase')
}
if (staticQualityGate.status !== 0 || staticQualityJson.status === 'FAIL') {
  failures.push('Static quality/a11y/architecture gate failed; accessibility and architecture debt may burn down but cannot increase')
}
if (layoutDensityGate.status !== 0 || layoutDensityJson.status === 'FAIL') {
  failures.push('Layout density/readability gate failed; product-flow UI must support long Chinese copy without no-wrap, truncation, or tiny dense two-column cards')
}
if (designSystemGate.status !== 0 || designSystemJson.status === 'FAIL') {
  failures.push('Design-system registry gate failed; shared UI primitives and governance contract must stay machine-readable')
}
if (frontendIaGate.status !== 0 || frontendIaJson.status === 'FAIL') {
  failures.push('Frontend IA governance gate failed; core product pages must keep page roles, information hierarchy, action hierarchy, and screenshot review contract explicit')
}
if (apiContractGate.status !== 0 || apiContractJson.status === 'FAIL') {
  failures.push('API contract gate failed; frontend API types must stay generated from contracts/ecommerce.openapi.json')
}

if (uiFiles.length > 0 && styleJson.status !== 'PASS') {
  failures.push('UI files changed but style consistency did not pass')
}

let styleChangeProposal = hasStyleChangeProposal()
const requiresStyleChangeProposal = globalStyleChangedFiles.length > 0
if (requiresStyleChangeProposal) {
  if (styleChangeProposal.status === 'MISSING') {
    failures.push('Global ecommerce style files changed without style-change proposal; provide reports/frontend-style-consistency/style-change-proposal.json with rationale, scope, migration_plan, affected_surfaces, screenshots, and ACCEPTED/APPROVED decision')
  } else if (styleChangeProposal.status !== 'FOUND') {
    failures.push(`style-change proposal invalid: ${styleChangeProposal.reason || styleChangeProposal.status}`)
  }
}
const requiresVisualEvidence = productFlowFiles.length > 0 && !sharedOnly
let evidenceGeneration = { status: 'SKIPPED', reason: requiresVisualEvidence ? 'existing manifest accepted or generation disabled' : 'visual evidence not required for this change set' }
if (requiresVisualEvidence) {
  let existingEvidence = hasEvidenceManifest(productFlowFiles)
  const autoGenerateEvidence = !args.includes('--no-auto-evidence') && existingEvidence.status !== 'FOUND'
  if (autoGenerateEvidence) {
    const changedFilesPath = join(root, autoEvidenceChangedFilesRel)
    mkdirSync(dirname(changedFilesPath), { recursive: true })
    writeFileSync(changedFilesPath, files.join('\n') + '\n')
    const generated = run('node', ['scripts/ecommerce-frontend-visual-evidence.mjs', '--changed-files', autoEvidenceChangedFilesRel], { timeout: 120000 })
    evidenceGeneration = {
      status: generated.status === 0 ? 'PASS' : 'FAIL',
      exit_code: generated.status,
      stdout_tail: generated.stdout.slice(-2000),
      stderr_tail: generated.stderr.slice(-2000),
    }
    existingEvidence = hasEvidenceManifest(productFlowFiles)
  }
  var evidence = existingEvidence
} else {
  var evidence = hasEvidenceManifest()
}
if (requiresVisualEvidence) {
  if (evidence.status === 'MISSING') {
    failures.push('Product Center / Production UI files changed without frontend visual evidence manifest; provide reports/frontend-style-consistency/evidence-manifest.json with screenshots and PASS/ACCEPTED decision')
  } else if (evidence.status !== 'FOUND') {
    failures.push(`frontend visual evidence manifest invalid: ${evidence.reason || evidence.status}`)
  }
}

const runtimeLayoutGate = run('node', ['scripts/ecommerce-runtime-layout-gate.mjs', '--report', runtimeLayoutReportRel])
let runtimeLayoutJson = null
try {
  runtimeLayoutJson = JSON.parse(runtimeLayoutGate.stdout)
} catch {
  runtimeLayoutJson = { status: 'UNKNOWN', raw_stdout: runtimeLayoutGate.stdout.slice(-4000), warnings: [], failures: [] }
}
if (requiresVisualEvidence && (runtimeLayoutGate.status !== 0 || runtimeLayoutJson.status === 'FAIL')) {
  failures.push('Runtime layout gate failed; Chromium evidence must cover template center, legacy redirects, ai-wearable, and must have zero clipping/overflow findings')
}
if (runtimeLayoutJson.status === 'PASS_WITH_NOTES') {
  warnings.push(...(runtimeLayoutJson.warnings || []).map(item => `runtime layout: ${item}`))
}

if (criticalSurfaceFiles.length > 0) {
  warnings.push('Critical ecommerce shell/design-system files changed; include before/after screenshots in the PR or workflow evidence')
}

const result = {
  status: failures.length ? 'FAIL' : (warnings.length ? 'PASS_WITH_NOTES' : 'PASS'),
  policy: 'Ecommerce frontend increments must not increase style drift or layout-density/readability debt; product-flow UI changes require visual evidence before completion.',
  changed_files: files,
  classifications: {
    ui_files: uiFiles,
    critical_surface_files: criticalSurfaceFiles,
    global_style_changed_files: globalStyleChangedFiles,
    product_flow_files: productFlowFiles,
    shared_design_system_only: sharedOnly,
    requires_style_change_proposal: requiresStyleChangeProposal,
    requires_visual_evidence: requiresVisualEvidence,
  },
  style_consistency: {
    exit_code: style.status,
    report: styleReportRel,
    status: styleJson.status,
    current_totals: styleJson.currentTotals,
    baseline_totals: styleJson.baselineTotals,
    failures: styleJson.failures || [],
  },
  repair_queue: {
    exit_code: repairQueue.status,
    report: repairQueueReportRel,
  },
  eslint_baseline: {
    exit_code: eslintGate.status,
    report: eslintReportRel,
    status: eslintJson.status,
    current_totals: eslintJson.current?.totals,
    baseline_totals: eslintJson.baseline_totals,
    failures: eslintJson.failures || [],
    warnings: eslintJson.warnings || [],
  },
  static_quality: {
    exit_code: staticQualityGate.status,
    report: staticQualityReportRel,
    status: staticQualityJson.status,
    current_totals: staticQualityJson.current?.totals,
    baseline_totals: staticQualityJson.baseline_totals,
    failures: staticQualityJson.failures || [],
    warnings: staticQualityJson.warnings || [],
  },
  layout_density: {
    exit_code: layoutDensityGate.status,
    report: layoutDensityReportRel,
    status: layoutDensityJson.status,
    current_totals: layoutDensityJson.current?.totals,
    baseline_totals: layoutDensityJson.baseline_totals,
    failures: layoutDensityJson.failures || [],
    warnings: layoutDensityJson.warnings || [],
  },
  design_system_registry: {
    exit_code: designSystemGate.status,
    report: designSystemReportRel,
    status: designSystemJson.status,
    active_components: designSystemJson.active_components || [],
    planned_components: designSystemJson.planned_components || [],
    failures: designSystemJson.failures || [],
    warnings: designSystemJson.warnings || [],
  },
  frontend_ia: {
    exit_code: frontendIaGate.status,
    report: frontendIaReportRel,
    status: frontendIaJson.status,
    required_surfaces: frontendIaJson.required_surfaces || [],
    required_components: frontendIaJson.required_components || [],
    failures: frontendIaJson.failures || [],
    warnings: frontendIaJson.warnings || [],
  },
  api_contract: {
    exit_code: apiContractGate.status,
    report: apiContractReportRel,
    status: apiContractJson.status,
    schema: apiContractJson.schema,
    generated: apiContractJson.generated,
    failures: apiContractJson.failures || [],
  },
  runtime_layout: {
    exit_code: runtimeLayoutGate.status,
    report: runtimeLayoutReportRel,
    status: runtimeLayoutJson.status,
    required_route_ids: runtimeLayoutJson.required_route_ids || [],
    observed_route_ids: runtimeLayoutJson.observed_route_ids || [],
    overflow_finding_count: runtimeLayoutJson.overflow_finding_count,
    failures: runtimeLayoutJson.failures || [],
    warnings: runtimeLayoutJson.warnings || [],
  },
  style_change_proposal: styleChangeProposal,
  evidence_generation: evidenceGeneration,
  evidence_manifest: evidence,
  warnings,
  failures,
}

writeJson(reportRel, result)
console.log(JSON.stringify(result, null, 2))
if (failures.length) process.exit(1)
if (warnings.length && failOnWarnings) process.exit(1)
process.exit(0)
