import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [react()],
  // Static assets (favicons, OG image, robots.txt, sitemap.xml) live in
  // frontend/public/ and are copied to dist/ at build time. Served from
  // dist/ by Flask in production and by Vite directly in dev.
  publicDir: 'public',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Handle SPA routing - fallback to index.html for client-side routes
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})