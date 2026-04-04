import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const projectId = env.VITE_FIREBASE_PROJECT_ID || env.VITE_PUBLIC_FIREBASE_PROJECT_ID
  const region = env.VITE_FIREBASE_FUNCTIONS_REGION || env.VITE_PUBLIC_FIREBASE_FUNCTIONS_REGION || 'asia-southeast1'
  const defaultProxyTarget = projectId ? `https://${region}-${projectId}.cloudfunctions.net` : undefined
  const proxyTarget = env.VITE_DEV_API_PROXY_TARGET || defaultProxyTarget

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: proxyTarget
      ? {
          proxy: {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              secure: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          },
        }
      : undefined,
  }
})
