import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = resolve(import.meta.dirname, '../..')
const zh = readFileSync(resolve(repoRoot, 'src/i18n/zh.ts'), 'utf8')
const en = readFileSync(resolve(repoRoot, 'src/i18n/en.ts'), 'utf8')

test('legacy batch-listing navigation copy is synchronized to Template Center in Chinese', () => {
  assert.match(zh, /productCenter:\s*\{[\s\S]*?shell:\s*\{[\s\S]*?listing:\s*'模板中心'/)
  assert.match(zh, /commands:\s*\{[\s\S]*?listing:\s*'进入模板中心'/)
  assert.match(zh, /batchListing:\s*\{\s*title:\s*'模板中心'/)
  assert.match(zh, /aiChatBatchListing:\s*'模板中心'/)
  assert.doesNotMatch(zh, /批量\s*Listing|批量上架工作台|批量上架'/)
})

test('legacy batch-listing navigation copy is synchronized to Template Center in English', () => {
  assert.match(en, /productCenter:\s*\{[\s\S]*?shell:\s*\{[\s\S]*?listing:\s*'Template Center'/)
  assert.match(en, /commands:\s*\{[\s\S]*?listing:\s*'Open Template Center'/)
  assert.match(en, /batchListing:\s*\{\s*title:\s*'Template Center'/)
  assert.match(en, /aiChatBatchListing:\s*'Template Center'/)
  assert.doesNotMatch(en, /Batch Listing|Bulk Listing|Batch Listing Workbench|Open Batch Listing/)
})
