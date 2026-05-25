#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { gzipSync } from 'node:zlib'

const root = process.cwd()
const args = process.argv.slice(2)
const reportRel = valueAfter('--report') ?? 'reports/frontend-quality/bundle-budget-latest.json'
const baselineRel = valueAfter('--baseline') ?? 'scripts/ecommerce-bundle-budget-baseline.json'
const writeBaseline = args.includes('--write-baseline')
const maxInitialJsGzip = Number(valueAfter('--max-initial-js-gzip') ?? 350 * 1024)
const maxChunkJsGzip = Number(valueAfter('--max-chunk-js-gzip') ?? 200 * 1024)
const maxGrowthRatio = Number(valueAfter('--max-growth-ratio') ?? 1.05)
const maxGrowthBytes = Number(valueAfter('--max-growth-bytes') ?? 20 * 1024)

function valueAfter(name) { const idx = args.indexOf(name); if (idx >= 0 && args[idx + 1]) return args[idx + 1]; const p = args.find(a => a.startsWith(`${name}=`)); return p ? p.slice(name.length + 1) : null }
function writeJson(rel, payload) { const path = join(root, rel); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, JSON.stringify(payload, null, 2) + '\n') }
function walk(dir, out = []) { if (!existsSync(join(root, dir))) return out; for (const ent of readdirSync(join(root, dir), { withFileTypes: true })) { const rel = `${dir}/${ent.name}`; if (ent.isDirectory()) walk(rel, out); else out.push(rel) } return out }
function assetRows() {
  return walk('dist').filter(f => ['.js', '.css'].includes(extname(f))).map(file => {
    const buf = readFileSync(join(root, file))
    return { file, bytes: statSync(join(root, file)).size, gzip_bytes: gzipSync(buf).length, type: extname(file).slice(1) }
  }).sort((a, b) => b.gzip_bytes - a.gzip_bytes)
}
function summarize(rows) { return { totals: { assets: rows.length, js_gzip_bytes: rows.filter(r => r.type === 'js').reduce((s, r) => s + r.gzip_bytes, 0), css_gzip_bytes: rows.filter(r => r.type === 'css').reduce((s, r) => s + r.gzip_bytes, 0) }, largest_assets: rows.slice(0, 20), budgets: { max_initial_js_gzip: maxInitialJsGzip, max_chunk_js_gzip: maxChunkJsGzip } } }
const failures = []
const warnings = []
let current = null
if (!existsSync(join(root, 'dist'))) failures.push('dist/ missing; run npm run build before bundle budget check')
else {
  const rows = assetRows()
  current = summarize(rows)
  const jsRows = rows.filter(r => r.type === 'js')
  const largestJs = jsRows[0]
  if (largestJs && largestJs.gzip_bytes > maxInitialJsGzip) failures.push(`Largest JS gzip asset ${largestJs.file} is ${largestJs.gzip_bytes} bytes > budget ${maxInitialJsGzip}`)
  for (const r of jsRows.slice(1)) if (r.gzip_bytes > maxChunkJsGzip) warnings.push(`Lazy JS chunk ${r.file} is ${r.gzip_bytes} bytes > budget ${maxChunkJsGzip}`)
}
if (writeBaseline && current) writeJson(baselineRel, { generated_at: new Date().toISOString(), policy: 'Bundle size should not silently grow; use this baseline for review and future budgets.', ...current })
let baseline = null
if (existsSync(join(root, baselineRel))) baseline = JSON.parse(readFileSync(join(root, baselineRel), 'utf8'))
if (!writeBaseline && current && baseline?.totals) {
  for (const key of ['js_gzip_bytes', 'css_gzip_bytes']) {
    const currentValue = current.totals[key] || 0
    const baselineValue = baseline.totals[key] || 0
    const allowed = Math.max(Math.ceil(baselineValue * maxGrowthRatio), baselineValue + maxGrowthBytes)
    if (currentValue > allowed) failures.push(`${key} grew beyond budget: current=${currentValue} baseline=${baselineValue} allowed=${allowed}`)
  }
}
const result = { status: failures.length ? 'FAIL' : (warnings.length ? 'PASS_WITH_NOTES' : 'PASS'), policy: 'Built frontend assets must stay within explicit gzip budgets after npm run build and cannot silently grow versus baseline.', baseline: existsSync(join(root, baselineRel)) ? baselineRel : null, current, baseline_totals: baseline?.totals || null, growth_policy: { max_growth_ratio: maxGrowthRatio, max_growth_bytes: maxGrowthBytes }, failures, warnings }
writeJson(reportRel, result)
console.log(JSON.stringify(result, null, 2))
process.exit(failures.length ? 1 : 0)
