#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const workspaceRoot = path.dirname(repoRoot)
const ts = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
const evidenceDir = process.env.ECOMMERCE_LIVE_QA_EVIDENCE_DIR || path.join(workspaceRoot, 'artifacts/cloud-dev/evidence', `ecommerce-live-mutating-${ts}`)
const evidencePath = path.join(evidenceDir, 'evidence.json')
const envFile = process.env.ECOMMERCE_AUTH_ENV_FILE || path.join(process.env.HOME || '/root', '.hermes/secrets/ecommerce-login.env')
const base = (process.env.V_ECOMMERCE_BASE_URL || 'https://tra.agent-ecommerce.com').replace(/\/$/, '')
const startedAt = new Date().toISOString()

function refuseUnsafeBaseURL(value) {
  if (/^https?:\/\/agent-ecommerce\.com\b/.test(value) && !/^https?:\/\/tra\.agent-ecommerce\.com\b/.test(value)) {
    throw new Error(`Refuse prod base URL: ${value}`)
  }
  const allowed = [
    /^https:\/\/tra\.agent-ecommerce\.com$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
    /^http:\/\/localhost:\d+$/,
  ]
  if (!allowed.some((pattern) => pattern.test(value))) {
    throw new Error(`Refuse unknown live QA base URL: ${value}`)
  }
}

function loadEnv(file) {
  if (!fs.existsSync(file)) throw new Error(`Auth fixture missing: ${file}`)
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\n/)) {
    const s = line.trim()
    if (!s || s.startsWith('#') || !s.includes('=')) continue
    const [key, ...rest] = s.split('=')
    out[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '')
  }
  return out
}

