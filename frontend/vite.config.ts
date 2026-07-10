import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) {
            return "vendor-react";
          }
          if (/[\\/]node_modules[\\/](@tanstack[\\/]react-query|axios)[\\/]/.test(id)) {
            return "vendor-data";
          }
          if (/[\\/]node_modules[\\/](react-hook-form|@hookform[\\/]resolvers|zod)[\\/]/.test(id)) {
            return "vendor-forms";
          }
          if (/[\\/]node_modules[\\/]framer-motion[\\/]/.test(id)) {
            return "vendor-motion";
          }
          if (/[\\/]node_modules[\\/](lucide-react|date-fns)[\\/]/.test(id)) {
            return "vendor-ui";
          }
          if (/[\\/]node_modules[\\/]socket.io-client[\\/]/.test(id)) {
            return "vendor-realtime";
          }
          return "vendor-misc";
        },
      },
    },
  },
})
