import react from '@vitejs/plugin-react'
import tsConfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tsConfigPaths({ root: '.' })],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/renderer/src/test/setup.ts'],
    include: ['src/renderer/**/*.test.{ts,tsx}'],
    css: false
  }
})
