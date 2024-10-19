import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.', // This should point to the directory containing index.html
  build: {
    outDir: 'dist',
  },
  server: {
    open: true, // This will open the app in the browser when you run the dev server
  },
})