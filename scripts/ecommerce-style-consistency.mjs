#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const root = process.cwd()
const args = new Set(process.argv.slice(2))
const writeBaseline = args.has('--write-baseline')
const baselineRel = 'scripts/ecommerce-style-consistency-baseline.json'
const baselinePath = join(root, baselineRel)

const requiredFiles = [
  'src/components/ui/Button.tsx',
  'src/components/ui/EcomShell.tsx',
  'src/index.css',
]
const criticalFiles = [
  'src/layouts/ProductWorkbenchLayout.tsx',
  'src/layouts/ProductionLayout.tsx',
]
const tokenNeedles = [
  '--ecom-bg',
  '--ecom-surface-hover',
  '--ecom-action-primary',
  '--ecom-text-muted',
  '--ecom-border-strong',
]
const strictForbiddenInCritical = [
  { key: 'rawHexUtility', name: 'raw hex color utility', re: /(?:bg|text|border)-\[#[0-9a-fA-F]{3,8}\]/g },
  { key: 'bareButton', name: 'bare button element', re: /<button\b/g },
  { key: 'adHocWhiteHover', name: 'ad-hoc white hover surface', re: /hover:bg-white\/\[/g },
  { key: 'adHocHeaderBg', name: 'ad-hoc header background', re: /bg-\[#080b11\]/g },
]
const baselineRules = [
  ...strictForbiddenInCritical,
  { key: 'randomDarkHex', name: 'random dark hex utility', re: /(?:bg|text|border)-\[#(?:0a0a12|080b11|09090b|0b0d14|0a0a0f|111827|020617)\]/gi },
]
const scanExts = new Set(['.tsx', '.jsx'])
const ignoredDirs = new Set(['node_modules', 'dist', '.git'])
const ignoredFiles = new Set([
  'src/components/ui/Button.tsx',
])
const failures = []

function extname(path) {
  const idx = path.lastIndexOf('.')
  return idx === -1 ? '' : path.slice(idx)
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (ignoredDirs.has(name)) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (scanExts.has(extname(full))) out.push(full)
  }
  return out
}

function countMatches(text, re) {
  const matches = text.match(re)
  return matches ? matches.length : 0
}

function scanFile(abs) {
  const rel = relative(root, abs).replaceAll('\\', '/')
  const text = readFileSync(abs, 'utf8')
  const counts = {}
  let total = 0
  for (const rule of baselineRules) {
    const count = countMatches(text, rule.re)
    counts[rule.key] = count
    total += count
  }
  return { rel, counts, total }
}

function scanRepo() {
  const src = join(root, 'src')
  if (!existsSync(src)) return {}
  const result = {}
  for (const abs of walk(src)) {
    const entry = scanFile(abs)
    if (ignoredFiles.has(entry.rel)) continue
    if (entry.total > 0) result[entry.rel] = entry.counts
  }
  return result
}

function sumCounts(scan) {
  const totals = Object.fromEntries(baselineRules.map(rule => [rule.key, 0]))
  let files = 0
  for (const counts of Object.values(scan)) {
    files += 1
    for (const key of Object.keys(totals)) totals[key] += counts[key] || 0
  }
  return { files, totals }
}

for (const rel of requiredFiles) {
  if (!existsSync(join(root, rel))) failures.push(`${rel}: required design-system file missing`)
}

const cssPath = join(root, 'src/index.css')
if (existsSync(cssPath)) {
  const css = readFileSync(cssPath, 'utf8')
  for (const token of tokenNeedles) {
    if (!css.includes(token)) failures.push(`src/index.css: missing token ${token}`)
  }
}

for (const rel of criticalFiles) {
  const path = join(root, rel)
  if (!existsSync(path)) {
    failures.push(`${rel}: missing critical shell file`)
    continue
  }
  const text = readFileSync(path, 'utf8')
  if (!text.includes("@/components/ui/Button")) failures.push(`${rel}: must use shared Button/ButtonLink`)
  if (!text.includes("@/components/ui/EcomShell")) failures.push(`${rel}: must use shared EcomShell/Header/NavPill`)
  for (const rule of strictForbiddenInCritical) {
    if (countMatches(text, rule.re) > 0) failures.push(`${rel}: ${rule.name} is not allowed in critical shells`)
  }
}

const currentScan = scanRepo()
if (writeBaseline) {
  const payload = {
    schema_version: '1.0',
    policy: 'No new style drift. Historical page-local styling is allowed only while it is burned down; counts may decrease but not increase.',
    rules: baselineRules.map(({ key, name }) => ({ key, name })),
    scan: currentScan,
    totals: sumCounts(currentScan),
  }
  mkdirSync(dirname(baselinePath), { recursive: true })
  writeFileSync(baselinePath, JSON.stringify(payload, null, 2) + '\n')
}

let baseline = null
if (existsSync(baselinePath)) {
  baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
  const allowed = baseline.scan || {}
  for (const [rel, counts] of Object.entries(currentScan)) {
    const baselineCounts = allowed[rel]
    if (!baselineCounts) {
      failures.push(`${rel}: new file has design-system drift (${JSON.stringify(counts)}); use shared UI components/tokens instead of adding a new baseline`)
      continue
    }
    for (const rule of baselineRules) {
      const current = counts[rule.key] || 0
      const previous = baselineCounts[rule.key] || 0
      if (current > previous) failures.push(`${rel}: ${rule.name} increased ${previous} -> ${current}`)
    }
  }
  for (const [rel, counts] of Object.entries(allowed)) {
    if (currentScan[rel]) continue
    const removedTotal = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0)
    if (removedTotal > 0 && !writeBaseline) {
      // Deletions/reductions are allowed; baseline can be refreshed in the same PR.
    }
  }
} else if (!writeBaseline) {
  failures.push(`${baselineRel}: baseline missing; run npm run style:consistency -- --write-baseline once after auditing current drift`)
}

const result = {
  status: failures.length ? 'FAIL' : 'PASS',
  checked: { requiredFiles, criticalFiles, tokenNeedles, baseline: baselineRel },
  currentTotals: sumCounts(currentScan),
  baselineTotals: baseline?.totals ?? null,
  failures,
}
console.log(JSON.stringify(result, null, 2))
process.exit(failures.length ? 1 : 0)
