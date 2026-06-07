#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = process.cwd()
const reportRel = 'reports/frontend-quality/real-contract-preflight-latest.json'
const baseUrl = (process.env.ECOMMERCE_REAL_CONTRACT_BASE_URL || process.env.VITE_ECOMMERCE_API_BASE_URL || '').replace(/\/$/, '')
const authToken = process.env.ECOMMERCE_REAL_CONTRACT_TOKEN || ''
const allowProd = process.env.ECOMMERCE_REAL_CONTRACT_ALLOW_PROD === '1'
const requireReal = process.env.ECOMMERCE_QA_REQUIRE_REAL === '1' || process.env.ECOMMERCE_REAL_CONTRACT_REQUIRED === '1'
const timeoutMs = Number(process.env.ECOMMERCE_REAL_CONTRACT_TIMEOUT_MS || 10_000)

function writeReport(payload) {
  const path = join(root, reportRel)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(payload, null, 2) + '\n')
  console.log(JSON.stringify(payload, null, 2))
}

function redactUrl(value) {
  try {
    const url = new URL(value)
    return `${url.protocol}//${url.host}`
  } catch {
    return '<invalid-url>'
  }
}

function looksLikeProd(url) {
  const host = url.hostname.toLowerCase()
  if (host === 'agent-ecommerce.com' || host.endsWith('.agent-ecommerce.com') && host !== 'tra.agent-ecommerce.com') return true
  return host.includes('prod') || host === 'ecommerce.v.dev' || host.endsWith('.v.dev') || host.endsWith('.nousresearch.com')
}

if (!baseUrl) {
  writeReport({
    status: requireReal ? 'BLOCKED' : 'SKIPPED',
    reason: requireReal
      ? 'real ecommerce backend is required but not configured; set ECOMMERCE_REAL_CONTRACT_BASE_URL or VITE_ECOMMERCE_API_BASE_URL'
      : 'real ecommerce backend is not configured; set ECOMMERCE_REAL_CONTRACT_BASE_URL or VITE_ECOMMERCE_API_BASE_URL to enable non-mutating real contract smoke',
    mode: 'real_first_preflight',
    require_real: requireReal,
    required_env: ['ECOMMERCE_REAL_CONTRACT_BASE_URL or VITE_ECOMMERCE_API_BASE_URL'],
    optional_env: ['ECOMMERCE_REAL_CONTRACT_TOKEN', 'ECOMMERCE_REAL_CONTRACT_ALLOW_PROD=1', 'ECOMMERCE_QA_REQUIRE_REAL=1'],
    report: reportRel,
  })
  process.exit(requireReal ? 2 : 0)
}

let parsed
try {
  parsed = new URL(baseUrl)
} catch {
  writeReport({ status: 'FAIL', reason: 'configured real contract base URL is invalid', base_url: '<invalid-url>', report: reportRel })
  process.exit(1)
}

if (looksLikeProd(parsed) && !allowProd) {
  writeReport({
    status: 'BLOCKED',
    reason: 'configured host looks like production; set ECOMMERCE_REAL_CONTRACT_ALLOW_PROD=1 only after explicit approval',
    base_url: redactUrl(baseUrl),
    report: reportRel,
  })
  process.exit(2)
}

const endpoints = [
  { path: '/api/v1/ecommerce/auth/session', protected: true },
  { path: '/api/v1/ecommerce/template-center/catalog?locale=zh', protected: false },
  { path: '/api/v1/ecommerce/products', protected: true },
]

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

const results = []
for (const endpoint of endpoints) {
  const url = `${baseUrl}${endpoint.path}`
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        accept: 'application/json',
        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      },
    })
    const contentType = response.headers.get('content-type') || ''
    const body = contentType.includes('application/json') ? await response.json().catch(() => null) : null
    const envelopeOk = body && typeof body === 'object' && ('data' in body || 'code' in body || 'message' in body)
    const acceptedStatus = authToken || !endpoint.protected
      ? response.status >= 200 && response.status < 300
      : (response.status >= 200 && response.status < 300) || [400, 401, 403].includes(response.status)
    results.push({
      endpoint: endpoint.path,
      protected: endpoint.protected,
      status_code: response.status,
      content_type: contentType,
      envelope_ok: Boolean(envelopeOk),
      accepted_status: Boolean(acceptedStatus),
    })
  } catch (error) {
    results.push({ endpoint: endpoint.path, protected: endpoint.protected, status_code: 0, content_type: '', envelope_ok: false, accepted_status: false, error: error instanceof Error ? error.message : String(error) })
  }
}

const failures = results.filter(item => !item.accepted_status || !item.envelope_ok)
const warnings = []
if (!authToken) warnings.push('protected endpoints were validated only for reachable envelope/400|401|403 behavior; provide ECOMMERCE_REAL_CONTRACT_TOKEN for authenticated read smoke')
writeReport({
  status: failures.length ? 'FAIL' : 'PASS',
  mode: 'non_mutating_real_contract_smoke',
  require_real: requireReal,
  base_url: redactUrl(baseUrl),
  authenticated: Boolean(authToken),
  endpoints: endpoints.map(item => item.path),
  results,
  failures,
  warnings,
  report: reportRel,
})
process.exit(failures.length ? 1 : 0)
