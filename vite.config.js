
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import base44 from '@base44/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    base44(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})