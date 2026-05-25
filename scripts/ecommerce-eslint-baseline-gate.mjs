#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const args = process.argv.slice(2)
const baselineRel = valueAfter('--baseline') ?? 'scripts/ecommerce-eslint-baseline.json'
const reportRel = valueAfter('--report') ?? 'reports/frontend-quality/eslint-baseline-latest.json'
const writeBaseline = args.includes('--write-baseline')
const failOnWarnings = args.includes('--fail-on-warnings')

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

function normalizeFile(filePath) {
  return relative(root, filePath).replaceAll('\\', '/')
}

function runEslintJson() {
  const cp = spawnSync('npx', ['eslint', '.', '--format', 'json'], { cwd: root, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 })
  let parsed = []
  try {
    parsed = JSON.parse(cp.stdout || '[]')
  } catch (error) {
    return { status: 'ERROR', exit_code: cp.status ?? 127, error: `Failed to parse ESLint JSON: ${error.message}`, stderr_tail: (cp.stderr || '').slice(-4000), raw_stdout_tail: (cp.stdout || '').slice(-4000), files: [] }
  }
  return { status: 'OK', exit_code: cp.status ?? 0, stderr_tail: (cp.stderr || '').slice(-4000), files: parsed }
}

function summarize(results) {
  const byRule = {}
  const byFile = {}
  const findings = []
  for (const file of results.files || []) {
    const rel = normalizeFile(file.filePath)
    const fileSummary = { errors: file.errorCount || 0, warnings: file.warningCount || 0, rules: {} }
    for (const msg of file.messages || []) {
      const ruleId = msg.ruleId || 'fatal-or-parser'
      const severity = msg.severity === 2 ? 'error' : 'warning'
      byRule[ruleId] ??= { errors: 0, warnings: 0, total: 0 }
      byRule[ruleId][severity === 'error' ? 'errors' : 'warnings'] += 1
      byRule[ruleId].total += 1
      fileSummary.rules[ruleId] ??= { errors: 0, warnings: 0, total: 0 }
      fileSummary.rules[ruleId][severity === 'error' ? 'errors' : 'warnings'] += 1
      fileSummary.rules[ruleId].total += 1
      findings.push({ file: rel, line: msg.line, column: msg.column, severity, rule_id: ruleId, message: msg.message })
    }
    if (fileSummary.errors || fileSummary.warnings) byFile[rel] = fileSummary
  }
  return {
    totals: {
      files: Object.keys(byFile).length,
      errors: Object.values(byFile).reduce((sum, file) => sum + file.errors, 0),
      warnings: Object.values(byFile).reduce((sum, file) => sum + file.warnings, 0),
      findings: findings.length,
    },
    by_rule: Object.fromEntries(Object.entries(byRule).sort(([a], [b]) => a.localeCompare(b))),
    by_file: Object.fromEntries(Object.entries(byFile).sort(([a], [b]) => a.localeCompare(b))),
    top_findings: findings.slice(0, 50),
  }
}

function compare(current, baseline) {
  const failures = []
  const warnings = []
  const bTotals = baseline.totals || {}
  const cTotals = current.totals || {}
  if ((cTotals.errors || 0) > (bTotals.errors || 0)) failures.push(`ESLint errors increased: current=${cTotals.errors || 0} baseline=${bTotals.errors || 0}`)
  if ((cTotals.warnings || 0) > (bTotals.warnings || 0)) {
    const msg = `ESLint warnings increased: current=${cTotals.warnings || 0} baseline=${bTotals.warnings || 0}`
    if (failOnWarnings) failures.push(msg)
    else warnings.push(msg)
  }
  for (const [rule, c] of Object.entries(current.by_rule || {})) {
    const b = baseline.by_rule?.[rule] || { errors: 0, warnings: 0, total: 0 }
    if ((c.errors || 0) > (b.errors || 0)) failures.push(`ESLint rule ${rule} errors increased: current=${c.errors || 0} baseline=${b.errors || 0}`)
    if ((c.warnings || 0) > (b.warnings || 0)) {
      const msg = `ESLint rule ${rule} warnings increased: current=${c.warnings || 0} baseline=${b.warnings || 0}`
      if (failOnWarnings) failures.push(msg)
      else warnings.push(msg)
    }
  }
  return { failures, warnings }
}

const eslint = runEslintJson()
const current = eslint.status === 'OK' ? summarize(eslint) : { totals: {}, by_rule: {}, by_file: {}, top_findings: [] }
const baselinePath = join(root, baselineRel)
if (writeBaseline) {
  const baseline = { generated_at: new Date().toISOString(), policy: 'Existing ESLint debt is recorded as a ceiling; future frontend increments must not increase errors or rule-level debt.', ...current }
  writeJson(baselineRel, baseline)
}
let baseline = null
if (existsSync(baselinePath)) baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
const failures = []
const warnings = []
if (eslint.status !== 'OK') failures.push(eslint.error || 'ESLint execution failed')
if (!writeBaseline && !baseline) failures.push(`Missing ESLint baseline ${baselineRel}; run npm run lint:baseline -- --write-baseline after reviewing current debt`)
if (baseline) {
  const cmp = compare(current, baseline)
  failures.push(...cmp.failures)
  warnings.push(...cmp.warnings)
}
const result = {
  status: failures.length ? 'FAIL' : (warnings.length ? 'PASS_WITH_NOTES' : 'PASS'),
  policy: 'ESLint debt may burn down but cannot increase versus scripts/ecommerce-eslint-baseline.json.',
  eslint_exit_code: eslint.exit_code,
  baseline: baselineRel,
  current,
  baseline_totals: baseline?.totals || null,
  failures,
  warnings,
}
writeJson(reportRel, result)
console.log(JSON.stringify(result, null, 2))
process.exit(failures.length ? 1 : 0)
