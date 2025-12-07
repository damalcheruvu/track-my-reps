import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/track-my-reps/',
  build: {
    chunkSizeWarningLimit: 1000, // Increase from default 500KB to 1000KB
  }
})
