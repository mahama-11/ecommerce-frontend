#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const root = process.cwd()
const args = process.argv.slice(2)
const writeBaseline = args.includes('--write-baseline')
const baselineRel = valueAfter('--baseline') ?? 'scripts/ecommerce-layout-density-baseline.json'
const reportRel = valueAfter('--report') ?? 'reports/frontend-quality/layout-density-latest.json'
const baselinePath = join(root, baselineRel)

const scanExts = new Set(['.tsx', '.jsx'])
const ignoredDirs = new Set(['node_modules', 'dist', '.git', 'reports'])
const productFlowPatterns = [
  /^src\/pages\/(product|production)\//,
  /^src\/pages\/(ProductListPage|ProductDetailPage|BatchListingPage|ProductVisualToolsPage)\.tsx$/,
  /^src\/components\/product-workbench\//,
  /^src\/layouts\/(ProductWorkbenchLayout|ProductionLayout)\.tsx$/,
]

const ruleMeta = [
  { code: 'density.content_button_nowrap', severity: 'error', message: 'Content-heavy Button/choice controls must allow wrapping; use h-auto/min-h + whitespace-normal/break-words for long Chinese copy.' },
  { code: 'density.fixed_height_long_button', severity: 'error', message: 'Long Chinese action/choice copy cannot be squeezed into h-8/h-9 fixed-height controls.' },
  { code: 'density.longcopy_truncate', severity: 'error', message: 'Long business copy must not be hidden by truncate; use line-clamp, wrapping, title, or disclosure.' },
  { code: 'density.tiny_two_column_longcopy', severity: 'error', message: 'Two-column dense cards cannot combine tiny typography with long Chinese business copy.' },
  { code: 'density.tight_longcopy', severity: 'warning', message: 'Long business copy should not use leading-tight; prefer leading-relaxed/normal for readability.' },
]

