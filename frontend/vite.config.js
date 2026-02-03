import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Favicons are served from project root by app.py in production
  // During local dev, favicon requests will 404 (cosmetic only, app works fine)
  publicDir: false,
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