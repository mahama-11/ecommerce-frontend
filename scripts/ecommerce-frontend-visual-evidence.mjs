#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const root = process.cwd()
const args = process.argv.slice(2)
const reportRel = valueAfter('--manifest') ?? 'reports/frontend-style-consistency/evidence-manifest.json'
const screenshotDirRel = valueAfter('--screenshot-dir') ?? 'reports/frontend-style-consistency/screenshots'
const port = Number(valueAfter('--port') ?? process.env.FRONTEND_EVIDENCE_PORT ?? 5179)
const cdpPort = Number(valueAfter('--cdp-port') ?? process.env.FRONTEND_EVIDENCE_CDP_PORT ?? 9229)
const baseUrl = valueAfter('--base-url') ?? `http://127.0.0.1:${port}`
const keepServer = args.includes('--use-existing-server')
const devSession = JSON.stringify({
  access_token: 'dev',
  user: { full_name: 'Dev User', email: 'dev@agent-ecommerce.com', org_name: 'Local QA' },
  access: { product_roles: ['admin'] },
})
const authBootstrapSource = `localStorage.setItem('ecommerce_access_token', 'dev'); localStorage.setItem('ecommerce_session', ${JSON.stringify(devSession)});`
const changedFiles = readChangedFiles()

function valueAfter(name) {
  const idx = args.indexOf(name)
  if (idx >= 0 && args[idx + 1]) return args[idx + 1]
  const prefixed = args.find(arg => arg.startsWith(`${name}=`))
  return prefixed ? prefixed.slice(name.length + 1) : null
}

function readChangedFiles() {
  const explicit = valueAfter('--changed-files')
  if (!explicit) return []
  const path = join(root, explicit)
  if (!existsSync(path)) return []
  return readFileSync(path, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean)
}

function routePlan(files) {
  const routes = new Map()
  const add = (id, path, surface) => routes.set(id, { id, path, surface })

  if (files.length === 0) {
    add('product-center', '/products?dev=1', 'Product Center')
    add('visual-tools', '/products/workbench/visual-tools?dev=1', 'Product Workbench')
    add('production-prep', '/products/dev-product/production/prep?dev=1', 'Production Prep')
    return [...routes.values()]
  }

  for (const file of files) {
    if (/src\/pages\/product\/ProductListPage\.tsx$/.test(file) || /src\/layouts\/ProductWorkbenchLayout\.tsx$/.test(file)) {
      add('product-center', '/products?dev=1', 'Product Center')
    }
    if (/src\/pages\/product\/ProductDetailPage\.tsx$/.test(file) || /src\/pages\/product\/components\//.test(file)) {
      add('product-detail', '/products/dev-product?dev=1', 'Product Detail')
    }
    if (/src\/components\/product-workbench\//.test(file) || /src\/pages\/ProductVisualToolsPage\.tsx$/.test(file)) {
      add('visual-tools', '/products/workbench/visual-tools?dev=1', 'Product Workbench')
    }
    if (/src\/pages\/production\/PrepHubPage\.tsx$/.test(file) || /src\/layouts\/ProductionLayout\.tsx$/.test(file)) {
      add('production-prep', '/products/dev-product/production/prep?dev=1', 'Production Prep')
    }
    if (/src\/pages\/production\/SandboxPage\.tsx$/.test(file)) {
      add('production-sandbox', '/products/dev-product/production/sandbox?dev=1', 'Production Sandbox')
    }
    if (/src\/pages\/production\/WorkshopPage\.tsx$/.test(file)) {
      add('production-workshop', '/products/dev-product/production/workshop?dev=1', 'Production Workshop')
    }
  }

  if (routes.size === 0) {
    add('product-center', '/products?dev=1', 'Product Center')
    add('production-prep', '/products/dev-product/production/prep?dev=1', 'Production Prep')
  }
  return [...routes.values()]
}

function writeJson(rel, payload) {
  const path = join(root, rel)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(payload, null, 2) + '\n')
}

