import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: '.',
  plugins: [react()],
  resolve: {
    alias: {
      '@common': path.resolve(__dirname, 'src/common')
    }
  },
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist/renderer'
  }
})
