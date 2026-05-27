#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = process.cwd()
const args = process.argv.slice(2)
const reportRel = valueAfter('--report') ?? 'reports/frontend-quality/visual-composition-latest.json'
const docRel = valueAfter('--doc') ?? 'docs/product-ux-visual-backbone.md'
const corePages = (valueAfter('--pages') ?? 'src/pages/ProductVisualToolsPage.tsx').split(',').map(s => s.trim()).filter(Boolean)

function valueAfter(name) { const idx = args.indexOf(name); if (idx >= 0 && args[idx + 1]) return args[idx + 1]; const p = args.find(a => a.startsWith(`${name}=`)); return p ? p.slice(name.length + 1) : null }
function writeJson(rel, payload) { const path = join(root, rel); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, JSON.stringify(payload, null, 2) + '\n') }
function count(re, s) { return (s.match(re) || []).length }

const requiredDocPhrases = [
  'Dark product workbench + commerce visual creation + task progression + result preview',
  'less control console; more creation studio',
  'less capability matrix; more task stage',
  'Core page IA questions',
  'ProductHeroStage',
  'VisualOutcomePreview',
  'RecommendedToolRail',
  'SoftInspectorPanel',
]
const requiredPrimitives = ['ProductHeroStage', 'VisualOutcomePreview']
const recommendedPrimitives = ['ProductAssetStrip', 'RecommendedToolRail', 'GenerationActionDock', 'WorkflowProgressRail', 'ResultDestinationCard', 'SoftInspectorPanel']
const technicalTerms = ['pipeline', 'backend', 'contract', 'runtime', 'attach-back', 'station']
const visibleCopySources = [
  ...corePages,
  'src/i18n/zh.ts',
  'src/i18n/en.ts',
]
const forbiddenAbstractCopy = [
  { code: 'abstract_capability_list', pattern: /完整能力清单|能力清单|full capability list/i },
  { code: 'abstract_first_screen', pattern: /首屏主角|页面重点是|一次性铺开|scanning the full capability/i },
  { code: 'abstract_high_value_goal', pattern: /高价值目标|focused goal instead of/i },
  { code: 'internal_page_type_copy', pattern: /Workspace Home\s*·\s*SKU Business Entry|business entry/i },
]
const failures = []
const warnings = []
const pageReports = []
const copyReports = []

for (const rel of [...new Set(visibleCopySources)]) {
  const path = join(root, rel)
  if (!existsSync(path)) continue
  const text = readFileSync(path, 'utf8')
  const hits = forbiddenAbstractCopy.filter(item => item.pattern.test(text)).map(item => item.code)
  if (hits.length) {
    copyReports.push({ file: rel, forbidden_abstract_copy: hits })
    failures.push(`copy.abstract_product_language: ${rel} contains abstract governance/capability-list copy (${hits.join(', ')})`)
  }
}

if (!existsSync(join(root, docRel))) failures.push(`composition.backbone_missing: ${docRel}`)
else {
  const doc = readFileSync(join(root, docRel), 'utf8')
  for (const phrase of requiredDocPhrases) if (!doc.includes(phrase)) failures.push(`composition.backbone_missing_phrase: ${phrase}`)
}

for (const page of corePages) {
  const path = join(root, page)
  if (!existsSync(path)) { warnings.push(`composition.page_missing: ${page}`); continue }
  const src = readFileSync(path, 'utf8')
  const copySurface = src
    .replace(/data-page-shell="[^"]+"/g, '')
    .replace(/className="[^"]*"/g, '')
    .replace(/`[^`]*`/g, '')
  const report = {
    page,
    primitives: [...requiredPrimitives, ...recommendedPrimitives].filter(name => src.includes(name)),
    rounded_count: count(/rounded-(?:\[|[a-z0-9])/g, src),
    border_count: count(/border(?:\s|\-|=|`|'|")/g, src),
    grid_count: count(/\bgrid\b|grid-cols/g, src),
    technical_terms: technicalTerms.filter(term => new RegExp(`\\b${term.replace('-', '[- ]')}\\b`, 'i').test(copySurface)),
  }
  for (const primitive of requiredPrimitives) {
    if (!src.includes(primitive)) failures.push(`composition.${primitive === 'ProductHeroStage' ? 'hero_absence' : 'visual_outcome_absence'}: ${page} must use ${primitive}`)
  }
  if (report.technical_terms.length) failures.push(`copy.technical_term: ${page} exposes technical terms (${report.technical_terms.join(', ')})`)
  if (/rounded[^\n]{0,160}border[\s\S]{0,260}rounded[^\n]{0,160}border[\s\S]{0,260}rounded[^\n]{0,160}border/.test(src)) failures.push(`composition.card_nesting_depth: ${page} appears to nest bordered rounded surfaces deeper than 2 levels`)
  const buttonCards = count(/<(?:button|Button)[\s\S]{0,360}rounded/g, src)
  const denseToolLabels = count(/tool\s+\$?\{?\w*\}?|tool\s+\d+/gi, src)
  const overloadedGrid = Math.max(buttonCards, denseToolLabels)
  if (overloadedGrid > 12 && !src.includes('RecommendedToolRail') && !src.includes('ToolCategoryCarousel')) failures.push(`composition.grid_overload: ${page} has ${overloadedGrid} rounded tool/action cards without recommendation/carousel primitives`)
  if (report.rounded_count > 60 || report.border_count > 80) warnings.push(`composition.surface_density: ${page} has high rounded/border density (${report.rounded_count}/${report.border_count}); review first-screen hierarchy`)
  const recommendedUsed = recommendedPrimitives.filter(name => src.includes(name))
  if (recommendedUsed.length < 4) warnings.push(`composition.semantic_primitives_low: ${page} uses ${recommendedUsed.length}/6 recommended composition primitives`)
  pageReports.push(report)
}

const result = {
  schema_version: '1.0',
  status: failures.length ? 'FAIL' : (warnings.length ? 'PASS_WITH_NOTES' : 'PASS'),
  policy: 'Core ecommerce visual pages must follow the product UX visual backbone: dark creation workbench, task stage, progressive IA, result preview, weak system status, and semantic composition primitives.',
  doc: docRel,
  core_pages: corePages,
  required_primitives: requiredPrimitives,
  recommended_primitives: recommendedPrimitives,
  pages: pageReports,
  copy_sources: copyReports,
  failures,
  warnings,
}
writeJson(reportRel, result)
console.log(JSON.stringify(result, null, 2))
process.exit(failures.length ? 1 : 0)
