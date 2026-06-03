import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

const repoRoot = resolve(import.meta.dirname, '../..')
const gateScript = join(repoRoot, 'scripts/ecommerce-layout-density-gate.mjs')

function makeProject(files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'ecom-density-gate-'))
  mkdirSync(join(root, 'src/pages/production'), { recursive: true })
  mkdirSync(join(root, 'src/components/ui'), { recursive: true })
  mkdirSync(join(root, 'scripts'), { recursive: true })
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

test('fails product-flow content buttons that force no wrapping on long Chinese labels', () => {
  const root = makeProject({
    'src/pages/production/PrepHubPage.tsx': `
      import { Button } from '@/components/ui/Button'
      export function PrepHubPage() {
        return <Button className="h-9 whitespace-nowrap px-3">这是一个特别长的中文决策选项，需要完整展示给用户确认</Button>
      }
    `,
  })
  const result = runGate(root)
  assert.notEqual(result.status, 0)
  const payload = JSON.parse(result.stdout)
  assert.equal(payload.status, 'FAIL')
  assert.match(payload.failures.join('\n'), /content.*wrap|density\.content_button_nowrap/i)
})

test('fails dense two-column long-copy cards with tiny typography', () => {
  const root = makeProject({
    'src/pages/production/SandboxPage.tsx': `
      export function SandboxPage() {
        return <section className="grid grid-cols-2 gap-2 text-[9px] leading-tight">
          <div className="truncate">参考图中的背景、道具、光影、构图、模特姿态全部需要用户能读清楚</div>
        </section>
      }
    `,
  })
  const result = runGate(root)
  assert.notEqual(result.status, 0)
  const payload = JSON.parse(result.stdout)
  assert.match(payload.failures.join('\n'), /density\.tiny_two_column_longcopy|density\.longcopy_truncate/i)
})

test('passes responsive content cards that allow wrapping and readable line height', () => {
  const root = makeProject({
    'src/pages/production/PrepHubPage.tsx': `
      import { Button } from '@/components/ui/Button'
      export function PrepHubPage() {
        return <Button className="h-auto min-h-12 whitespace-normal break-words px-4 py-3 text-left leading-relaxed">这是一个特别长的中文决策选项，需要完整展示给用户确认</Button>
      }
    `,
  })
  const result = runGate(root)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const payload = JSON.parse(result.stdout)
  assert.equal(payload.status, 'PASS')
})
