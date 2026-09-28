import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Proxies /api/* to sifipro-backend during `npm run dev`, the same way nginx
    // does it in the Docker build (nginx.conf). With VITE_API_BASE_URL empty the
    // app calls relative /api/... paths in both environments, without CORS.
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})