import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // porta do servidor local: o sistema abre em http://localhost:6240
  server: { port: 6240 },
  preview: { port: 6241 },
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
