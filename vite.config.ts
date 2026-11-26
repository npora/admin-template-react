import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { pwaUpdate } from './build/pwa-update.js'
import { buildOutput } from './build/output.js'
import { normalizeApiPrefix } from './src/config/env.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const apiPrefix = normalizeApiPrefix(env.VITE_API_PREFIX)
  const escapedPrefix = apiPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return {
    plugins: [
      react(),
      pwaUpdate(),
      buildOutput({
        compress: env.VITE_BUILD_COMPRESS !== 'false',
        analyze: env.VITE_BUILD_ANALYZE === 'true'
      })
    ],
    resolve: {
      dedupe: ['react', 'react-dom']
    },
    optimizeDeps: {
      include: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom', 'react-dom/client']
    },
    server: {
      port: 9000,
      strictPort: true,
      proxy: {
        [`^${escapedPrefix}(?:/|$)`]: {
          target: env.VITE_API_URL?.trim() || 'http://localhost:8080',
          changeOrigin: true,
          configure(proxy) {
            proxy.on('proxyReq', (upstream, incoming) => {
              const host = incoming.headers.host
              const origin = incoming.headers.origin
              // Match the Vue dev proxy: preserve Origin on cross-origin requests.
              if (
                host &&
                origin === `http://${host}` &&
                ['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname)
              ) {
                upstream.removeHeader('origin')
              }
            })
          }
        }
      }
    }
  }
})
