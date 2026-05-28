#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const root = resolveArg('--root', process.cwd())
const reportRel = valueAfter('--report') ?? 'reports/frontend-quality/acceptance-governance-latest.json'
const reportPath = isAbsolute(reportRel) ? reportRel : join(root, reportRel)
const changedFilesArg = valueAfter('--changed-files')

function valueAfter(name) {
  const idx = args.indexOf(name)
  if (idx >= 0 && args[idx + 1]) return args[idx + 1]
  const prefixed = args.find(arg => arg.startsWith(`${name}=`))
  return prefixed ? prefixed.slice(name.length + 1) : null
}

function resolveArg(name, fallback) {
  const value = valueAfter(name)
  if (!value) return fallback
  return isAbsolute(value) ? value : join(process.cwd(), value)
}

function read(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

function readJson(rel) {
  const path = isAbsolute(rel) ? rel : join(root, rel)
  if (!existsSync(path)) return null
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch (error) { return { status: 'INVALID_JSON', error: error.message, path } }
}

function writeJson(path, payload) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(payload, null, 2) + '\n')
}

function gitFiles(argv) {
  const cp = spawnSync('git', argv, { cwd: root, encoding: 'utf8' })
  if (cp.status !== 0) return []
  return cp.stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
}

function changedFiles() {
  if (changedFilesArg) {
    const path = isAbsolute(changedFilesArg) ? changedFilesArg : join(root, changedFilesArg)
    if (!existsSync(path)) return []
    return readFileSync(path, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean)
  }
  return [...new Set([
    ...gitFiles(['diff', '--name-only', '--diff-filter=ACMRTUXB', 'HEAD', '--']),
    ...gitFiles(['diff', '--cached', '--name-only', '--diff-filter=ACMRTUXB', '--']),
    ...gitFiles(['ls-files', '--others', '--exclude-standard']),
  ])].sort()
}

const failures = []
const warnings = []
const requiredDocuments = [
  'docs/acceptance-tdd-governance.md',
  'docs/templates/frontend-cta-acceptance-matrix.md',
  'docs/agent-acceptance-tdd-workflow.md',
]

for (const rel of requiredDocuments) {
  if (!existsSync(join(root, rel))) failures.push(`${rel}: missing required acceptance/TDD governance document`)
}

function requireSection(rel, label, pattern) {
  if (!existsSync(join(root, rel))) return
  const text = read(rel)
  if (!pattern.test(text)) failures.push(`${rel}: missing required section ${label}`)
}

