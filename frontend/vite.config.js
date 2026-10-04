import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        bypass(req) {
          // Do NOT proxy client-side JavaScript source modules located in frontend/api/
          if (
            /\.(js|jsx|mjs|ts|tsx)($|\?)/.test(req.url) ||
            req.headers['sec-fetch-dest'] === 'script'
          ) {
            return req.url;
          }
        },
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