function valueAfter(name) {
  const idx = args.indexOf(name)
  if (idx >= 0 && args[idx + 1]) return args[idx + 1]
  const prefixed = args.find(arg => arg.startsWith(`${name}=`))
  return prefixed ? prefixed.slice(name.length + 1) : null
}
function extname(path) {
  const idx = path.lastIndexOf('.')
  return idx === -1 ? '' : path.slice(idx)
}
function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (ignoredDirs.has(name)) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (scanExts.has(extname(full))) out.push(full)
  }
  return out
}
function isProductFlowFile(rel) {
  return productFlowPatterns.some(re => re.test(rel))
}
function lineNo(text, index) {
  return text.slice(0, index).split(/\r?\n/).length
}
function cjkCount(text) {
  return (text.match(/[\u3400-\u9fff]/g) || []).length
}
function hasLongChinese(text, min = 16) {
  return cjkCount(text.replace(/className=\{[^}]+\}/g, '')) >= min
}
function literalClass(value) {
  const m = value.match(/className\s*=\s*(["'`])([\s\S]*?)\1/)
  return m ? m[2] : ''
}
function hasClassToken(classText, tokenRe) {
  return tokenRe.test(classText)
}
function compactEvidence(text) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 260)
}
function add(findings, code, file, line, evidence) {
  const meta = ruleMeta.find(rule => rule.code === code)
  findings.push({ code, severity: meta?.severity || 'error', file, line, message: meta?.message || code, evidence: compactEvidence(evidence) })
}

function scanFile(abs) {
  const rel = relative(root, abs).replaceAll('\\', '/')
  if (!isProductFlowFile(rel)) return []
  const text = readFileSync(abs, 'utf8')
  const findings = []

  for (const m of text.matchAll(/<Button\b[\s\S]{0,900}?(?:<\/Button>|\/>)/g)) {
    const snippet = m[0]
    const klass = literalClass(snippet)
    const longChinese = hasLongChinese(snippet, 14)
    if (!longChinese) continue
    const allowsWrap = /(?:^|\s)(?:whitespace-normal|whitespace-pre-line|break-words|text-wrap)(?:\s|$)/.test(klass)
    const forcesNoWrap = /(?:^|\s)whitespace-nowrap(?:\s|$)/.test(klass)
    const hasAutoHeight = /(?:^|\s)(?:h-auto|min-h-(?:10|11|12|14|\[)|py-[2-9])(?:\s|$)/.test(klass)
    const fixedShortHeight = /(?:^|\s)h-(?:7|8|9|10)(?:\s|$)/.test(klass)
    if (forcesNoWrap && !allowsWrap) add(findings, 'density.content_button_nowrap', rel, lineNo(text, m.index || 0), snippet)
    if (fixedShortHeight && !hasAutoHeight && !allowsWrap) add(findings, 'density.fixed_height_long_button', rel, lineNo(text, m.index || 0), snippet)
  }

  for (const m of text.matchAll(/<[^>]+className\s*=\s*(["'`])([\s\S]*?)\1[\s\S]{0,700}?(?:<\/[a-zA-Z][^>]*>|\/>)/g)) {
    const snippet = m[0]
    const klass = m[2]
    if (!hasLongChinese(snippet, 18)) continue
    if (hasClassToken(klass, /(?:^|\s)truncate(?:\s|$)/)) add(findings, 'density.longcopy_truncate', rel, lineNo(text, m.index || 0), snippet)
    if (hasClassToken(klass, /(?:^|\s)leading-tight(?:\s|$)/)) add(findings, 'density.tight_longcopy', rel, lineNo(text, m.index || 0), snippet)
    if (hasClassToken(klass, /(?:^|\s)(?:grid-cols-2|md:grid-cols-2|lg:grid-cols-2)(?:\s|$)/)
      && hasClassToken(klass, /(?:^|\s)(?:text-\[(?:9|10|11)px\]|text-xs)(?:\s|$)/)) {
      add(findings, 'density.tiny_two_column_longcopy', rel, lineNo(text, m.index || 0), snippet)
    }
  }
  return findings
}

function summarize(findings) {
  const byCode = Object.fromEntries(ruleMeta.map(rule => [rule.code, { errors: 0, warnings: 0, total: 0 }]))
  const byFile = {}
  for (const f of findings) {
    byCode[f.code] ??= { errors: 0, warnings: 0, total: 0 }
    byCode[f.code][f.severity === 'error' ? 'errors' : 'warnings'] += 1
    byCode[f.code].total += 1
    byFile[f.file] ??= { errors: 0, warnings: 0, total: 0, by_code: {} }
    byFile[f.file][f.severity === 'error' ? 'errors' : 'warnings'] += 1
    byFile[f.file].total += 1
    byFile[f.file].by_code[f.code] = (byFile[f.file].by_code[f.code] || 0) + 1
  }
  return {
    totals: {
      files: Object.keys(byFile).length,
      errors: findings.filter(f => f.severity === 'error').length,
      warnings: findings.filter(f => f.severity === 'warning').length,
      findings: findings.length,
    },
    by_code: Object.fromEntries(Object.entries(byCode).sort(([a], [b]) => a.localeCompare(b))),
    by_file: Object.fromEntries(Object.entries(byFile).sort(([a], [b]) => a.localeCompare(b))),
    top_findings: findings.slice(0, 120),
  }
}
function compare(current, baseline) {
  const failures = []
  const warnings = []
  for (const [code, currentCounts] of Object.entries(current.by_code || {})) {
    const baseCounts = baseline.by_code?.[code] || { errors: 0, warnings: 0, total: 0 }
    if ((currentCounts.errors || 0) > (baseCounts.errors || 0)) failures.push(`${code} errors increased: current=${currentCounts.errors || 0} baseline=${baseCounts.errors || 0}`)
    if ((currentCounts.warnings || 0) > (baseCounts.warnings || 0)) warnings.push(`${code} warnings increased: current=${currentCounts.warnings || 0} baseline=${baseCounts.warnings || 0}`)
  }
  for (const [file, currentCounts] of Object.entries(current.by_file || {})) {
    const baseCounts = baseline.by_file?.[file]
    if (!baseCounts && currentCounts.errors > 0) failures.push(`${file}: new layout-density debt (${currentCounts.errors} errors, ${currentCounts.warnings} warnings); use readable shared content components instead of adding a new baseline`)
  }
  return { failures, warnings }
}
function writeJson(rel, payload) {
  const path = join(root, rel)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(payload, null, 2) + '\n')
}

const files = walk(join(root, 'src'))
const findings = files.flatMap(scanFile).sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.code.localeCompare(b.code))
const current = summarize(findings)
if (writeBaseline) {
  writeJson(baselineRel, {
    schema_version: '1.0',
    generated_at: new Date().toISOString(),
    policy: 'Product-flow UI readability/layout density debt may burn down but cannot increase. New dense long-copy/no-wrap controls fail closed.',
    rules: ruleMeta,
    ...current,
  })
}
let baseline = null
if (existsSync(baselinePath)) baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
const failures = []
const warnings = []
if (baseline) {
  const cmp = compare(current, baseline)
  failures.push(...cmp.failures)
  warnings.push(...cmp.warnings)
} else if (current.totals.errors > 0) {
  failures.push(...findings.filter(f => f.severity === 'error').map(f => `${f.file}:${f.line} ${f.code}: ${f.message}`))
}
const result = {
  status: failures.length ? 'FAIL' : (warnings.length ? 'PASS_WITH_NOTES' : 'PASS'),
  policy: 'Product-flow UI must remain readable under long Chinese copy: content controls wrap, dense grids avoid tiny text/truncate, and legacy density debt cannot increase.',
  baseline: baselineRel,
  current,
  baseline_totals: baseline?.totals || null,
  failures,
  warnings,
}
writeJson(reportRel, result)
console.log(JSON.stringify(result, null, 2))
process.exit(failures.length ? 1 : 0)
