#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = process.cwd()
const args = process.argv.slice(2)
const baselineRel = valueAfter('--baseline') ?? 'scripts/ecommerce-static-quality-baseline.json'
const reportRel = valueAfter('--report') ?? 'reports/frontend-quality/static-quality-latest.json'
const writeBaseline = args.includes('--write-baseline')
const failOnWarnings = args.includes('--fail-on-warnings')

const scanRoots = ['src']
const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.css'])
const allowFiles = new Set(['src/components/ui/Button.tsx', 'src/components/ui/EcomShell.tsx'])

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
function walk(dir, out = []) {
  for (const ent of readdirSync(join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${ent.name}`
    if (ent.isDirectory()) walk(rel, out)
    else if ([...exts].some(ext => rel.endsWith(ext))) out.push(rel)
  }
  return out
}
function lineNo(text, index) { return text.slice(0, index).split(/\r?\n/).length }
function add(findings, code, severity, file, line, message, evidence) { findings.push({ code, severity, file, line, message, evidence: evidence?.slice(0, 240) }) }
function scanFile(file) {
  const text = readFileSync(join(root, file), 'utf8')
  const findings = []
  const isTsx = /\.tsx$|\.jsx$/.test(file)
  const isCss = /\.css$/.test(file)
  const patterns = [
    ['a11y.img_missing_alt', 'error', /<img\b(?![^>]*\balt=)[^>]*>/g, 'Images must include alt text, or alt="" when decorative.'],
    ['a11y.interactive_nonsemantic', 'error', /<(div|span)\b(?=[^>]*\bonClick=)(?![^>]*\brole=)(?![^>]*\bonKey(?:Down|Up)=)[^>]*>/g, 'Clickable div/span needs semantic button/link or role plus keyboard handler.'],
    ['a11y.input_missing_name', 'warning', /<input\b(?![^>]*\bname=)(?![^>]*\btype=["'](?:hidden|submit|button|reset)["'])[^>]*>/g, 'Inputs should have meaningful name/autocomplete for browser and assistive tech.'],
    ['a11y.icon_button_missing_label', 'error', /<(?:Button|button)\b(?=[^>]*(?:size=["']icon-sm["']|className=["'][^"']*(?:\bh-8\b[^"']*\bw-8\b|\bsize-\d+\b)))(?![^>]*(?:aria-label=|aria-labelledby=|title=))[^>]*>/g, 'Icon-only buttons must include aria-label, aria-labelledby, or title.'],
    ['focus.outline_none_without_replacement', 'error', /outline-none(?![^"'`]*focus-visible:ring)/g, 'Do not remove outlines without a focus-visible replacement.'],
    ['motion.transition_all', 'warning', /\btransition-all\b/g, 'Avoid transition-all; list transform/opacity/color properties explicitly.'],
    ['style.inline_visual_style', 'warning', /style=\{\{/g, 'Avoid inline visual styles; use tokens/components unless this is measured layout or dynamic geometry.'],
  ]
  if (isTsx) {
    for (const [code, severity, regex, message] of patterns) {
      for (const m of text.matchAll(regex)) add(findings, code, severity, file, lineNo(text, m.index || 0), message, m[0])
    }
    for (const m of text.matchAll(/\b(fetch\(|axios\.(?:get|post|put|patch|delete)\()/g)) {
      if (!/^src\/(api|shared\/api|features\/[^/]+\/api)\//.test(file)) add(findings, 'architecture.direct_api_call', 'warning', file, lineNo(text, m.index || 0), 'API calls should be routed through a shared/feature API layer with typed contracts.', m[0])
    }
    for (const m of text.matchAll(/from\s+['"](\.\.\/){3,}[^'"]+['"]/g)) {
      add(findings, 'architecture.deep_parent_import', 'warning', file, lineNo(text, m.index || 0), 'Avoid deep parent imports; expose feature/shared APIs through index.ts.', m[0])
    }
  }
  if (isCss) {
    for (const m of text.matchAll(/transition:\s*all\b/g)) add(findings, 'motion.transition_all_css', 'warning', file, lineNo(text, m.index || 0), 'Avoid transition: all in CSS.', m[0])
    if (file === 'src/index.css' && !/color-scheme:\s*dark/.test(text)) add(findings, 'theme.missing_color_scheme_dark', 'warning', file, 1, 'Dark product theme should declare color-scheme: dark for native controls/scrollbars.', '')
  }
  return findings.filter(f => !allowFiles.has(f.file) || !['style.inline_visual_style'].includes(f.code))
}

function summarize(findings) {
  const byCode = {}
  const byFile = {}
  for (const f of findings) {
    byCode[f.code] ??= { errors: 0, warnings: 0, total: 0 }
    byCode[f.code][f.severity === 'error' ? 'errors' : 'warnings'] += 1
    byCode[f.code].total += 1
    byFile[f.file] ??= { errors: 0, warnings: 0, total: 0 }
    byFile[f.file][f.severity === 'error' ? 'errors' : 'warnings'] += 1
    byFile[f.file].total += 1
  }
  return {
    totals: { files: Object.keys(byFile).length, errors: findings.filter(f => f.severity === 'error').length, warnings: findings.filter(f => f.severity === 'warning').length, findings: findings.length },
    by_code: Object.fromEntries(Object.entries(byCode).sort(([a], [b]) => a.localeCompare(b))),
    by_file: Object.fromEntries(Object.entries(byFile).sort(([a], [b]) => a.localeCompare(b))),
    top_findings: findings.slice(0, 80),
  }
}
function compare(current, baseline) {
  const failures = []
  const warnings = []
  if ((current.totals.errors || 0) > (baseline.totals?.errors || 0)) failures.push(`Static quality errors increased: current=${current.totals.errors} baseline=${baseline.totals?.errors || 0}`)
  if ((current.totals.warnings || 0) > (baseline.totals?.warnings || 0)) {
    const msg = `Static quality warnings increased: current=${current.totals.warnings} baseline=${baseline.totals?.warnings || 0}`
    if (failOnWarnings) failures.push(msg); else warnings.push(msg)
  }
  for (const [code, c] of Object.entries(current.by_code || {})) {
    const b = baseline.by_code?.[code] || { errors: 0, warnings: 0 }
    if ((c.errors || 0) > (b.errors || 0)) failures.push(`${code} errors increased: current=${c.errors || 0} baseline=${b.errors || 0}`)
    if ((c.warnings || 0) > (b.warnings || 0)) {
      const msg = `${code} warnings increased: current=${c.warnings || 0} baseline=${b.warnings || 0}`
      if (failOnWarnings) failures.push(msg); else warnings.push(msg)
    }
  }
  return { failures, warnings }
}

const files = scanRoots.flatMap(rootDir => walk(rootDir))
const findings = files.flatMap(scanFile).sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.code.localeCompare(b.code))
const current = summarize(findings)
if (writeBaseline) writeJson(baselineRel, { generated_at: new Date().toISOString(), policy: 'Accessibility, interaction, architecture, and token-adjacent static issues may burn down but cannot increase.', ...current })
let baseline = null
const baselinePath = join(root, baselineRel)
if (existsSync(baselinePath)) baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
const failures = []
const warnings = []
if (!writeBaseline && !baseline) failures.push(`Missing static quality baseline ${baselineRel}; run npm run quality:static -- --write-baseline after reviewing current debt`)
if (baseline) {
  const cmp = compare(current, baseline)
  failures.push(...cmp.failures)
  warnings.push(...cmp.warnings)
}
const result = { status: failures.length ? 'FAIL' : (warnings.length ? 'PASS_WITH_NOTES' : 'PASS'), policy: 'Static frontend quality issues cannot increase; use shared UI/API layers and accessible semantics.', baseline: baselineRel, current, baseline_totals: baseline?.totals || null, failures, warnings }
writeJson(reportRel, result)
console.log(JSON.stringify(result, null, 2))
process.exit(failures.length ? 1 : 0)
