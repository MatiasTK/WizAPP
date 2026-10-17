import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  root: 'src/renderer',
  clearScreen: false,
  plugins: [react(), tsConfigPaths({ root: '../..' }), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: true
  }
})
