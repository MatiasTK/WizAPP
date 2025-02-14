import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@resources': resolve('resources'),
        '@lib': resolve('src/lib'),
        '@/types': resolve('src/types'),
        '@constants': resolve('src/main/constants/index.ts'),
        '@main': resolve('src/main'),
        '@i18n': resolve('src/i18n/index.ts')
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [react(), tsConfigPaths(), tailwindcss()]
  }
})