requireSection('docs/acceptance-tdd-governance.md', '需求语义 → 可执行验收 → TDD/BDD/Runtime Gate → CI/SelfCheck', /需求语义\s*→\s*可执行验收\s*→\s*TDD\/BDD\/Runtime Gate\s*→\s*CI\/SelfCheck/)
requireSection('docs/acceptance-tdd-governance.md', 'P0/P1/P2/P3 分级策略', /## P0\/P1\/P2\/P3 分级策略/)
requireSection('docs/acceptance-tdd-governance.md', 'PARTIAL_PASS status', /PARTIAL_PASS/)
requireSection('docs/agent-acceptance-tdd-workflow.md', 'AI Agent 验收/TDD 执行流程', /AI Agent 验收\/TDD 执行流程/)

const ctaTemplateFields = ['变更对象', '用户动作', '当前页面', '目标页面', '目标页面身份', '必须携带上下文', '成功标志', '禁止结果', '验证方式']
if (existsSync(join(root, 'docs/templates/frontend-cta-acceptance-matrix.md'))) {
  const template = read('docs/templates/frontend-cta-acceptance-matrix.md')
  for (const field of ctaTemplateFields) {
    if (!template.includes(field)) failures.push(`frontend CTA acceptance template missing field: ${field}`)
  }
}

let pkg = null
if (existsSync(join(root, 'package.json'))) {
  try { pkg = JSON.parse(read('package.json')) } catch (error) { failures.push(`package.json invalid JSON: ${error.message}`) }
} else {
  failures.push('package.json missing')
}
const packageScripts = {
  'acceptance:governance': pkg?.scripts?.['acceptance:governance'],
}
if (packageScripts['acceptance:governance'] !== 'node scripts/ecommerce-acceptance-governance-gate.mjs') {
  failures.push('package.json missing script acceptance:governance = node scripts/ecommerce-acceptance-governance-gate.mjs')
}
if (!String(pkg?.scripts?.['frontend:gate'] || '').includes('ecommerce-frontend-automation-gate.mjs')) {
  failures.push('package.json frontend:gate must remain wired to automation gate')
}

const policyLevels = {
  P0: { mode: 'acceptance_and_red_test_first' },
  P1: { mode: 'test_first_recommended' },
  P2: { mode: 'gate_after_allowed' },
  P3: { mode: 'spike_allowed' },
}

const files = changedFiles()
function levelFor(file) {
  if (/^src\/pages\/(product|production)\//.test(file)) return 'P0'
  if (/^src\/pages\/(ProductListPage|ProductDetailPage|ProductVisualToolsPage)\.tsx$/.test(file)) return 'P0'
  if (/^src\/(services|store)\/(production|product|visual|api)/.test(file)) return 'P0'
  if (/^(contracts|contract-governance)\//.test(file)) return 'P0'
  if (/^src\/(components|hooks)\//.test(file)) return 'P1'
  if (/^src\/i18n\//.test(file) || /\.(css|md)$/.test(file)) return 'P2'
  if (/^docs\//.test(file)) return 'P2'
  return 'P3'
}
const levelRank = { P0: 0, P1: 1, P2: 2, P3: 3 }
const classified = files.map(file => ({ file, level: levelFor(file) }))
const highest = classified.reduce((acc, item) => levelRank[item.level] < levelRank[acc] ? item.level : acc, 'P3')
const p0Files = classified.filter(item => item.level === 'P0').map(item => item.file)
const p1Files = classified.filter(item => item.level === 'P1').map(item => item.file)

const acceptanceMatrix = readJson('reports/frontend-quality/acceptance-matrix-latest.json')
const evidenceManifest = readJson('reports/frontend-style-consistency/evidence-manifest.json')

function hasMatrixForP0(matrix) {
  if (!matrix || matrix.status === 'INVALID_JSON') return false
  const required = ['change_object', 'user_action', 'current_page', 'target_page', 'required_context', 'success_signal', 'forbidden_result', 'verification', 'red_green_evidence']
  return /^(PASS|PASS_WITH_NOTES)$/i.test(String(matrix.status || '')) && required.every(key => {
    const value = matrix[key]
    return Array.isArray(value) ? value.length > 0 : Boolean(String(value || '').trim() || (value && typeof value === 'object'))
  })
}

function hasRuntimeEvidenceFor(filesToCover, manifest) {
  if (!manifest || manifest.status === 'INVALID_JSON') return false
  const decision = manifest.acceptance_status || manifest.status || manifest.human_decision?.decision
  if (!/^(PASS|ACCEPTED|ACCEPTED_WITH_NOTES)$/i.test(String(decision || ''))) return false
  const screenshots = manifest.screenshots || manifest.visual_evidence || []
  if (!Array.isArray(screenshots) || screenshots.length === 0) return false
  const covered = manifest.changed_files || manifest.changedFiles || manifest.source_files || []
  if (filesToCover.length > 0 && (!Array.isArray(covered) || filesToCover.some(file => !covered.includes(file)))) return false
  const assertions = manifest.runtime_assertions || manifest.assertions || {}
  return Boolean(assertions.final_url && assertions.page_identity && assertions.selected_context && assertions.forbidden_stay_on_source)
}

if (p0Files.length > 0) {
  if (!hasMatrixForP0(acceptanceMatrix)) {
    failures.push('P0 changes require an acceptance matrix artifact at reports/frontend-quality/acceptance-matrix-latest.json with user semantics and RED/GREEN evidence')
  }
  if (!hasRuntimeEvidenceFor(p0Files, evidenceManifest)) {
    failures.push('P0 frontend CTA/route changes require runtime browser evidence with final URL, target page identity, selected context, and forbidden-stay assertion')
  }
}
if (p1Files.length > 0 && !hasMatrixForP0(acceptanceMatrix)) {
  warnings.push('P1 changes should provide an acceptance/test matrix; missing matrix downgrades confidence but does not block by default')
}

const result = {
  status: failures.length ? 'FAIL' : (warnings.length ? 'PASS_WITH_NOTES' : 'PASS'),
  policy: 'Requirement semantics must become executable acceptance before P0/P1 implementation; P0 requires RED/GREEN plus runtime browser evidence before PASS.',
  required_documents: requiredDocuments,
  policy_levels: policyLevels,
  package_scripts: packageScripts,
  changed_files: files,
  changed_file_classification: {
    highest_level: p0Files.length ? 'P0' : (p1Files.length ? 'P1' : highest),
    items: classified,
    p0_files: p0Files,
    p1_files: p1Files,
  },
  acceptance_matrix: acceptanceMatrix ? { status: acceptanceMatrix.status, path: 'reports/frontend-quality/acceptance-matrix-latest.json' } : { status: 'MISSING' },
  runtime_evidence: evidenceManifest ? { status: evidenceManifest.status || evidenceManifest.acceptance_status, path: 'reports/frontend-style-consistency/evidence-manifest.json' } : { status: 'MISSING' },
  warnings,
  failures,
}

writeJson(reportPath, result)
console.log(JSON.stringify(result, null, 2))
process.exit(failures.length ? 1 : 0)
