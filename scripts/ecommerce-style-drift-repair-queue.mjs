#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = process.cwd()
const args = process.argv.slice(2)
const baselineRel = valueAfter('--baseline') ?? 'scripts/ecommerce-style-consistency-baseline.json'
const reportRel = valueAfter('--report') ?? 'reports/frontend-style-consistency/style-drift-repair-queue.json'
const limit = Number(valueAfter('--limit') ?? 20)

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

function priorityFor(path, total, counts) {
  if (/src\/layouts\//.test(path) || /src\/pages\/product\//.test(path) || /src\/pages\/production\//.test(path)) return 'P0'
  if (/src\/components\/product-workbench\//.test(path)) return 'P1'
  if (total >= 8 || (counts.bareButton || 0) >= 4) return 'P1'
  return 'P2'
}

function recommendedActions(counts) {
  const actions = []
  if ((counts.bareButton || 0) > 0) actions.push('replace bare <button> with shared Button/ButtonLink or documented primitive')
  if ((counts.rawHexUtility || 0) > 0 || (counts.randomDarkHex || 0) > 0) actions.push('replace raw dark/hex utilities with var(--ecom-*) tokens')
  if ((counts.adHocWhiteHover || 0) > 0) actions.push('replace ad-hoc hover:bg-white/[...] with shared hover/surface token')
  if ((counts.adHocHeaderBg || 0) > 0) actions.push('replace hardcoded header background with EcomShell/shared surface')
  return actions
}

function main() {
  const baselinePath = join(root, baselineRel)
  if (!existsSync(baselinePath)) {
    const payload = { status: 'FAIL', reason: `baseline missing: ${baselineRel}` }
    writeJson(reportRel, payload)
    console.log(JSON.stringify(payload, null, 2))
    process.exit(1)
  }
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
  const scan = baseline.scan || {}
  const rows = Object.entries(scan)
    .map(([path, counts]) => {
      const total = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0)
      return {
        id: `style-drift:${path}`,
        path,
        priority: priorityFor(path, total, counts),
        total,
        counts,
        recommended_actions: recommendedActions(counts),
        acceptance_criteria: [
          'npm run style:consistency passes',
          'file-level drift count decreases compared with baseline',
          'do not add a new baseline unless total drift decreases',
          'if product-flow UI changes visually, attach/generated evidence-manifest screenshots',
        ],
      }
    })
    .filter(row => row.total > 0)
    .sort((a, b) => {
      const order = { P0: 0, P1: 1, P2: 2 }
      return order[a.priority] - order[b.priority] || b.total - a.total || a.path.localeCompare(b.path)
    })

  const totals = baseline.totals || null
  const batches = []
  let current = []
  let currentTotal = 0
  for (const row of rows) {
    if (current.length >= 4 || currentTotal >= 20) {
      batches.push({ batch_id: `style-drift-batch-${String(batches.length + 1).padStart(2, '0')}`, items: current, estimated_drift_points: currentTotal })
      current = []
      currentTotal = 0
    }
    current.push(row)
    currentTotal += row.total
  }
  if (current.length) batches.push({ batch_id: `style-drift-batch-${String(batches.length + 1).padStart(2, '0')}`, items: current, estimated_drift_points: currentTotal })

  const payload = {
    schema_version: '1.0',
    status: 'PASS',
    generated_by: 'scripts/ecommerce-style-drift-repair-queue.mjs',
    generated_at: new Date().toISOString(),
    policy: 'Historical style drift must monotonically burn down. New drift is blocked; repair queue orders existing drift by product-criticality and size.',
    baseline: baselineRel,
    totals,
    queue_size: rows.length,
    top_items: rows.slice(0, limit),
    batches,
  }
  writeJson(reportRel, payload)
  console.log(JSON.stringify(payload, null, 2))
}

main()
