import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: './'` keeps asset + JSON paths relative so the built app can be
// served from any static host or sub-folder (no backend required).
export default defineConfig({
  base: './',
  plugins: [react()],
})