async function waitForHttp(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs
  let lastError = null
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.status < 500) return { ok: true, status: res.status }
      lastError = new Error(`HTTP ${res.status}`)
    } catch (error) {
      lastError = error
    }
    await delay(500)
  }
  return { ok: false, error: lastError?.message || 'timeout' }
}

async function startServer() {
  if (keepServer) return null
  const child = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, BROWSER: 'none' },
  })
  child.stdout.on('data', chunk => process.stderr.write(`[vite] ${chunk}`))
  child.stderr.on('data', chunk => process.stderr.write(`[vite] ${chunk}`))
  const ready = await waitForHttp(baseUrl, 45000)
  if (!ready.ok) {
    child.kill('SIGTERM')
    throw new Error(`frontend dev server not ready: ${ready.error}`)
  }
  return child
}

async function launchChrome() {
  const userDataDir = `/tmp/ecommerce-frontend-evidence-${process.pid}`
  rmSync(userDataDir, { recursive: true, force: true })
  mkdirSync(userDataDir, { recursive: true })
  const chrome = spawn('/usr/bin/chromium', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] })
  chrome.stderr.on('data', chunk => process.stderr.write(`[chromium] ${chunk}`))
  const ready = await waitForHttp(`http://127.0.0.1:${cdpPort}/json/version`, 30000)
  if (!ready.ok) {
    chrome.kill('SIGTERM')
    throw new Error(`chromium CDP not ready: ${ready.error}`)
  }
  return { chrome, userDataDir }
}

class CdpClient {
  constructor(ws) {
    this.ws = ws
    this.nextId = 1
    this.pending = new Map()
    this.events = []
    ws.onmessage = event => {
      const msg = JSON.parse(event.data)
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)))
        else resolve(msg.result || {})
      } else if (msg.method) {
        this.events.push(msg)
        if (this.onEvent) this.onEvent(msg)
      }
    }
  }
  send(method, params = {}) {
    const id = this.nextId++
    this.ws.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }))
  }
  close() { this.ws.close() }
}

function mockApiPayload(url) {
  if (url.includes('/api/v1/ecommerce/auth/session')) {
    return { code: 0, message: 'ok', data: { user: { full_name: 'Dev User', email: 'dev@agent-ecommerce.com', org_name: 'Local QA' }, credits: { balance: 999 }, access: { product_roles: ['admin'] } } }
  }
  if (url.includes('/api/v1/ecommerce/products')) {
    const product = { id: 'dev-product', product_id: 'dev-product', title: 'QA Style Governance SKU', sku_code: 'QA-STYLE-001', skuCode: 'QA-STYLE-001', status: 'ready', assets: [], created_at: new Date().toISOString() }
    if (/\/api\/v1\/ecommerce\/products\/[^/?]+/.test(url)) return { code: 0, message: 'ok', data: product }
    return { code: 0, message: 'ok', data: [product] }
  }
  if (url.includes('/api/v1/ecommerce/production') || url.includes('/api/v1/ecommerce/stage-view')) {
    return { code: 0, message: 'ok', data: { product_id: 'dev-product', status: 'ready', stages: [], source_assets: [], decisions: [] } }
  }
  return { code: 0, message: 'ok', data: {} }
}

async function connectCdp() {
  const tabs = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then(r => r.json())
  const tab = tabs.find(item => item.type === 'page') || tabs[0]
  const cdp = new CdpClient(new WebSocket(tab.webSocketDebuggerUrl))
  await new Promise(resolve => cdp.ws.onopen = resolve)
  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  await cdp.send('Network.enable')
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*://*/api/*', requestStage: 'Request' }] })
  cdp.onEvent = event => {
    if (event.method !== 'Fetch.requestPaused') return
    const requestId = event.params.requestId
    const url = event.params.request.url
    const data = mockApiPayload(url)
    cdp.send('Fetch.fulfillRequest', {
      requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
      body: Buffer.from(JSON.stringify(data)).toString('base64'),
    }).catch(() => {})
  }
  await cdp.send('Log.enable').catch(() => {})
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1200, deviceScaleFactor: 1, mobile: false })
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: authBootstrapSource })
  return cdp
}

