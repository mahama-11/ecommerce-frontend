#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const args = process.argv.slice(2)
const registryRel = valueAfter('--registry') ?? 'docs/ecommerce-page-position-registry.json'
const reportRel = valueAfter('--report') ?? 'reports/frontend-style-consistency/page-position-report.json'
const changedFilesArg = valueAfter('--changed-files')

const allowedPageTypes = new Set([
  'marketing-page',
  'workspace-home',
  'object-detail',
  'production-station',
  'library-management',
  'settings-admin',
  'redirect-legacy',
  'utility-support',
])

const defaultRequiredRoutes = [
  '/',
  '/home',
  '/pricing',
  '/solutions',
  '/login',
  '/products',
  '/products/:id',
  '/products/workbench/visual-tools',
  '/products/workbench/visual-tools/:toolSlug',
  '/products/:productId/ai/:toolSlug',
  '/products/:id/production/prep',
  '/products/:id/production/sandbox',
  '/products/:id/production/workshop',
  '/aiChat/template',
  '/products/workbench/downloads',
  '/account/profile',
  '/account/assets',
  '/account/history',
  '/account/templates',
  '/account/billing',
  '/org/overview',
  '/inventory/*',
  '/aiChat/batchListing',
  '/products/workbench/batch-listing',
  '/draw/product-home',
  '/draw/product-records',
  '/downloadCenter',
]

const criticalRouteTypes = new Map([
  ['/products', 'workspace-home'],
  ['/products/:id', 'object-detail'],
  ['/products/workbench/visual-tools', 'production-station'],
  ['/products/workbench/visual-tools/:toolSlug', 'production-station'],
  ['/products/:productId/ai/:toolSlug', 'production-station'],
  ['/products/:id/production/prep', 'production-station'],
  ['/products/:id/production/sandbox', 'production-station'],
  ['/products/:id/production/workshop', 'production-station'],
  ['/aiChat/template', 'library-management'],
  ['/products/workbench/downloads', 'library-management'],
])

function valueAfter(name) {
  const idx = args.indexOf(name)
  if (idx >= 0 && args[idx + 1]) return args[idx + 1]
  const prefixed = args.find(arg => arg.startsWith(`${name}=`))
  return prefixed ? prefixed.slice(name.length + 1) : null
}

function absolute(relOrAbs) {
  return isAbsolute(relOrAbs) ? relOrAbs : join(root, relOrAbs)
}

function writeJson(rel, payload) {
  const path = absolute(rel)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(payload, null, 2) + '\n')
}

function readJson(relOrAbs) {
  return JSON.parse(readFileSync(absolute(relOrAbs), 'utf8'))
}

function runGit(argv) {
  const cp = spawnSync('git', argv, { cwd: root, encoding: 'utf8' })
  if (cp.status !== 0) return []
  return cp.stdout.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
}

function unique(values) {
  return [...new Set(values)].sort()
}

function readChangedFiles() {
  if (changedFilesArg) {
    const path = absolute(changedFilesArg)
    if (!existsSync(path)) return []
    return readFileSync(path, 'utf8').split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  }
  return unique([
    ...runGit(['diff', '--name-only', '--diff-filter=ACMRTUXB', 'HEAD', '--']),
    ...runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMRTUXB', '--']),
    ...runGit(['ls-files', '--others', '--exclude-standard']),
  ])
}

function present(value) {
  if (Array.isArray(value)) return value.length > 0 && value.some(item => String(item || '').trim())
  return String(value ?? '').trim().length > 0
}

function routeFiles(route) {
  return Array.isArray(route.files) ? route.files.filter(Boolean) : []
}

function routeMatchesFile(route, file) {
  return routeFiles(route).some(routeFile => file === routeFile || file.startsWith(`${routeFile}/`))
}

function validateRoute(route, idx, routesByPath, failures, warnings) {
  const label = route?.route || `routes[${idx}]`
  const missingCommon = ['route', 'pageType', 'surface', 'businessObject', 'solves', 'upstream', 'downstream', 'primaryAction', 'resultDestination', 'designPattern', 'userVisibleContext']
    .filter(key => !present(route?.[key]))
  if (missingCommon.length > 0) failures.push(`${label}: missing required fields: ${missingCommon.join(', ')}`)

  if (!allowedPageTypes.has(route?.pageType)) failures.push(`${label}: invalid pageType ${route?.pageType || '(missing)'}`)
  if (!Array.isArray(route?.forbiddenPatterns) || route.forbiddenPatterns.filter(Boolean).length === 0) {
    failures.push(`${label}: forbiddenPatterns must include at least one explicit anti-pattern`)
  }
  if (routesByPath.get(route?.route) !== route) failures.push(`${label}: duplicate route contract`)

  if (route?.pageType === 'redirect-legacy' && !present(route.canonicalRoute)) {
    failures.push(`${label}: redirect-legacy route must define canonicalRoute`)
  }
  if (route?.pageType !== 'redirect-legacy') {
    for (const key of ['solves', 'upstream', 'downstream', 'primaryAction', 'designPattern']) {
      if (!present(route[key])) failures.push(`${label}: non-redirect route must define ${key}`)
    }
  }
  if (route?.pageType === 'production-station') {
    for (const key of ['businessObject', 'input', 'expectedOutput', 'resultDestination']) {
      if (!present(route[key])) failures.push(`${label}: production-station must define ${key}`)
    }
  }
  if (route?.pageType === 'object-detail') {
    for (const key of ['businessObject', 'downstream']) {
      if (!present(route[key])) failures.push(`${label}: object-detail must define ${key}`)
    }
  }
  if (route?.pageType === 'library-management' && !present(route.collection)) {
    warnings.push(`${label}: library-management should define collection semantics`)
  }
}

