import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.ECOMMERCE_E2E_PORT ?? 5207)

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.03,
      animations: 'disabled',
    },
  },
  fullyParallel: false,
  reporter: [['list'], ['json', { outputFile: 'reports/frontend-quality/playwright-report.json' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    viewport: { width: 1440, height: 1200 },
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? '/usr/bin/chromium',
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
      name: 'chromium-smoke',
      testMatch: /.*\.smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-visual-desktop',
      testMatch: /.*\.visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1200 } },
    },
    {
      name: 'chromium-visual-tablet',
      testMatch: /.*\.visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 1000 } },
    },
    {
      name: 'chromium-visual-mobile',
      testMatch: /.*\.visual\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
  ],
})
