import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const pagePath = new URL('../../src/pages/AgentTemplateMarketPage.tsx', import.meta.url)
const servicePath = new URL('../../src/services/templateCenter.ts', import.meta.url)

function pageSource() { return readFileSync(pagePath, 'utf8') }
function serviceSource() { return readFileSync(servicePath, 'utf8') }

test('Template Center catalog fetch is server-paged instead of downloading the full catalog for a 4-card page', () => {
  const page = pageSource()
  const service = serviceSource()
  assert.match(service, /limit\?: number/)
  assert.match(service, /offset\?: number/)
  assert.match(page, /limit: pageSize/)
  assert.match(page, /offset: \(currentPage - 1\) \* pageSize/)
  assert.match(page, /totalFilteredCount/)
})

test('Template Center avoids request storms while searching and cancels stale catalog requests', () => {
  const page = pageSource()
  assert.match(page, /setDebouncedSearchQuery/)
  assert.match(page, /setTimeout\(\(\) => setDebouncedSearchQuery\(searchQuery\.trim\(\)\), 260\)/)
  assert.match(page, /new AbortController\(\)/)
  assert.match(page, /controller\.abort\(\)/)
  assert.match(page, /signal: controller\.signal/)
})

test('Template Center keeps static recommendations and favorites out of the paged catalog fetch loop', () => {
  const page = pageSource()
  assert.match(page, /Promise\.all\(\[listRecommendations\(locale\), listFavoriteTemplates\(locale\)\]\)/)
  assert.match(page, /setGlobalFacets\(facetItems\)/)
  assert.doesNotMatch(page, /listRecommendations\(locale\), listFavoriteTemplates\(locale\),\s*\]\)/)
})

test('Template Center does not eager-load detail payload or first-page megabyte cover images', () => {
  const page = pageSource()
  assert.match(page, /if \(!detailOpen \|\| !selectedTemplateId\)/)
  assert.doesNotMatch(page, /className="h-48 w-full object-cover object-center"/)
  assert.match(page, /点击预览素材/)
})
