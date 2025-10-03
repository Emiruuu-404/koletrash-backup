                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Absolute paths so assets load correctly on routes like /truckdriver/notifications
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable sourcemaps for production
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    allowedHosts: ['ff7cfed143ba.ngrok-free.app']
  }
})
