import type { Page, TestInfo } from '@playwright/test'

export type RuntimeEvidence = {
  consoleErrors: string[]
  networkFailures: string[]
  apiCalls: Array<{ method: string; url: string; status?: number }>
}

export function createEvidenceCollector(page: Page): RuntimeEvidence {
  const evidence: RuntimeEvidence = { consoleErrors: [], networkFailures: [], apiCalls: [] }
  page.on('pageerror', error => evidence.consoleErrors.push(error.message))
  page.on('console', msg => {
    if (msg.type() === 'error') evidence.consoleErrors.push(msg.text())
  })
  page.on('requestfailed', request => {
    evidence.networkFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`.trim())
  })
  page.on('response', response => {
    const url = response.url()
    if (url.includes('/api/v1/ecommerce/')) {
      evidence.apiCalls.push({ method: response.request().method(), url: redactUrl(url), status: response.status() })
    }
  })
  return evidence
}

export function redactUrl(url: string) {
  return url.replace(/(access_token|token|password|secret)=([^&]+)/gi, '$1=<redacted>')
}

export async function screenshotEvidence(page: Page, testInfo: TestInfo, name: string) {
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '-')
  const path = `reports/business-interaction-qa/screenshots/${safeName}-${testInfo.project.name}.png`
  await page.screenshot({ path, fullPage: true })
  await testInfo.attach(safeName, { path, contentType: 'image/png' })
  return path
}

export function expectCleanEvidence(evidence: RuntimeEvidence) {
  const ignoredConsole = evidence.consoleErrors.filter(message => !/favicon|ResizeObserver loop/i.test(message))
  const ignoredNetwork = evidence.networkFailures.filter(message => !/favicon|picsum\.photos|fastly\.picsum\.photos|ERR_ABORTED/i.test(message))
  return { consoleErrors: ignoredConsole, networkFailures: ignoredNetwork }
}
