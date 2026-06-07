import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.ECOMMERCE_BUSINESS_E2E_PORT ?? process.env.ECOMMERCE_E2E_PORT ?? 5208)
const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE

export default defineConfig({
  testDir: './tests/e2e/business',
  timeout: 60_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  // Business runtime tests share a mock harness and generated evidence paths.
  // Keep them serial until mock/state isolation is split by worker.
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'reports/business-interaction-qa/playwright-report.json' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    viewport: { width: 1440, height: 1200 },
    launchOptions: {
      ...(chromiumExecutablePath ? { executablePath: chromiumExecutablePath } : {}),
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'chromium-business-runtime',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