async function captureRoute(cdp, route, screenshotDir) {
  cdp.events = []
  const url = `${baseUrl}${route.path}`
  await cdp.send('Page.navigate', { url: `${baseUrl}/@vite/client` })
  await delay(500)
  await cdp.send('Runtime.evaluate', { expression: authBootstrapSource, returnByValue: true })
  await cdp.send('Page.navigate', { url })
  await delay(2500)
  const body = await cdp.send('Runtime.evaluate', { expression: `document.body?.innerText?.slice(0, 2000) || ''`, returnByValue: true })
  const title = await cdp.send('Runtime.evaluate', { expression: `document.title || ''`, returnByValue: true })
  const location = await cdp.send('Runtime.evaluate', { expression: `window.location.href`, returnByValue: true })
  const png = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  const screenshotRel = `${screenshotDirRel}/${route.id}.png`
  const screenshotPath = join(root, screenshotRel)
  mkdirSync(dirname(screenshotPath), { recursive: true })
  writeFileSync(screenshotPath, Buffer.from(png.data, 'base64'))
  const consoleErrors = cdp.events.filter(event => event.method === 'Runtime.exceptionThrown' || (event.method === 'Log.entryAdded' && ['error', 'warning'].includes(event.params?.entry?.level)))
  const networkFailures = cdp.events.filter(event => event.method === 'Network.loadingFailed')
  return {
    id: route.id,
    surface: route.surface,
    url,
    final_url: location.result?.value || url,
    screenshot: screenshotRel,
    title: title.result?.value || '',
    text_sample: body.result?.value || '',
    console_error_count: consoleErrors.length,
    network_failure_count: networkFailures.length,
    status: 'CAPTURED',
  }
}

async function main() {
  const routes = routePlan(changedFiles)
  const screenshotDir = join(root, screenshotDirRel)
  mkdirSync(screenshotDir, { recursive: true })
  let server = null
  let chrome = null
  let cdp = null
  const startedAt = new Date().toISOString()
  try {
    server = await startServer()
    chrome = await launchChrome()
    cdp = await connectCdp()
    const screenshots = []
    for (const route of routes) screenshots.push(await captureRoute(cdp, route, screenshotDir))
    const manifest = {
      schema_version: '1.0',
      status: 'PASS',
      acceptance_status: 'PASS',
      generated_by: 'scripts/ecommerce-frontend-visual-evidence.mjs',
      generated_at: new Date().toISOString(),
      frontend_root: root,
      base_url: baseUrl,
      changed_files: changedFiles,
      routes,
      screenshots,
      decision: {
        decision: 'ACCEPTED_WITH_NOTES',
        notes: 'Automated screenshot evidence captured via Chromium CDP. This proves render/visual inventory evidence, not full interaction or backend persistence QA.',
      },
    }
    writeJson(reportRel, manifest)
    console.log(JSON.stringify(manifest, null, 2))
  } catch (error) {
    const manifest = {
      schema_version: '1.0',
      status: 'FAIL',
      acceptance_status: 'FAIL',
      generated_by: 'scripts/ecommerce-frontend-visual-evidence.mjs',
      generated_at: new Date().toISOString(),
      started_at: startedAt,
      frontend_root: root,
      base_url: baseUrl,
      changed_files: changedFiles,
      routes,
      error: error.message,
    }
    writeJson(reportRel, manifest)
    console.error(JSON.stringify(manifest, null, 2))
    process.exitCode = 1
  } finally {
    try { cdp?.close() } catch {}
    if (chrome?.chrome) chrome.chrome.kill('SIGKILL')
    if (server) server.kill('SIGKILL')
    setTimeout(() => process.exit(process.exitCode || 0), 100).unref()
  }
}

main()
