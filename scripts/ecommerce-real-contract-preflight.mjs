#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = process.cwd()
const reportRel = 'reports/frontend-quality/real-contract-preflight-latest.json'
const baseUrl = (process.env.ECOMMERCE_REAL_CONTRACT_BASE_URL || process.env.VITE_ECOMMERCE_API_BASE_URL || process.env.V_ECOMMERCE_BASE_URL || 'https://tra.agent-ecommerce.com').replace(/\/$/, '')
let authToken = process.env.ECOMMERCE_REAL_CONTRACT_TOKEN || ''
let authenticatedVia = authToken ? 'token_env' : ''
const allowProd = process.env.ECOMMERCE_REAL_CONTRACT_ALLOW_PROD === '1'
const requireReal = process.env.ECOMMERCE_QA_REQUIRE_REAL === '1' || process.env.ECOMMERCE_REAL_CONTRACT_REQUIRED === '1'
const timeoutMs = Number(process.env.ECOMMERCE_REAL_CONTRACT_TIMEOUT_MS || 10_000)
const authEnvFile = process.env.ECOMMERCE_AUTH_ENV_FILE || join(process.env.HOME || '/root', '.hermes/secrets/ecommerce-login.env')

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

function loadEnv(file) {
  if (!existsSync(file)) return {}
  const out = {}
  for (const line of readFileSync(file, 'utf8').split(/\n/)) {
    const s = line.trim()
    if (!s || s.startsWith('#') || !s.includes('=')) continue
    const [key, ...rest] = s.split('=')
    out[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '')
  }
  return out
}

function dataOf(json) { return json?.data ?? json }

function allowsFixtureLogin(url) {
  const host = url.hostname.toLowerCase()
  if (host === 'tra.agent-ecommerce.com') return true
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true
  if (host.endsWith('.localhost')) return true
  return false
}

if (!baseUrl) {
  writeReport({
    status: 'BLOCKED',
    reason: 'real ecommerce backend is required but not configured; set ECOMMERCE_REAL_CONTRACT_BASE_URL or VITE_ECOMMERCE_API_BASE_URL',
    mode: 'real_first_preflight',
    require_real: true,
    required_env: ['ECOMMERCE_REAL_CONTRACT_BASE_URL or VITE_ECOMMERCE_API_BASE_URL'],
    optional_env: ['ECOMMERCE_REAL_CONTRACT_TOKEN', 'ECOMMERCE_REAL_CONTRACT_ALLOW_PROD=1', 'ECOMMERCE_AUTH_ENV_FILE'],
    report: reportRel,
  })
  process.exit(2)
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

async function resolveAuthToken() {
  if (authToken) return { ok: true, via: authenticatedVia }
  if (!allowsFixtureLogin(parsed)) return { ok: false, via: '', reason: `fixture login refused for non-dev host: ${redactUrl(baseUrl)}` }
  const env = loadEnv(authEnvFile)
  const email = env.ECOMMERCE_AUTH_EMAIL || env.PLATFORM_DEV_ADMIN_EMAIL
  const password = env.ECOMMERCE_AUTH_PASSWORD || env.PLATFORM_DEV_ADMIN_PASSWORD
  if (!email || !password) return { ok: false, via: '', reason: `auth fixture missing email/password: ${authEnvFile}` }

  try {
    const response = await fetchWithTimeout(`${baseUrl}/api/v1/ecommerce/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const body = await response.json().catch(() => null)
    const token = dataOf(body)?.access_token || ''
    if (response.status !== 200 || body?.code !== 0 || !token) return { ok: false, via: '', reason: `fixture login failed status=${response.status}` }
    authToken = token
    authenticatedVia = 'fixture_login'
    return { ok: true, via: authenticatedVia }
  } catch (error) {
    return { ok: false, via: '', reason: error instanceof Error ? error.message : String(error) }
  }
}

const authResolution = await resolveAuthToken()
if (requireReal && !authResolution.ok) {
  writeReport({
    status: 'BLOCKED',
    reason: `real ecommerce backend is required but authenticated fixture is not available: ${authResolution.reason}`,
    mode: 'real_first_preflight',
    require_real: requireReal,
    base_url: redactUrl(baseUrl),
    authenticated: false,
    auth_env_file: authEnvFile,
    report: reportRel,
  })
  process.exit(2)
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
if (!authToken) warnings.push('protected endpoints were validated only for reachable envelope/400|401|403 behavior; provide ECOMMERCE_REAL_CONTRACT_TOKEN or ECOMMERCE_AUTH_ENV_FILE for authenticated read smoke')
writeReport({
  status: failures.length ? 'FAIL' : 'PASS',
  mode: 'non_mutating_real_contract_smoke',
  require_real: requireReal,
  base_url: redactUrl(baseUrl),
  authenticated: Boolean(authToken),
  authenticated_via: authenticatedVia || null,
  endpoints: endpoints.map(item => item.path),
  results,
  failures,
  warnings,
  report: reportRel,
})
process.exit(failures.length ? 1 : 0)
