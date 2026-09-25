import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@player-tracker': resolve('src/renderer/src/tools/player-tracker'),
        '@live-tracking': resolve('src/renderer/src/tools/live-tracking'),
        '@video-analysis': resolve('src/renderer/src/tools/video-analysis'),
      },
    },
    plugins: [react(), tailwindcss()],
  },
})
