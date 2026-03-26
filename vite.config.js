import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, new URL('.', import.meta.url).pathname, '')

  return {
    plugins: [react()],
    server: {
      proxy: env.VITE_TARGET_ORIGIN
        ? {
            '/api': {
              target: env.VITE_TARGET_ORIGIN,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
    },
  }
})
