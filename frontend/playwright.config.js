import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';

// Make .env values (Supabase URL/keys) available to the test helpers.
Object.assign(process.env, loadEnv('test', process.cwd(), ''));

/**
 * Playwright E2E configuration for JanSewa.
 * Runs against the Vite dev server, the Express API and a real Supabase instance
 * (local: `npx supabase start`). All specs share that database, so they run
 * serially with a single worker; each spec creates and deletes its own users.
 */
export default defineConfig({
  testDir: './src/tests/e2e',
  timeout: 60000,
  expect: { timeout: 10000 },
  retries: 0,
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Starts the Express API and the Vite dev server (reused if already running).
  webServer: [
    {
      command: 'npm --prefix ../backend run start',
      url: 'http://localhost:4000/api/health',
      reuseExistingServer: true,
      timeout: 60000,
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60000,
    },
  ],
});
