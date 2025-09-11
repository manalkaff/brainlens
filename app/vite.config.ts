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
        ws: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Ensure cookies are forwarded for authentication
            if (req.headers.cookie) {
              proxyReq.setHeader('cookie', req.headers.cookie);
            }
            // Forward other important headers
            if (req.headers.authorization) {
              proxyReq.setHeader('authorization', req.headers.authorization);
            }
          });
        }
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
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for large dependencies
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI components chunk
          ui: ['lucide-react', '@radix-ui/react-accordion', '@radix-ui/react-dialog'],
          // Learning platform chunk
          learning: ['@xyflow/react', 'ai'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
    ],
  },
})
