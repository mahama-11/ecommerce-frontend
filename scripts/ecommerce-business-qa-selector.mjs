#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const root = process.cwd()
const selectorFile = path.join(root, 'tests/e2e/support/selectors.ts')
const outDir = path.join(root, 'reports/business-interaction-qa')
fs.mkdirSync(outDir, { recursive: true })

const selectorSource = fs.readFileSync(selectorFile, 'utf8')
const selectorBlocks = [...selectorSource.matchAll(/testId: '([^']+)'[\s\S]*?sourcePath: '([^']+)'[\s\S]*?qaIds: \[([^\]]*)\]/g)].map(match => ({
  testId: match[1],
  sourcePath: match[2],
  qaIds: [...match[3].matchAll(/'([^']+)'/g)].map(item => item[1]),
}))

const missingSelectors = []
for (const item of selectorBlocks) {
  const sourcePath = path.join(root, item.sourcePath)
  if (!fs.existsSync(sourcePath)) {
    missingSelectors.push({ ...item, reason: 'source_missing' })
    continue
  }
  const source = fs.readFileSync(sourcePath, 'utf8')
  if (!source.includes(`data-testid="${item.testId}"`) && !source.includes(`data-testid={\`${item.testId}`) && !source.includes(`data-testid='${item.testId}'`) && !source.includes(`testId="${item.testId}"`)) {
    missingSelectors.push({ ...item, reason: 'testid_missing_in_source' })
  }
}

function gitList(command) {
  try {
    return execSync(command, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  } catch {
    return []
  }
}

const explicitFiles = process.env.BUSINESS_QA_CHANGED_FILES?.split(/[\n,]/).map(item => item.trim()).filter(Boolean)
const changedFiles = explicitFiles?.length ? explicitFiles : Array.from(new Set([
  ...gitList('git diff --name-only'),
  ...gitList('git diff --cached --name-only'),
  ...gitList('git ls-files --others --exclude-standard'),
]))

const rules = [
  { name: 'product-core', spec: 'tests/e2e/business/product-core.business.spec.ts', patterns: [/^src\/services\/(auth|http|product)\.ts$/, /^src\/pages\/product\//, /^src\/components\/product-workbench\//] },
  { name: 'production-pipeline', spec: 'tests/e2e/business/production-listing-export.business.spec.ts', patterns: [/^src\/services\/(production|imageRuntime)\.ts$/, /^src\/pages\/production\//, /^src\/components\/production\//] },
  { name: 'auth', spec: 'tests/e2e/business/auth-protected-route.business.spec.ts', patterns: [/^src\/pages\/auth\//, /^src\/components\/auth\//, /^src\/services\/(auth|http)\.ts$/] },
  { name: 'downloads', spec: 'tests/e2e/business/production-listing-export.business.spec.ts', patterns: [/^src\/pages\/account\/AccountDownloadsPage\.tsx$/, /^src\/services\/commercial\.ts$/] },
  { name: 'all-p0', spec: 'ALL', patterns: [/^contracts\/ecommerce\.openapi\.json$/, /^src\/api\/generated\/ecommerce-contract\.ts$/, /^src\/router\/index\.tsx$/] },
]

const selected = new Set()
const matchedRules = []
for (const file of changedFiles) {
  for (const rule of rules) {
    if (rule.patterns.some(pattern => pattern.test(file))) {
      matchedRules.push({ file, rule: rule.name })
      if (rule.spec === 'ALL') {
        selected.add('tests/e2e/business/auth-protected-route.business.spec.ts')
        selected.add('tests/e2e/business/product-core.business.spec.ts')
        selected.add('tests/e2e/business/production-listing-export.business.spec.ts')
      } else {
        selected.add(rule.spec)
      }
    }
  }
}
if (selected.size === 0) {
  selected.add('tests/e2e/business/auth-protected-route.business.spec.ts')
}

const report = {
  feature_id: 'ecommerce-frontend-business-interaction-qa-selector',
  generated_at: new Date().toISOString(),
  changed_files: changedFiles,
  matched_rules: matchedRules,
  selected_specs: Array.from(selected),
  selector_registry: {
    count: selectorBlocks.length,
    missing: missingSelectors,
    status: missingSelectors.length === 0 ? 'PASS' : 'FAIL',
  },
}

fs.writeFileSync(path.join(outDir, 'selector-report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (missingSelectors.length) process.exit(1)
