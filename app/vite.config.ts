import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  root: path.resolve(__dirname, 'src/renderer'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer/src'),
      '@player-tracker': path.resolve(
        __dirname,
        'src/renderer/src/tools/player-tracker',
      ),
      '@live-tracking': path.resolve(
        __dirname,
        'src/renderer/src/tools/live-tracking',
      ),
      '@video-analysis': path.resolve(
        __dirname,
        'src/renderer/src/tools/video-analysis',
      ),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
})