const failures = []
const warnings = []
let registry = null
let routes = []
let changedFiles = []
let changedRouteContracts = []
let changedRoutesRequiringEvidence = []

if (!existsSync(absolute(registryRel))) {
  failures.push(`${registryRel}: registry file missing`)
} else {
  try {
    registry = readJson(registryRel)
    if (!present(registry.schemaVersion)) failures.push('registry: schemaVersion is required')
    if (!registry.productBackbone || !present(registry.productBackbone.primaryObject)) failures.push('registry: productBackbone.primaryObject is required')
    if (!Array.isArray(registry.productBackbone?.businessLoop) || registry.productBackbone.businessLoop.length === 0) failures.push('registry: productBackbone.businessLoop is required')

    const registryTypes = Object.keys(registry.pageTypes || {})
    for (const type of allowedPageTypes) {
      if (!registryTypes.includes(type)) failures.push(`registry.pageTypes missing ${type}`)
    }
    for (const type of registryTypes) {
      if (!allowedPageTypes.has(type)) failures.push(`registry.pageTypes contains unknown type ${type}`)
    }

    routes = Array.isArray(registry.routes) ? registry.routes : []
    if (!Array.isArray(registry.routes)) failures.push('registry.routes must be an array')
    const routesByPath = new Map()
    for (const route of routes) {
      if (routesByPath.has(route.route)) failures.push(`${route.route}: duplicate route contract`)
      routesByPath.set(route.route, route)
    }

    const requiredRoutes = Array.isArray(registry.requiredRoutes) && registry.requiredRoutes.length ? registry.requiredRoutes : defaultRequiredRoutes
    for (const required of requiredRoutes) {
      if (!routesByPath.has(required)) failures.push(`missing required page-position route contract: ${required}`)
    }

    for (const [criticalRoute, expectedType] of criticalRouteTypes) {
      const route = routesByPath.get(criticalRoute)
      if (route && route.pageType !== expectedType) failures.push(`${criticalRoute}: must be classified as ${expectedType}, got ${route.pageType}`)
    }

    routes.forEach((route, idx) => validateRoute(route, idx, routesByPath, failures, warnings))

    changedFiles = readChangedFiles().filter(file => !file.startsWith('dist/'))
    changedRouteContracts = routes
      .filter(route => changedFiles.some(file => routeMatchesFile(route, file)))
      .map(route => ({
        route: route.route,
        pageType: route.pageType,
        files: routeFiles(route).filter(file => changedFiles.includes(file) || changedFiles.some(changed => changed.startsWith(`${file}/`))),
        evidenceRouteIds: route.evidenceRouteIds || [],
      }))
    changedRoutesRequiringEvidence = changedRouteContracts.filter(item => ['workspace-home', 'object-detail', 'production-station', 'library-management'].includes(item.pageType))

    for (const item of changedRouteContracts) {
      if (!routesByPath.has(item.route)) failures.push(`${item.route}: changed route has no registry contract`)
    }
  } catch (error) {
    failures.push(`${registryRel}: invalid JSON or registry validation error: ${error.message}`)
  }
}

const result = {
  status: failures.length ? 'FAIL' : (warnings.length ? 'PASS_WITH_NOTES' : 'PASS'),
  policy: 'Every critical Ecommerce route must declare its internal page position, page type, business object, upstream/downstream, primary action, result destination, design pattern, and forbidden anti-patterns. This is internal governance, not a customer-facing sitemap.',
  registry: registryRel,
  schemaVersion: registry?.schemaVersion || null,
  allowed_page_types: [...allowedPageTypes],
  required_routes: registry?.requiredRoutes || defaultRequiredRoutes,
  route_count: routes.length,
  changed_files: changedFiles,
  changed_route_contracts: changedRouteContracts,
  changed_routes_requiring_evidence: changedRoutesRequiringEvidence,
  failures,
  warnings,
}

writeJson(reportRel, result)
console.log(JSON.stringify(result, null, 2))
process.exit(failures.length ? 1 : 0)
