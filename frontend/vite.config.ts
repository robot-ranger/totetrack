import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Dev server proxy: Frontend code calls /api/* (see api.ts). We forward to FastAPI (default :8000)
// and strip the /api prefix because backend routes begin at root (/totes, /items, ...).
// In production you can instead set VITE_API_BASE to the full backend URL and skip the proxy.
function httpsConfig() {
  // Enable when VITE_HTTPS=1 or cert files exist.
  if (process.env.VITE_HTTPS === '0') return undefined
  const certDir = path.resolve(__dirname, 'certs')
  const keyPath = path.join(certDir, 'dev-key.pem')
  const certPath = path.join(certDir, 'dev-cert.pem')
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
  }
  // If user explicitly requested HTTPS but no certs, they should generate them (see README instructions)
  // Returning undefined keeps HTTP only.
  if (process.env.VITE_HTTPS === '1') {
    throw new Error('VITE_HTTPS=1 but certs missing. Create frontend/certs/dev-key.pem and dev-cert.pem (see README).')
  }
  return undefined
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
      // Proxy media files returned by backend (image_url like /media/xyz.jpg)
      // Without this, the frontend dev server would 404 these paths.
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Proxy FastAPI docs as well so visiting /docs in dev works
      '/docs': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/redoc': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/openapi.json': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@chakra-ui/react']
  }
})