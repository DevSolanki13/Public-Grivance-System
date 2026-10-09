import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Forward API calls to the Express server (backend/server) during development.
  server: {
    proxy: {
      '/api': process.env.API_PROXY_TARGET || 'http://localhost:4000',
    },
  },

  // Vitest configuration for unit + component tests
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    include: ['src/tests/unit/**/*.test.{js,jsx}'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
})
