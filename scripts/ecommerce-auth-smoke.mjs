#!/usr/bin/env node

const baseUrl = (process.env.ECOMMERCE_FRONTEND_BASE_URL || 'http://127.0.0.1:5180').replace(/\/$/, '')
const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`
const email = `auth-smoke+${suffix}@local.dev`
const password = `Review${suffix}!`

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }
  return { response, payload }
}

function assert(condition, message, details) {
  if (!condition) {
    console.error(`AUTH_SMOKE_FAIL ${message}`)
    if (details) console.error(JSON.stringify(details, null, 2))
    process.exit(1)
  }
}

const noAuth = await request('/api/v1/ecommerce/products')
assert(
  noAuth.response.status === 401 || noAuth.payload?.code === 401 || noAuth.payload?.error_code === 'TOKEN_INVALID',
  'products endpoint must reject missing Authorization',
  { status: noAuth.response.status, code: noAuth.payload?.code, error_code: noAuth.payload?.error_code },
)

const register = await request('/api/v1/ecommerce/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    full_name: 'Auth Smoke User',
    email,
    password,
    organization_name: 'Auth Smoke Org',
    language: 'zh',
  }),
})
const token = register.payload?.data?.access_token
assert(register.response.ok && register.payload?.code === 0 && token, 'register must return access_token', {
  status: register.response.status,
  code: register.payload?.code,
  error_code: register.payload?.error_code,
})

const authedProducts = await request('/api/v1/ecommerce/products', {
  headers: { Authorization: `Bearer ${token}` },
})
assert(authedProducts.response.ok && authedProducts.payload?.code === 0, 'products endpoint must accept Bearer token', {
  status: authedProducts.response.status,
  code: authedProducts.payload?.code,
  error_code: authedProducts.payload?.error_code,
})

const login = await request('/api/v1/ecommerce/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
})
assert(login.response.ok && login.payload?.code === 0 && login.payload?.data?.access_token, 'login must return access_token', {
  status: login.response.status,
  code: login.payload?.code,
  error_code: login.payload?.error_code,
})

console.log(JSON.stringify({
  status: 'PASS',
  baseUrl,
  checks: ['missing auth rejected', 'register returns token', 'Bearer accepted by products', 'login returns token'],
  email,
}, null, 2))
