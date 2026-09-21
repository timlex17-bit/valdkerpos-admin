import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    mode === 'development' && vueDevTools(),
  ].filter(Boolean),

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'admin.valorapos.cloud',
      'localhost',
      '127.0.0.1',
    ],
  },

  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: [
      'admin.valorapos.cloud',
      'localhost',
      '127.0.0.1',
    ],
  },
}))
