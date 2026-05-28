#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'

const args = process.argv.slice(2)
const cwd = process.cwd()
const root = absolute(valueAfter('--root') ?? cwd, cwd)
const reportPath = absolute(valueAfter('--report') ?? 'reports/frontend-quality/design-governance-latest.json', root)

const requiredDocuments = [
  {
    rel: 'docs/ecommerce-site-ia-map.md',
    label: 'P0',
    sections: ['# Ecommerce Site IA Map', '## P0 总原则', '## 主业务链路', '## 页面层级', '宣传/获客层', '工作台/业务入口层', '对象详情层', '功能生产层', '管理/配置层'],
  },
  {
    rel: 'docs/ecommerce-page-contracts.md',
    label: 'P1',
    sections: ['# Ecommerce Page Contracts', 'Route:', '页面层级:', '主业务对象:', '上游页面:', '下游页面:', '第一主行动:', '结果输出到哪里:', '允许的设计范式:', '禁止的设计方式:'],
  },
  {
    rel: 'docs/ecommerce-page-type-patterns.md',
    label: 'P2',
    sections: ['Marketing Page', 'Workspace Home', 'Object Detail', 'Production Station', 'Library / Management', 'Settings / Admin'],
  },
  {
    rel: 'docs/ecommerce-design-system-rules.md',
    label: 'P3',
    sections: ['# Ecommerce Design System Rules', '## 1. 按钮', '## 2. 暗色主题', '## 3. 页面骨架', '## 4. 业务语义组件', '禁止页面自写 `bg-black` / `hover:bg-*` / raw hex button。'],
  },
]

const requiredComponents = [
  'src/styles/tokens.css',
  'src/components/product-composition/index.tsx',
  'src/components/layout/index.tsx',
]

const requiredTokens = [
  '--ecom-bg',
  '--ecom-surface',
  '--ecom-surface-hover',
  '--ecom-border',
  '--ecom-text-primary',
  '--ecom-text-muted',
  '--ecom-action-primary',
]

const requiredShells = [
  'MarketingShell',
  'WorkspaceShell',
  'ObjectDetailShell',
  'ProductionStationShell',
  'LibraryManagementShell',
  'SettingsShell',
]

const requiredProductComponents = [
  'ProductHeroStage',
  'VisualOutcomePreview',
  'ProductAssetStrip',
  'RecommendedToolRail',
  'GenerationActionDock',
  'WorkflowProgressRail',
  'ResultDestinationCard',
]

const corePageRequirements = [
  {
    rel: 'src/pages/product/ProductListPage.tsx',
    shell: 'workspace-home',
    primitives: ['ProductHeroStage', 'WorkflowProgressRail', 'ProductAssetStrip'],
  },
  {
    rel: 'src/pages/ProductVisualToolsPage.tsx',
    shell: 'production-station',
    primitives: ['ProductHeroStage', 'VisualOutcomePreview', 'RecommendedToolRail', 'ResultDestinationCard'],
  },
]

function valueAfter(name) {
  const idx = args.indexOf(name)
  if (idx >= 0 && args[idx + 1]) return args[idx + 1]
  const prefixed = args.find(arg => arg.startsWith(`${name}=`))
  return prefixed ? prefixed.slice(name.length + 1) : null
}

function absolute(path, base) {
  if (isAbsolute(path)) return path
  return join(base, path)
}

function read(rel) {
  const path = join(root, rel)
  if (!existsSync(path)) return null
  return readFileSync(path, 'utf8')
}

function presentText(text) {
  return String(text || '').trim().length > 0
}

const failures = []
const warnings = []

for (const doc of requiredDocuments) {
  const content = read(doc.rel)
  if (!presentText(content)) {
    failures.push(`${doc.rel}: missing required section ${doc.label}`)
    continue
  }
  for (const section of doc.sections) {
    if (!content.includes(section)) failures.push(`${doc.rel}: missing required section ${section}`)
  }
}

const contracts = read('docs/ecommerce-page-contracts.md') || ''
if (!/Route: \/products\/workbench\/visual-tools[\s\S]*页面层级: .*功能生产层[\s\S]*主业务对象: SKU \/ Product Asset[\s\S]*结果输出到哪里: SKU\.assets[\s\S]*禁止的设计方式: .*工具矩阵/.test(contracts)) {
  failures.push('Visual Tools contract missing result destination or production-station anti-patterns')
}

const designRules = read('docs/ecommerce-design-system-rules.md') || ''
if (!designRules.includes('禁止页面自写 `bg-black` / `hover:bg-*` / raw hex button。')) failures.push('design system rules missing ad-hoc button ban')
if (!designRules.includes('页面不能直接拼 UI primitives')) failures.push('design system rules missing semantic component priority')

for (const rel of requiredComponents) {
  if (!presentText(read(rel))) failures.push(`${rel}: missing required implementation artifact`)
}

const tokens = read('src/styles/tokens.css') || ''
for (const token of requiredTokens) {
  if (!tokens.includes(token)) failures.push(`src/styles/tokens.css: missing token ${token}`)
}

const layout = read('src/components/layout/index.tsx') || ''
for (const shell of requiredShells) {
  if (!layout.includes(shell)) failures.push(`src/components/layout/index.tsx: missing shell ${shell}`)
}

const productComposition = read('src/components/product-composition/index.tsx') || ''
for (const component of requiredProductComponents) {
  if (!productComposition.includes(`function ${component}`) && !productComposition.includes(`const ${component}`) && !productComposition.includes(`export function ${component}`)) {
    failures.push(`src/components/product-composition/index.tsx: missing semantic component ${component}`)
  }
}

for (const page of corePageRequirements) {
  const source = read(page.rel) || ''
  if (!presentText(source)) {
    failures.push(`${page.rel}: missing core page source`)
    continue
  }
  if (!source.includes(`data-page-shell="${page.shell}"`)) {
    failures.push(`${page.rel}: must declare page shell ${page.shell}`)
  }
  for (const primitive of page.primitives) {
    if (!source.includes(primitive)) {
      failures.push(`${page.rel}: must consume product-composition primitive ${primitive}`)
    }
  }
}

const result = {
  status: failures.length ? 'FAIL' : (warnings.length ? 'PASS_WITH_NOTES' : 'PASS'),
  policy: 'Ecommerce design governance requires P0 IA map, P1 page contracts, P2 page type patterns, P3 design-system rules, semantic tokens, product composition components, and shared page shells.',
  required_documents: requiredDocuments.map(item => item.rel),
  required_components: requiredComponents,
  required_tokens: requiredTokens,
  required_shells: requiredShells,
  required_product_components: requiredProductComponents,
  core_page_requirements: corePageRequirements,
  failures,
  warnings,
}

mkdirSync(dirname(reportPath), { recursive: true })
writeFileSync(reportPath, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
process.exit(failures.length ? 1 : 0)
