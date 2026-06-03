import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const toolPagePath = new URL('../../src/pages/ToolPage.tsx', import.meta.url)
const servicePath = new URL('../../src/services/templateCenter.ts', import.meta.url)

function toolPageSource() { return readFileSync(toolPagePath, 'utf8') }
function serviceSource() { return readFileSync(servicePath, 'utf8') }

test('visual tool template fetch passes full business context for scoped templates', () => {
  const service = serviceSource()
  const page = toolPageSource()

  assert.match(service, /providerCapability\?: string/)
  assert.match(service, /provider_capability: params\.providerCapability/)
  assert.match(page, /providerCapability: providerCapabilityForInputMode\(tool\.inputMode\)/)
  assert.match(page, /productCategory: selectedProduct\?\.categoryId/)
  assert.match(page, /platform: selectedProduct\?\.listingVersions\?\.\[0\]\?\.platform/)
})

test('visual tool template cache key changes when product category or platform changes', () => {
  const page = toolPageSource()

  assert.match(page, /const providerCapability = providerCapabilityForInputMode\(tool\.inputMode\)/)
  assert.match(page, /const requestKey = JSON\.stringify\(\{/)
  assert.match(page, /productCategory: selectedProduct\?\.categoryId \?\? ''/)
  assert.match(page, /platform: selectedProduct\?\.listingVersions\?\.\[0\]\?\.platform \?\? ''/)
  assert.match(page, /providerCapability \}/)
})
