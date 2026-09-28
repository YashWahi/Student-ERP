import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      'zustand/vanilla': path.resolve(
        __dirname,
        'node_modules/zustand/vanilla.js'
      ),
    },
  },
})