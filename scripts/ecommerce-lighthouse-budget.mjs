#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const root = process.cwd()
const args = process.argv.slice(2)
const port = Number(valueAfter('--port') ?? process.env.ECOMMERCE_LIGHTHOUSE_PORT ?? 5217)
const baseUrl = valueAfter('--base-url') ?? `http://127.0.0.1:${port}`
const reportRel = valueAfter('--report') ?? 'reports/frontend-quality/lighthouse-budget-latest.json'
const rawRel = 'reports/frontend-quality/lighthouse-raw.json'
const minPerformance = Number(valueAfter('--min-performance') ?? 0.45)
const minAccessibility = Number(valueAfter('--min-accessibility') ?? 0.70)
const minBestPractices = Number(valueAfter('--min-best-practices') ?? 0.70)

function valueAfter(name) { const idx = args.indexOf(name); if (idx >= 0 && args[idx + 1]) return args[idx + 1]; const p = args.find(a => a.startsWith(`${name}=`)); return p ? p.slice(name.length + 1) : null }
function writeJson(rel, payload) { const path = join(root, rel); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, JSON.stringify(payload, null, 2) + '\n') }
async function waitForHttp(url, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try { const res = await fetch(url); if (res.status < 500) return true } catch {}
    await delay(500)
  }
  return false
}
async function main() {
  const failures = []
  const warnings = []
  const build = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
  if (build.status !== 0) failures.push(`build failed before Lighthouse: ${(build.stderr || build.stdout).slice(-1000)}`)
  let server = null
  if (!failures.length) {
    server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, BROWSER: 'none' } })
    const ready = await waitForHttp(baseUrl)
    if (!ready) failures.push('vite preview server not ready for Lighthouse')
  }
  let scores = null
  let command = null
  if (!failures.length) {
    mkdirSync(dirname(join(root, rawRel)), { recursive: true })
    command = spawnSync('npx', ['lighthouse', `${baseUrl}/products?dev=1`, '--output=json', `--output-path=${rawRel}`, '--quiet', '--only-categories=performance,accessibility,best-practices', '--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage'], { cwd: root, encoding: 'utf8', env: { ...process.env, CHROME_PATH: process.env.CHROME_PATH || '/usr/bin/chromium' }, timeout: 120_000, maxBuffer: 10 * 1024 * 1024 })
    if (command.status !== 0) failures.push(`lighthouse failed: ${(command.stderr || command.stdout || '').slice(-1200)}`)
    else if (!existsSync(join(root, rawRel))) failures.push('Lighthouse raw report missing')
    else {
      const raw = JSON.parse(readFileSync(join(root, rawRel), 'utf8'))
      scores = {
        performance: raw.categories?.performance?.score ?? 0,
        accessibility: raw.categories?.accessibility?.score ?? 0,
        best_practices: raw.categories?.['best-practices']?.score ?? 0,
      }
      if (scores.performance < minPerformance) failures.push(`Lighthouse performance ${scores.performance} < ${minPerformance}`)
      if (scores.accessibility < minAccessibility) failures.push(`Lighthouse accessibility ${scores.accessibility} < ${minAccessibility}`)
      if (scores.best_practices < minBestPractices) failures.push(`Lighthouse best-practices ${scores.best_practices} < ${minBestPractices}`)
    }
  }
  if (server) server.kill('SIGTERM')
  const result = { status: failures.length ? 'FAIL' : (warnings.length ? 'PASS_WITH_NOTES' : 'PASS'), policy: 'Lighthouse budgets guard product frontend performance/accessibility/best-practices on a preview build.', url: `${baseUrl}/products?dev=1`, raw_report: rawRel, thresholds: { min_performance: minPerformance, min_accessibility: minAccessibility, min_best_practices: minBestPractices }, scores, command: command ? { exit_code: command.status, stderr_tail: (command.stderr || '').slice(-1000) } : null, failures, warnings }
  writeJson(reportRel, result)
  console.log(JSON.stringify(result, null, 2))
  process.exit(failures.length ? 1 : 0)
}
main().catch(error => { writeJson(reportRel, { status: 'FAIL', failures: [error.message] }); console.error(error); process.exit(1) })
