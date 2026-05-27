#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = process.cwd()
const args = process.argv.slice(2)
const manifestRel = valueAfter('--manifest') ?? 'reports/frontend-style-consistency/evidence-manifest.json'
const reportRel = valueAfter('--report') ?? 'reports/frontend-quality/runtime-layout-latest.json'

function readRequiredRouteIds() {
  const fallback = [
    'product-center',
    'template-center',
    'batch-listing-legacy',
    'product-batch-listing-legacy',
    'visual-tools-index',
    'visual-tools-ai-wearable',
    'product-detail',
    'production-prep',
    'production-sandbox',
    'production-workshop',
    'downloads',
  ]
  try {
    const registry = JSON.parse(readFileSync(join(root, 'docs/ecommerce-page-position-registry.json'), 'utf8'))
    const ids = new Set(fallback)
    for (const route of registry.routes || []) {
      for (const id of route.evidenceRouteIds || []) ids.add(id)
    }
    return [...ids].sort()
  } catch {
    return fallback
  }
}
const requiredRouteIds = readRequiredRouteIds()
function knownRouteIds() {
  const ids = new Set(requiredRouteIds)
  try {
    const registry = JSON.parse(readFileSync(join(root, 'docs/ecommerce-page-position-registry.json'), 'utf8'))
    for (const route of registry.routes || []) {
      if (route.routeId) ids.add(route.routeId)
      for (const id of route.evidenceRouteIds || []) ids.add(id)
    }
  } catch {}
  return ids
}

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

function readJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), 'utf8'))
}

function routeIdsFrom(manifest) {
  const ids = new Set()
  for (const route of manifest.routes || []) {
    if (route?.id) ids.add(route.id)
  }
  for (const shot of manifest.screenshots || []) {
    if (shot?.route_id) ids.add(shot.route_id)
  }
  return ids
}

function normalizeFindings(manifest) {
  const findings = []
  for (const finding of manifest.overflow_report?.findings || []) {
    findings.push(finding)
  }
  for (const shot of manifest.screenshots || []) {
    for (const finding of shot.overflow_findings || []) {
      findings.push({ route_id: shot.route_id, viewport_id: shot.viewport_id, ...finding })
    }
    const count = Number(shot.overflow_finding_count || 0)
    if (count > 0 && (!shot.overflow_findings || shot.overflow_findings.length === 0)) {
      findings.push({ route_id: shot.route_id, viewport_id: shot.viewport_id, type: 'overflow-finding-count', count })
    }
  }
  const seen = new Set()
  return findings.filter(finding => {
    const key = JSON.stringify(finding)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function summarizeConsoleAndNetwork(manifest) {
  const screenshots = manifest.screenshots || []
  const consoleErrors = screenshots.filter(item => Number(item.console_error_count || 0) > 0)
  const networkFailures = screenshots.filter(item => Number(item.network_failure_count || 0) > 0)
  return { consoleErrors, networkFailures }
}

const failures = []
const warnings = []
let manifest = null

if (!existsSync(join(root, manifestRel))) {
  warnings.push(`${manifestRel}: visual evidence manifest missing; runtime layout gate cannot check page-level clipping yet`)
} else {
  try {
    manifest = readJson(manifestRel)
    const ids = routeIdsFrom(manifest)
    const knownIds = knownRouteIds()
    for (const required of requiredRouteIds) {
      if (!ids.has(required)) failures.push(`missing required runtime layout route inventory: ${required}`)
    }
    for (const observed of ids) {
      if (!knownIds.has(observed)) failures.push(`visual evidence route id is not declared in the page-position registry: ${observed}`)
    }

    const overflowFindings = normalizeFindings(manifest)
    for (const finding of overflowFindings) {
      failures.push(`${finding.route_id || 'unknown-route'} ${finding.viewport_id || 'unknown-viewport'} has clipping/overflow finding: ${finding.type || 'overflow'} ${finding.text ? `(${String(finding.text).slice(0, 80)})` : ''}`.trim())
    }

    const { consoleErrors, networkFailures } = summarizeConsoleAndNetwork(manifest)
    if (consoleErrors.length > 0) warnings.push(`visual evidence contains console errors on ${consoleErrors.length} screenshot(s)`)
    if (networkFailures.length > 0) warnings.push(`visual evidence contains network failures on ${networkFailures.length} screenshot(s)`)
  } catch (error) {
    failures.push(`${manifestRel}: invalid JSON: ${error.message}`)
  }
}

const result = {
  status: failures.length ? 'FAIL' : (warnings.length ? 'PASS_WITH_NOTES' : 'PASS'),
  policy: 'Runtime frontend layout evidence must cover critical routes and fail closed on real browser clipping/overflow findings. HTTP 200, typecheck, and body-level overflow alone are insufficient.',
  manifest: manifestRel,
  required_route_ids: requiredRouteIds,
  observed_route_ids: manifest ? [...routeIdsFrom(manifest)].sort() : [],
  overflow_finding_count: manifest ? normalizeFindings(manifest).length : null,
  failures,
  warnings,
}

writeJson(reportRel, result)
console.log(JSON.stringify(result, null, 2))
process.exit(failures.length ? 1 : 0)
