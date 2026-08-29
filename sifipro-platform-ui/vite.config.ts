import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Different from sifipro-frontend's default 5173 so both dev servers can run
    // side by side without a port clash.
    port: 5174,
    // Proxies /api/* to sifipro-platform-api during `npm run dev`, the same way
    // nginx does it in the Docker build (nginx.conf). This keeps the app calling
    // relative /api/... paths in both environments and avoids needing CORS
    // configured on sifipro-platform-api for local development.
    proxy: {
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
    },
  },
})
