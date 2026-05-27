import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

const repoRoot = resolve(import.meta.dirname, '../..')
const gateScript = join(repoRoot, 'scripts/ecommerce-visual-composition-gate.mjs')

function makeProject(files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'ecom-composition-gate-'))
  mkdirSync(join(root, 'src/pages'), { recursive: true })
  mkdirSync(join(root, 'src/components/product-composition'), { recursive: true })
  mkdirSync(join(root, 'docs'), { recursive: true })
  for (const [rel, content] of Object.entries(files)) {
    const path = join(root, rel)
    mkdirSync(join(path, '..'), { recursive: true })
    writeFileSync(path, content)
  }
  return root
}

function runGate(root, extraArgs = []) {
  return spawnSync(process.execPath, [gateScript, ...extraArgs], { cwd: root, encoding: 'utf8' })
}

const visualBackbone = `# Product UX Visual Backbone\n\n## Visual posture\nDark product workbench + commerce visual creation + task progression + result preview.\n\n## Directional keywords\n- less control console; more creation studio\n- less capability matrix; more task stage\n\n## Core page IA questions\n1. current task\n2. primary object\n3. primary action\n4. secondary action\n5. result destination\n6. weakened system status\n\n## Core composition primitives\nProductHeroStage, VisualOutcomePreview, ProductAssetStrip, RecommendedToolRail, GenerationActionDock, WorkflowProgressRail, ResultDestinationCard, ToolCategoryCarousel, SoftInspectorPanel\n`

test('fails core visual pages that miss hero stage and result preview primitives', () => {
  const root = makeProject({
    'docs/product-ux-visual-backbone.md': visualBackbone,
    'src/pages/ProductVisualToolsPage.tsx': `
      export default function Page() {
        return <div className="grid grid-cols-3 gap-4 rounded-2xl border border-white/10">
          <div className="rounded-xl border border-white/10"><div className="rounded-xl border border-white/10">pipeline status</div></div>
          <div className="rounded-xl border border-white/10">backend contract</div>
          <div className="rounded-xl border border-white/10">station registry</div>
        </div>
      }
    `,
  })
  const result = runGate(root)
  assert.notEqual(result.status, 0)
  const payload = JSON.parse(result.stdout)
  assert.equal(payload.status, 'FAIL')
  assert.match(payload.failures.join('\n'), /composition\.hero_absence/)
  assert.match(payload.failures.join('\n'), /composition\.visual_outcome_absence/)
  assert.match(payload.failures.join('\n'), /copy\.technical_term/)
})

test('fails over-boxed first screen with deep nested cards and overloaded tool grid', () => {
  const cards = Array.from({ length: 16 }, (_, index) => `<button className="rounded-xl border border-white/10 bg-white/[0.03]">tool ${index}</button>`).join('\n')
  const root = makeProject({
    'docs/product-ux-visual-backbone.md': visualBackbone,
    'src/pages/ProductVisualToolsPage.tsx': `
      import { ProductHeroStage, VisualOutcomePreview } from '@/components/product-composition'
      export default function Page() {
        return <main>
          <ProductHeroStage title="Create visuals" primaryAction={{ label: 'Generate' }} />
          <VisualOutcomePreview title="Preview" />
          <section className="rounded-[28px] border border-white/10"><div className="rounded-2xl border border-white/10"><div className="rounded-xl border border-white/10">deep</div></div></section>
          <section className="grid grid-cols-4 gap-3">${cards}</section>
        </main>
      }
    `,
  })
  const result = runGate(root)
  assert.notEqual(result.status, 0)
  const payload = JSON.parse(result.stdout)
  assert.match(payload.failures.join('\n'), /composition\.card_nesting_depth/)
  assert.match(payload.failures.join('\n'), /composition\.grid_overload/)
})

test('fails abstract governance/capability-list copy in visible visual-tool i18n', () => {
  const root = makeProject({
    'docs/product-ux-visual-backbone.md': visualBackbone,
    'src/pages/ProductVisualToolsPage.tsx': `
      import { ProductHeroStage, VisualOutcomePreview, ProductAssetStrip, RecommendedToolRail, GenerationActionDock, WorkflowProgressRail, ResultDestinationCard, SoftInspectorPanel } from '@/components/product-composition'
      export default function Page() {
        return <main>
          <ProductHeroStage title="Create product visuals" primaryAction={{ label: 'Choose product' }} />
          <WorkflowProgressRail steps={[]} />
          <VisualOutcomePreview title="Result preview" />
          <ProductAssetStrip assets={[]} />
          <RecommendedToolRail tools={[]} />
          <GenerationActionDock primaryAction={{ label: 'Generate visuals' }} />
          <ResultDestinationCard title="Saved to product assets" />
          <SoftInspectorPanel title="Details" />
        </main>
      }
    `,
    'src/i18n/zh.ts': `export default { product: { visualToolsStudio: { recommendedDesc: '先聚焦一个高价值目标，不把完整能力清单当作首屏主角。' } } }`,
  })
  const result = runGate(root)
  assert.notEqual(result.status, 0)
  const payload = JSON.parse(result.stdout)
  assert.match(payload.failures.join('\n'), /copy\.abstract_product_language/)
  assert.match(JSON.stringify(payload.copy_sources), /abstract_capability_list/)
})

test('passes task-stage composition with semantic primitives and weakened system status', () => {
  const root = makeProject({
    'docs/product-ux-visual-backbone.md': visualBackbone,
    'src/pages/ProductVisualToolsPage.tsx': `
      import { ProductHeroStage, VisualOutcomePreview, ProductAssetStrip, RecommendedToolRail, GenerationActionDock, WorkflowProgressRail, ResultDestinationCard, SoftInspectorPanel } from '@/components/product-composition'
      export default function Page() {
        return <main>
          <ProductHeroStage title="Create product visuals" primaryAction={{ label: 'Choose product' }} />
          <WorkflowProgressRail steps={[]} />
          <VisualOutcomePreview title="Result preview" />
          <ProductAssetStrip assets={[]} />
          <RecommendedToolRail tools={[]} />
          <GenerationActionDock primaryAction={{ label: 'Generate visuals' }} />
          <ResultDestinationCard title="Saved to product assets" />
          <SoftInspectorPanel title="Details" />
        </main>
      }
    `,
  })
  const result = runGate(root)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const payload = JSON.parse(result.stdout)
  assert.equal(payload.status, 'PASS')
})
