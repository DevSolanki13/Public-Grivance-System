import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

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
