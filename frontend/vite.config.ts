import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Use a regex so only "@/" paths are aliased and do not
    // accidentally rewrite scoped packages like "@headlessui/vue".
    alias: [{ find: /^@\//, replacement: `${resolve(__dirname, 'src')}/` }],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    // Proxy API requests in dev to the backend to avoid CORS and
    // to work both inside/outside Docker.
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://backend:3001',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      usePolling: true,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  esbuild: {
    target: 'es2020',
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia'],
  },
})
