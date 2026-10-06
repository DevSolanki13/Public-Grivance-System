import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for JanSewa
 * Targets: Chromium only for fast CI runs
 * Base URL: Vite dev server at localhost:5173
 */
export default defineConfig({
  testDir: './src/tests/e2e',
  timeout: 30000,
  retries: 1,

  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start the Vite dev server automatically before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