function redact(value) {
  return String(value ?? '')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[JWT_REDACTED]')
    .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]')
    .replace(/(password|token|secret|authorization)(["'\s:=]+)([^"'\s,}]+)/gi, '$1$2[REDACTED]')
}

const checks = []
const resources = {
  productId: '',
  sku: '',
  assetRelationId: '',
  listingVersionId: '',
  exportTaskId: '',
  downloadId: '',
  imageJobId: '',
  imageRuntimeJobId: '',
}
let token = ''
let finalStatus = 'FAIL'

function record(name, status, data = {}) {
  const entry = { name, status, ...data }
  checks.push(entry)
  const suffix = Object.entries(data)
    .map(([key, value]) => `${key}=${redact(value)}`)
    .join(' ')
  console.log(`${name} -> ${status}${suffix ? ` ${suffix}` : ''}`)
  return entry
}

function dataOf(json) { return json?.data ?? json }
function itemsOf(json) {
  const d = json?.data ?? json
  return Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : []
}
function idOf(obj) { return obj?.id || obj?.product?.id || obj?.task_id || obj?.version_id || obj?.listing?.id || '' }
function statusOf(obj) { return obj?.status || obj?.state || '' }
function isTerminalImageStatus(status) { return ['completed', 'succeeded', 'failed', 'canceled', 'cancelled'].includes(String(status || '').toLowerCase()) }

async function raw(pathname, opts = {}) {
  const response = await fetch(base + pathname, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    signal: AbortSignal.timeout(opts.timeout || 30000),
  })
  const text = await response.text()
  let json = {}
  try { json = text ? JSON.parse(text) : {} } catch {}
  return { status: response.status, ok: response.ok, json, text }
}

async function api(pathname, opts = {}) {
  return raw(pathname, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` },
  })
}

async function cleanup() {
  if (resources.imageJobId && token) {
    const current = await api(`/api/v1/ecommerce/image-jobs/${encodeURIComponent(resources.imageJobId)}`).catch((error) => ({ status: 0, json: { message: error.message } }))
    const currentStatus = statusOf(dataOf(current.json))
    if (isTerminalImageStatus(currentStatus)) {
      record('cleanup.image_job_terminal', 'PASS', { job_id: resources.imageJobId, job_status: currentStatus || 'terminal' })
    } else {
      const cancel = await api(`/api/v1/ecommerce/image-jobs/${encodeURIComponent(resources.imageJobId)}/cancel`, { method: 'POST', body: JSON.stringify({}) }).catch((error) => ({ status: 0, json: { message: error.message } }))
      if (cancel.status >= 200 && cancel.status < 300 && cancel.json?.code === 0) {
        const verify = await api(`/api/v1/ecommerce/image-jobs/${encodeURIComponent(resources.imageJobId)}`).catch((error) => ({ status: 0, json: { message: error.message } }))
        const verifiedStatus = statusOf(dataOf(verify.json)) || statusOf(dataOf(cancel.json)) || 'unknown'
        if (isTerminalImageStatus(verifiedStatus)) {
          record('cleanup.image_job_cancel', 'PASS', { job_id: resources.imageJobId, job_status: verifiedStatus, readback_status: verify.status })
        } else {
          record('cleanup.image_job_cancel', 'FAIL', { job_id: resources.imageJobId, job_status: verifiedStatus, readback_status: verify.status, message: 'cancel response accepted but image job did not reach a terminal state on readback' })
        }
      } else {
        record('cleanup.image_job_cancel', 'FAIL', { job_id: resources.imageJobId, http_status: cancel.status, message: redact(cancel.json?.message || cancel.json?.error || cancel.text) })
      }
    }
  }

  if (!resources.productId || !token) return
  const del = await api(`/api/v1/ecommerce/products/${encodeURIComponent(resources.productId)}`, { method: 'DELETE' }).catch((error) => ({ status: 0, json: { message: error.message } }))
  if (del.status >= 200 && del.status < 300 && del.json?.code === 0) {
    record('cleanup.product_delete', 'PASS', { product_id: resources.productId })
  } else {
    record('cleanup.product_delete', 'FAIL', { product_id: resources.productId, http_status: del.status, message: redact(del.json?.message || del.json?.error || del.text) })
  }
  const verify = await api(`/api/v1/ecommerce/products/${encodeURIComponent(resources.productId)}`, { method: 'GET' }).catch((error) => ({ status: 0, json: { message: error.message } }))
  if (verify.status === 404 || verify.json?.code !== 0) {
    record('cleanup.product_absent_readback', 'PASS', { product_id: resources.productId, http_status: verify.status, code: verify.json?.code ?? 'n/a' })
  } else {
    record('cleanup.product_absent_readback', 'FAIL', { product_id: resources.productId, http_status: verify.status, code: verify.json?.code ?? 'n/a' })
  }
}

async function main() {
  refuseUnsafeBaseURL(base)
  const env = loadEnv(envFile)
  const email = env.ECOMMERCE_AUTH_EMAIL || env.PLATFORM_DEV_ADMIN_EMAIL
  const password = env.ECOMMERCE_AUTH_PASSWORD || env.PLATFORM_DEV_ADMIN_PASSWORD
  if (!email || !password) throw new Error('Auth fixture missing email/password keys')

  console.log(`ecommerce_dev_live_mutating_qa -> START base=${base} evidence=${evidencePath}`)
  const version = await raw('/version.json', { headers: {}, timeout: 15000 })
  if (version.status !== 200 || dataOf(version.json)?.lane !== 'dev') throw new Error(`dev version check failed status=${version.status}`)
  record('dev.version', 'PASS', { lane: dataOf(version.json).lane, short_sha: dataOf(version.json).short_sha || 'unknown' })

  const login = await raw('/api/v1/ecommerce/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  if (login.status !== 200 || login.json?.code !== 0 || !dataOf(login.json)?.access_token) throw new Error(`login failed status=${login.status} message=${redact(login.json?.message || login.text)}`)
  token = dataOf(login.json).access_token
  record('auth.login', 'PASS', { token: '[REDACTED]', org_id: dataOf(login.json)?.user?.org_id || 'unknown' })

  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  resources.sku = `QA-LIVE-${suffix}`
  const title = `QA Live Business Chain ${suffix}`
  const create = await api('/api/v1/ecommerce/products', { method: 'POST', body: JSON.stringify({ sku_code: resources.sku, title, category_id: 'qa-category', brand_id: 'qa-brand', tags: ['qa-live', 'business-chain'], cost_currency: 'USD' }) })
  if (create.status >= 300 || create.json?.code !== 0) throw new Error(`product create failed status=${create.status} message=${redact(create.json?.message || create.text)}`)
  resources.productId = idOf(dataOf(create.json))
  if (!resources.productId) throw new Error('product create did not return id')
  record('product.create', 'PASS', { product_id: resources.productId, sku: resources.sku })

  const detail = await api(`/api/v1/ecommerce/products/${encodeURIComponent(resources.productId)}`)
  if (detail.status !== 200 || detail.json?.code !== 0 || dataOf(detail.json)?.product?.sku_code !== resources.sku) throw new Error(`product detail readback failed status=${detail.status}`)
  record('product.detail_readback', 'PASS', { product_id: resources.productId, sku: resources.sku })

  const list = await api('/api/v1/ecommerce/products')
  if (!itemsOf(list.json).some((item) => item.id === resources.productId || item.product_id === resources.productId)) throw new Error('product list readback did not include created product')
  record('product.list_readback', 'PASS', { product_id: resources.productId })

  const library = await api('/api/v1/ecommerce/assets/library')
  const libraryItems = itemsOf(library.json)
  if (!library.ok || !libraryItems.length) throw new Error(`asset library has no reusable assets status=${library.status}`)
  const asset = libraryItems.find((item) => item.product_id && item.sku_code && (item.asset?.id || item.asset_id || item.id))
  const assetId = asset?.asset?.id || asset?.asset_id || asset?.id
  const fixtureProductId = asset?.product_id
  const fixtureSku = asset?.sku_code
  if (!assetId || !fixtureProductId || !fixtureSku) throw new Error('asset library reusable fixture asset/product missing')
  record('asset.reusable_found', 'PASS', { asset_id: assetId, fixture_product_id: fixtureProductId, fixture_sku: fixtureSku })

  const imageJob = await api('/api/v1/ecommerce/image-jobs', {
    method: 'POST',
    body: JSON.stringify({
      product_id: fixtureProductId,
      sku_code: fixtureSku,
      scene_type: 'qa_live_image_to_image',
      input_mode: 'image_to_image',
      source_asset_id: assetId,
      source_assets: [{ slot: 'primary', role: 'source', asset_id: assetId, required: true, label: 'QA fixture source' }],
      prompt: 'QA live provider routing smoke: create a clean marketplace product image variation.',
      negative_prompt: 'low quality, watermark',
      objective: 'quality',
      preferred_providers: ['volcengine'],
      requested_variants: 1,
      width: 512,
      height: 512,
    }),
  })
  if (imageJob.status >= 300 || imageJob.json?.code !== 0) throw new Error(`image job create failed status=${imageJob.status} message=${redact(imageJob.json?.message || imageJob.json?.error || imageJob.text)}`)
  resources.imageJobId = dataOf(imageJob.json)?.job_id || dataOf(imageJob.json)?.id || ''
  resources.imageRuntimeJobId = dataOf(imageJob.json)?.runtime_job_id || ''
  if (!resources.imageJobId || !resources.imageRuntimeJobId) throw new Error('image job create did not return job/runtime ids')
  record('image_job.create', 'PASS', { job_id: resources.imageJobId, runtime_job_id: resources.imageRuntimeJobId, job_status: dataOf(imageJob.json)?.status || 'unknown' })

  const imageJobReadback = await api(`/api/v1/ecommerce/image-jobs/${encodeURIComponent(resources.imageJobId)}`)
  if (imageJobReadback.status !== 200 || imageJobReadback.json?.code !== 0 || (dataOf(imageJobReadback.json)?.job_id || dataOf(imageJobReadback.json)?.id) !== resources.imageJobId) throw new Error(`image job readback failed status=${imageJobReadback.status}`)
  record('image_job.readback', 'PASS', { job_id: resources.imageJobId, job_status: dataOf(imageJobReadback.json)?.status || 'unknown' })

  const assetRel = await api(`/api/v1/ecommerce/products/${encodeURIComponent(resources.productId)}/assets`, { method: 'POST', body: JSON.stringify({ asset_id: assetId, relation_type: 'source', asset_role: 'hero', is_primary: true, platform_code: 'amazon', site_code: 'US', locale_code: 'en_US' }) })
  if (assetRel.status >= 300 || assetRel.json?.code !== 0) throw new Error(`asset relation failed status=${assetRel.status} message=${redact(assetRel.json?.message || assetRel.text)}`)
  resources.assetRelationId = dataOf(assetRel.json)?.relation?.id || dataOf(assetRel.json)?.id || dataOf(assetRel.json)?.relation_id || ''
  if (!resources.assetRelationId) throw new Error('asset relation id missing')
  record('asset.bind_to_product', 'PASS', { product_id: resources.productId, relation_id: resources.assetRelationId })

  const listingPayload = { version_label: `qa-live-${suffix}`, title: `${title} Listing`, description: 'QA live listing readback generated by dev-only business acceptance smoke.', bullet_points: ['QA listing bullet one', 'QA listing bullet two'], keywords: ['qa-live', 'business'], platform: 'amazon', site: 'US', locale: 'en_US' }
  const listing = await api(`/api/v1/ecommerce/products/${encodeURIComponent(resources.productId)}/listing-versions`, { method: 'POST', body: JSON.stringify(listingPayload) })
  if (listing.status >= 300 || listing.json?.code !== 0) throw new Error(`listing create failed status=${listing.status} message=${redact(listing.json?.message || listing.json?.error || listing.text)}`)
  resources.listingVersionId = idOf(dataOf(listing.json))
  if (!resources.listingVersionId) throw new Error('listing version id missing')
  record('listing.create', 'PASS', { product_id: resources.productId, version_id: resources.listingVersionId })

  const listingList = await api(`/api/v1/ecommerce/products/${encodeURIComponent(resources.productId)}/listing-versions`)
  if (!itemsOf(listingList.json).some((item) => item.id === resources.listingVersionId)) throw new Error('listing readback did not include version')
  record('listing.list_readback', 'PASS', { version_id: resources.listingVersionId })

  const adopt = await api(`/api/v1/ecommerce/products/${encodeURIComponent(resources.productId)}/listing-versions/adopt`, { method: 'POST', body: JSON.stringify({ version_id: resources.listingVersionId }) })
  if (adopt.status >= 300 || adopt.json?.code !== 0) throw new Error(`listing adopt failed status=${adopt.status} message=${redact(adopt.json?.message || adopt.text)}`)
  record('listing.adopt', 'PASS', { version_id: resources.listingVersionId })

  const exported = await api(`/api/v1/ecommerce/products/${encodeURIComponent(resources.productId)}/export-tasks`, { method: 'POST', body: JSON.stringify({ platform: 'amazon', site: 'US', locale: 'en_US', format: 'csv', asset_relation_ids: [resources.assetRelationId] }) })
  if (exported.status >= 300 || exported.json?.code !== 0) throw new Error(`export create failed status=${exported.status} message=${redact(exported.json?.message || exported.json?.error || exported.text)}`)
  resources.exportTaskId = idOf(dataOf(exported.json))
  if (!resources.exportTaskId) throw new Error('export task id missing')
  record('export.create', 'PASS', { product_id: resources.productId, task_id: resources.exportTaskId })

  const exportList = await api(`/api/v1/ecommerce/products/${encodeURIComponent(resources.productId)}/export-tasks`)
  if (!itemsOf(exportList.json).some((item) => item.id === resources.exportTaskId || item.task_id === resources.exportTaskId)) throw new Error('export readback did not include task')
  record('export.list_readback', 'PASS', { task_id: resources.exportTaskId })

  const downloads = await api('/api/v1/ecommerce/downloads')
  const matched = itemsOf(downloads.json).find((item) => item.id === resources.exportTaskId || item.task_id === resources.exportTaskId || item.source_id === resources.exportTaskId || item.product_id === resources.productId)
  if (!matched) throw new Error('downloads list did not include export task/product')
  resources.downloadId = matched.id || matched.task_id || resources.exportTaskId
  record('download.list_readback', 'PASS', { download_id: resources.downloadId })

  const content = await api(`/api/v1/ecommerce/downloads/${encodeURIComponent(resources.downloadId)}/content`, { headers: { Accept: 'text/csv,application/octet-stream,*/*' } })
  if (content.status < 200 || content.status >= 400 || !content.text || content.text.length < 10) throw new Error(`download content failed status=${content.status} bytes=${content.text?.length || 0}`)
  record('download.content', 'PASS', { download_id: resources.downloadId, bytes: content.text.length })
}

try {
  await main()
} catch (error) {
  record('live_chain', 'FAIL', { message: redact(error?.message || error) })
  process.exitCode = 1
} finally {
  await cleanup()
  finalStatus = checks.some((entry) => entry.status === 'FAIL') ? 'FAIL' : 'PASS'
  const finishedAt = new Date().toISOString()
  fs.mkdirSync(evidenceDir, { recursive: true })
  const evidence = {
    schemaVersion: '1.0.0',
    status: finalStatus,
    startedAt,
    finishedAt,
    baseURL: base,
    lane: base.includes('tra.agent-ecommerce.com') ? 'cloud-dev' : 'local-dev',
    auth: { envFile, emailPresent: true, password: '[REDACTED]', token: '[REDACTED]' },
    resources,
    checks,
    cleanup: checks.filter((entry) => entry.name.startsWith('cleanup.')),
    secretPolicy: 'No password, bearer token, internal service secret, API key, or connection string is written to evidence.',
  }
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(`result=${finalStatus} ecommerce_dev_live_mutating_qa evidence=${evidencePath} token=[REDACTED] password=[REDACTED] checks=${checks.length}`)
}
