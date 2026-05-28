import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const toolTypes = readFileSync(new URL('../../src/types/tool.ts', import.meta.url), 'utf8')
const toolData = readFileSync(new URL('../../src/mock/data.ts', import.meta.url), 'utf8')

const toolLines = toolData
  .split('\n')
  .filter(line => line.includes('withCapability('))

function parseToolLine(line) {
  const slug = line.match(/slug: '([^']+)'/)?.[1]
  const mode = line.match(/}, '([^']+)', \[/)?.[1] ?? line.match(/}, '([^']+)', noAssets\)/)?.[1]
  const assetsExpression = line.match(/}, '[^']+', (.*)\),?$/)?.[1] ?? ''
  return { slug, mode, assetsExpression, line }
}

function countRequiredImageAssets(assetsExpression) {
  if (assetsExpression === 'noAssets') return 0
  const requiredFalseCount = (assetsExpression.match(/, false\)/g) ?? []).length
  const imageAssetCount = (assetsExpression.match(/imageAsset\(/g) ?? []).length
  return imageAssetCount - requiredFalseCount
}

test('tool input modes expose only supported generation capabilities', () => {
  assert(!toolTypes.includes('image_edit'), 'ToolInputMode must not expose image_edit because the runtime has no single-image edit capability')
  assert(!toolData.includes("'image_edit'"), 'Tool catalog must not route any business tool to image_edit')
})

test('multi_image tools require at least two source-image slots', () => {
  const invalid = toolLines
    .map(parseToolLine)
    .filter(tool => tool.mode === 'multi_image')
    .filter(tool => countRequiredImageAssets(tool.assetsExpression) < 2)
    .map(tool => `${tool.slug}: ${countRequiredImageAssets(tool.assetsExpression)} required image slot(s)`)

  assert.deepEqual(invalid, [], `multi_image tools must declare at least two required source-image slots: ${invalid.join('; ')}`)
})
