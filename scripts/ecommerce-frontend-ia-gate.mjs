#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = process.cwd()
const args = process.argv.slice(2)
const docRel = valueAfter('--doc') ?? 'docs/frontend-product-ia-governance.md'
const reportRel = valueAfter('--report') ?? 'reports/frontend-quality/frontend-ia-latest.json'

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

const requiredSections = [
  '## Visual direction',
  '## Page roles',
  '## Information hierarchy rules',
  '## Shared component rule',
  '## Screenshot review expectations',
  '## Historical burn-down order',
]
const requiredSurfaces = ['Product Center', 'Product Detail', 'Production Prep', 'Production Sandbox', 'Production Workshop', 'Listing / Delivery', 'Account / Downloads', 'Product Workbench']
const requiredComponents = ['ProductionSectionCard', 'DecisionOptionCard', 'DecisionStepCard', 'EditablePromptCard', 'VersionLineageItem', 'ResultAssetCard', 'ProductionEmptyState']
const forbiddenUiTerms = ['backend', 'runtime', 'provider', 'contract-needed', 'prompt_plan']
const failures = []
const warnings = []
let doc = ''
if (!existsSync(join(root, docRel))) failures.push(`Frontend IA governance doc missing: ${docRel}`)
else {
  doc = readFileSync(join(root, docRel), 'utf8')
  for (const section of requiredSections) if (!doc.includes(section)) failures.push(`IA governance doc missing section: ${section}`)
  for (const surface of requiredSurfaces) if (!doc.includes(surface)) failures.push(`IA governance doc missing surface role: ${surface}`)
  for (const component of requiredComponents) if (!doc.includes(component)) failures.push(`IA governance doc missing shared component rule: ${component}`)
  for (const term of forbiddenUiTerms) if (!doc.includes(term)) warnings.push(`IA governance doc should explicitly ban user-facing internal term: ${term}`)
}
const result = {
  status: failures.length ? 'FAIL' : (warnings.length ? 'PASS_WITH_NOTES' : 'PASS'),
  policy: 'Core ecommerce frontend pages require explicit product IA, visual direction, action hierarchy, screenshot review expectations, and shared business component rules.',
  doc: docRel,
  required_sections: requiredSections,
  required_surfaces: requiredSurfaces,
  required_components: requiredComponents,
  failures,
  warnings,
}
writeJson(reportRel, result)
console.log(JSON.stringify(result, null, 2))
process.exit(failures.length ? 1 : 0)
