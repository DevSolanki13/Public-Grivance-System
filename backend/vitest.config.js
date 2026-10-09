import { defineConfig } from 'vitest/config';

// Load SUPABASE_URL / keys from backend/.env when present (Node 20.12+).
try {
  process.loadEnvFile('.env');
} catch {
  // No .env: rely on variables already set in the environment (e.g. CI).
}

// Integration tests run against a real Supabase instance (`npm run start`).
// They share one database, so files run one at a time.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    fileParallelism: false,
    // API tests log in repeatedly; don't let the brute-force limiter trip them.
    env: { LOGIN_RATE_LIMIT: '1000' },
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
