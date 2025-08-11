import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  build: {
    sourcemap: true
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: [
      'a5596f5b-0e64-44d2-9f7e-86e86ceed4ae-00-24ck73by474ey.janeway.replit.dev',
      '.replit.dev',
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})