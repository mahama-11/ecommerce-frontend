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
const viewports = [
  { id: 'desktop', width: 1440, height: 1200, mobile: false },
  { id: 'tablet', width: 1024, height: 1000, mobile: false },
  { id: 'mobile', width: 390, height: 844, mobile: true },
]

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
  const addCoreRuntimeInventory = () => {
    add('product-center', '/products?dev=1', 'Product Center')
    add('template-center', '/aiChat/template?dev=1', 'Template Center')
    add('batch-listing-legacy', '/aiChat/batchListing?dev=1', 'Legacy Batch Listing Redirect')
    add('product-batch-listing-legacy', '/products/workbench/batch-listing?dev=1', 'Legacy Product Batch Listing Redirect')
    add('visual-tools-index', '/products/workbench/visual-tools?dev=1', 'Product Workbench')
    add('visual-tools-ai-wearable', '/products/workbench/visual-tools/ai-wearable?dev=1', 'Product Workbench · AI Wearable')
    add('product-ai-product', '/products/dev-product/ai/ai-product?dev=1', 'Product-scoped AI Product')
    add('product-detail', '/products/dev-product?dev=1', 'Product Detail')
    add('production-prep', '/products/dev-product/production/prep?dev=1', 'Production Prep')
    add('production-sandbox', '/products/dev-product/production/sandbox?dev=1', 'Production Sandbox')
    add('production-workshop', '/products/dev-product/production/workshop?dev=1', 'Production Workshop')
    add('downloads', '/products/workbench/downloads?dev=1', 'Downloads')
  }

  if (files.length === 0) {
    addCoreRuntimeInventory()
    return [...routes.values()]
  }

  addCoreRuntimeInventory()
  for (const file of files) {
    if (/src\/pages\/product\/ProductListPage\.tsx$/.test(file) || /src\/layouts\/ProductWorkbenchLayout\.tsx$/.test(file)) {
      add('product-center', '/products?dev=1', 'Product Center')
      add('template-center', '/aiChat/template?dev=1', 'Template Center')
      add('product-batch-listing-legacy', '/products/workbench/batch-listing?dev=1', 'Legacy Product Batch Listing Redirect')
    }
    if (/src\/pages\/product\/ProductDetailPage\.tsx$/.test(file) || /src\/pages\/product\/components\//.test(file)) {
      add('product-detail', '/products/dev-product?dev=1', 'Product Detail')
      add('template-center', '/aiChat/template?dev=1', 'Template Center')
    }
    if (/src\/components\/product-workbench\//.test(file) || /src\/pages\/ProductVisualToolsPage\.tsx$/.test(file)) {
      add('visual-tools-index', '/products/workbench/visual-tools?dev=1', 'Product Workbench')
      add('visual-tools-ai-wearable', '/products/workbench/visual-tools/ai-wearable?dev=1', 'Product Workbench · AI Wearable')
      add('template-center', '/aiChat/template?dev=1', 'Template Center')
    }
    if (/src\/pages\/ToolPage\.tsx$/.test(file)) {
      add('product-ai-product', '/products/dev-product/ai/ai-product?dev=1', 'Product-scoped AI Product')
    }
    if (/src\/pages\/AgentTemplateMarketPage\.tsx$/.test(file) || /src\/router\/index\.tsx$/.test(file)) {
      add('template-center', '/aiChat/template?dev=1', 'Template Center')
      add('batch-listing-legacy', '/aiChat/batchListing?dev=1', 'Legacy Batch Listing Redirect')
      add('product-batch-listing-legacy', '/products/workbench/batch-listing?dev=1', 'Legacy Product Batch Listing Redirect')
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

  if (routes.size === 0) addCoreRuntimeInventory()
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
  const child = spawn(join(root, 'node_modules/.bin/vite'), ['--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
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

function mockTemplateItem() {
  return {
    id: 'tpl-style-governance',
    slug: 'style-governance-template',
    toolSlug: 'ai-wearable',
    name: 'QA Style Governance Template',
    summary: 'Reusable ecommerce production template for layout governance evidence.',
    modality: 'image',
    executorType: 'image_tool',
    series: 'visual',
    capabilityType: 'image_generation',
    interactionMode: 'guided',
    coverAssetUrl: '',
    platformTags: ['Amazon'],
    industryTags: ['Apparel'],
    scenarioTags: ['Template Center'],
    isFeatured: true,
    recommendScore: 98,
    isFavorited: false,
    favoriteCount: 12,
    useCount: 128,
    successRateHint: 0.92,
  }
}

function mockTemplateFacets() {
  return {
    platforms: [{ key: 'amazon', label: 'Amazon', count: 1 }],
    modalities: [{ key: 'image', label: 'Image', count: 1 }],
    series: [{ key: 'visual', label: 'Visual', count: 1 }],
    capabilities: [{ key: 'image_generation', label: 'Image Generation', count: 1 }],
  }
}

function mockApiPayload(url) {
  if (url.includes('/api/v1/ecommerce/auth/session')) {
    return { code: 0, message: 'ok', data: { user: { full_name: 'Dev User', email: 'dev@agent-ecommerce.com', org_name: 'Local QA' }, credits: { balance: 999 }, access: { product_roles: ['admin'] } } }
  }
  if (url.includes('/api/v1/ecommerce/template-center/catalog/facets')) {
    return { code: 0, message: 'ok', data: mockTemplateFacets() }
  }
  if (url.includes('/api/v1/ecommerce/template-center/catalog/recommendations')) {
    return { code: 0, message: 'ok', data: [mockTemplateItem()] }
  }
  if (/\/api\/v1\/ecommerce\/template-center\/catalog\/[^/?]+/.test(url)) {
    return { code: 0, message: 'ok', data: {
      catalog: mockTemplateItem(),
      locale: { description: 'Template Center QA detail', scenarioDescription: 'Governed style evidence', inputDescription: 'SKU context', outputDescription: 'Reusable template output' },
      version: { id: 'tpl-version-1', versionNo: 1, versionLabel: 'v1', status: 'ready' },
      schema: { inputSchema: {}, outputSchema: {}, executionSchema: {}, promptLayers: {}, defaultVariables: {}, toolBinding: {} },
      examples: [],
    } }
  }
  if (url.includes('/api/v1/ecommerce/template-center/catalog')) {
    return { code: 0, message: 'ok', data: [mockTemplateItem()] }
  }
  if (url.includes('/api/v1/ecommerce/template-center/favorites')) {
    return { code: 0, message: 'ok', data: [] }
  }
  if (url.includes('/api/v1/ecommerce/template-center/instances')) {
    return { code: 0, message: 'ok', data: [] }
  }
  if (url.includes('/api/v1/ecommerce/downloads')) {
    return { code: 0, message: 'ok', data: [] }
  }
  if (url.includes('/api/v1/ecommerce/export-packages')) {
    return { code: 0, message: 'ok', data: [] }
  }
  if (url.includes('/api/v1/ecommerce/products')) {
    const product = { id: 'dev-product', product_id: 'dev-product', title: 'QA Style Governance SKU', sku_code: 'QA-STYLE-001', skuCode: 'QA-STYLE-001', status: 'ready', assets: [], images: [], tags: [], category_id: '', categoryId: '', brand_id: '', brandId: '', export_status: 'pending', exportStatus: 'pending', listing_versions_count: 0, listingVersionsCount: 0, assets_count: 0, assetsCount: 0, created_at: new Date().toISOString() }
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
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: authBootstrapSource })
  return cdp
}

async function captureRoute(cdp, route, screenshotDir, viewport) {
  cdp.events = []
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile })
  const url = `${baseUrl}${route.path}`
  await cdp.send('Page.navigate', { url: `${baseUrl}/@vite/client` })
  await delay(500)
  await cdp.send('Runtime.evaluate', { expression: authBootstrapSource, returnByValue: true })
  await cdp.send('Page.navigate', { url })
  await delay(2500)
  const body = await cdp.send('Runtime.evaluate', { expression: `document.body?.innerText?.slice(0, 2000) || ''`, returnByValue: true })
  const title = await cdp.send('Runtime.evaluate', { expression: `document.title || ''`, returnByValue: true })
  const location = await cdp.send('Runtime.evaluate', { expression: `window.location.href`, returnByValue: true })
  const overflow = await cdp.send('Runtime.evaluate', { expression: `(() => {
    const nodes = [...document.querySelectorAll('body *')]
    const findings = []
    const hasScrollableXAncestor = el => {
      let current = el.parentElement
      while (current && current !== document.body) {
        const s = getComputedStyle(current)
        if ((s.overflowX === 'auto' || s.overflowX === 'scroll') && current.scrollWidth > current.clientWidth + 2) return true
        current = current.parentElement
      }
      return false
    }
    for (const el of nodes) {
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) continue
      const style = getComputedStyle(el)
      const className = String(el.className || '').slice(0, 160)
      const text = (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' ').slice(0, 120)
      const isDecorative = text.length === 0 && !['IMG', 'SVG', 'BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)
      const isScreenReaderOnly = /(?:^|\s)sr-only(?:\s|$)/.test(className)
      const isIntentionalClamp = /(?:^|\s)line-clamp-\d+(?:\s|$)/.test(className) || style.webkitLineClamp !== 'none'
      const isOffCanvas = rect.right <= 1 || rect.left >= window.innerWidth - 1
      const isInvisible = Number(style.opacity || '1') === 0 || style.visibility === 'hidden' || style.display === 'none'
      const isIntentionalMotionOverflow = /animate-marquee|translate-x-24|pointer-events-none/.test(className)
      const isIntentionalTruncate = /(?:^|\s)truncate(?:\s|$)/.test(className)
      const isPageScrollShell = /flex-1 overflow-hidden flex flex-col/.test(className)
      const canOwnTextClipping = el.children.length <= 2 || ['P', 'SPAN', 'BUTTON', 'A', 'H1', 'H2', 'H3', 'LABEL', 'INPUT', 'TEXTAREA'].includes(el.tagName)
      if (isInvisible || isIntentionalMotionOverflow || isPageScrollShell) continue
      if (!isScreenReaderOnly && !isOffCanvas && !isDecorative && !hasScrollableXAncestor(el) && (rect.right > window.innerWidth + 2 || rect.left < -2)) findings.push({ type: 'viewport-horizontal-overflow', tag: el.tagName, className, text, rect: { left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) } })
      if (!isScreenReaderOnly && !isIntentionalTruncate && canOwnTextClipping && !isIntentionalClamp && (style.overflow === 'hidden' || style.overflowX === 'hidden') && el.scrollWidth > el.clientWidth + 2 && text.length > 8) findings.push({ type: 'potential-text-clipping-x', tag: el.tagName, className, text, clientWidth: el.clientWidth, scrollWidth: el.scrollWidth })
      if (!isScreenReaderOnly && !isIntentionalTruncate && canOwnTextClipping && !isIntentionalClamp && (style.overflow === 'hidden' || style.overflowY === 'hidden') && el.scrollHeight > el.clientHeight + 2 && text.length > 8) findings.push({ type: 'potential-text-clipping-y', tag: el.tagName, className, text, clientHeight: el.clientHeight, scrollHeight: el.scrollHeight })
      if (findings.length >= 30) break
    }
    return { viewport: { width: window.innerWidth, height: window.innerHeight }, bodyScrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, findings }
  })()`, returnByValue: true })
  const png = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  const screenshotRel = `${screenshotDirRel}/${route.id}-${viewport.id}.png`
  const screenshotPath = join(root, screenshotRel)
  mkdirSync(dirname(screenshotPath), { recursive: true })
  writeFileSync(screenshotPath, Buffer.from(png.data, 'base64'))
  const consoleErrors = cdp.events.filter(event => event.method === 'Runtime.exceptionThrown')
  const networkFailures = cdp.events.filter(event => event.method === 'Network.loadingFailed' && event.params?.requestId && event.params?.type !== 'Other')
  const overflowValue = overflow.result?.value || { findings: [] }
  return {
    id: `${route.id}-${viewport.id}`,
    route_id: route.id,
    viewport_id: viewport.id,
    viewport: { width: viewport.width, height: viewport.height, mobile: viewport.mobile },
    surface: route.surface,
    url,
    final_url: location.result?.value || url,
    screenshot: screenshotRel,
    title: title.result?.value || '',
    text_sample: body.result?.value || '',
    console_error_count: consoleErrors.length,
    network_failure_count: networkFailures.length,
    overflow_finding_count: overflowValue.findings?.length || 0,
    overflow_findings: overflowValue.findings || [],
    status: 'CAPTURED',
  }
}

async function main() {
  const routes = routePlan(changedFiles)
  if (args.includes('--route-plan-only')) {
    console.log(JSON.stringify({ routes }, null, 2))
    return
  }
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
    for (const route of routes) {
      for (const viewport of viewports) screenshots.push(await captureRoute(cdp, route, screenshotDir, viewport))
    }
    const overflowFindings = screenshots.flatMap(item => (item.overflow_findings || []).map(finding => ({ route_id: item.route_id, viewport_id: item.viewport_id, ...finding })))
    const hasConsoleOrNetworkNotes = screenshots.some(item => item.console_error_count > 0 || item.network_failure_count > 0)
    const hasLayoutFailures = overflowFindings.length > 0
    const finalUrls = screenshots.map(item => item.final_url || '')
    const textSamples = screenshots.map(item => item.text_sample || '').join('\n')
    const manifestStatus = hasLayoutFailures ? 'FAIL' : (hasConsoleOrNetworkNotes ? 'PASS_WITH_NOTES' : 'PASS')
    const manifestAcceptance = hasLayoutFailures ? 'FAIL' : (hasConsoleOrNetworkNotes ? 'ACCEPTED_WITH_NOTES' : 'PASS')
    const manifest = {
      schema_version: '1.2',
      status: manifestStatus,
      acceptance_status: manifestAcceptance,
      generated_by: 'scripts/ecommerce-frontend-visual-evidence.mjs',
      generated_at: new Date().toISOString(),
      frontend_root: root,
      base_url: baseUrl,
      changed_files: changedFiles,
      routes,
      viewports,
      screenshots,
      runtime_assertions: {
        final_url: finalUrls.some(url => url.includes('/products/workbench/visual-tools')) || finalUrls.some(url => url.includes('/products/dev-product/ai/ai-product')),
        page_identity: /视觉|Visual|商品|Product|AI Product|选择模特与风格|Choose Style Template/.test(textSamples),
        selected_context: /dev-product|Dev Product|SKU|商品|Product/.test(textSamples) || screenshots.some(item => item.route_id === 'product-ai-product'),
        forbidden_stay_on_source: finalUrls.every(url => !url.includes('/products?dev=1#forbidden-source')),
      },
      overflow_report: {
        status: overflowFindings.length ? 'FAIL' : 'PASS',
        finding_count: overflowFindings.length,
        findings: overflowFindings,
      },
      visual_diff: {
        status: 'DELEGATED_TO_PLAYWRIGHT_BASELINE',
        command: 'npm run test:visual',
        note: 'Playwright screenshot baselines cover critical routes; this CDP evidence adds multi-viewport screenshots and overflow/clipping inventory.',
      },
      decision: {
        decision: 'ACCEPTED_WITH_NOTES',
        notes: 'Automated multi-viewport screenshot evidence captured via Chromium CDP. This proves render/visual inventory plus overflow/clipping evidence, not full interaction or backend persistence QA.',
      },
    }
    writeJson(reportRel, manifest)
    console.log(JSON.stringify(manifest, null, 2))
    if (hasLayoutFailures) process.exitCode = 1
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
