#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = process.cwd()
const args = process.argv.slice(2)
const registryRel = valueAfter('--registry') ?? 'docs/design-system-registry.json'
const reportRel = valueAfter('--report') ?? 'reports/frontend-quality/design-system-registry-latest.json'
const requireStories = args.includes('--require-stories')

function valueAfter(name) { const idx = args.indexOf(name); if (idx >= 0 && args[idx + 1]) return args[idx + 1]; const p = args.find(a => a.startsWith(`${name}=`)); return p ? p.slice(name.length + 1) : null }
function writeJson(rel, payload) { const path = join(root, rel); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, JSON.stringify(payload, null, 2) + '\n') }
function stem(path) { return path.replace(/\.(tsx|ts|jsx|js)$/, '') }

const failures = []
const warnings = []
let registry = null
if (!existsSync(join(root, registryRel))) failures.push(`Design system registry missing: ${registryRel}`)
else {
  registry = JSON.parse(readFileSync(join(root, registryRel), 'utf8'))
  const components = registry.required_core_components || []
  const names = new Set()
  for (const component of components) {
    if (!component.name || !component.path || !component.status) failures.push(`Registry component is missing name/path/status: ${JSON.stringify(component)}`)
    if (names.has(component.name)) failures.push(`Duplicate component in registry: ${component.name}`)
    names.add(component.name)
    if (component.status === 'active' && !existsSync(join(root, component.path))) failures.push(`Active design-system component missing: ${component.path}`)
    if (component.status === 'active' && component.story_required) {
      const storyCandidates = [`${stem(component.path)}.stories.tsx`, `${stem(component.path)}.stories.ts`]
      if (!storyCandidates.some(rel => existsSync(join(root, rel)))) {
        const msg = `Active component lacks story coverage: ${component.name} (${storyCandidates.join(' or ')})`
        if (requireStories) failures.push(msg)
        else warnings.push(msg)
      }
    }
  }
  for (const required of ['Button', 'Input', 'Card', 'Badge', 'Dialog', 'Toast']) {
    if (!components.some(c => c.name === required)) failures.push(`Registry missing required core component slot: ${required}`)
  }
  for (const gate of ['style:consistency', 'lint:baseline', 'quality:static', 'frontend:evidence']) {
    if (!(registry.gates || []).includes(gate)) failures.push(`Registry missing required governance gate: ${gate}`)
  }
}
const result = {
  status: failures.length ? 'FAIL' : (warnings.length ? 'PASS_WITH_NOTES' : 'PASS'),
  policy: 'The shared design system registry is the contract for product UI primitives, story/readiness coverage, and future component standardization.',
  registry: registryRel,
  active_components: (registry?.required_core_components || []).filter(c => c.status === 'active').map(c => c.name),
  planned_components: (registry?.required_core_components || []).filter(c => c.status === 'planned').map(c => c.name),
  failures,
  warnings,
}
writeJson(reportRel, result)
console.log(JSON.stringify(result, null, 2))
process.exit(failures.length ? 1 : 0)
