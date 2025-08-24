import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    open: true,
    proxy: {
      // Proxy API calls to the backend server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      // Proxy operations calls to the backend server
      '/operations': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      // Proxy auth calls to the backend server
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
