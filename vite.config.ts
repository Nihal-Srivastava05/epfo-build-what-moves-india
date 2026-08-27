import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Deployed to GitHub Pages under /epfo-build-what-moves-india/.
// Routing is hash-based so a refresh never 404s on a static host.
export default defineConfig({
  base: process.env.DEPLOY_BASE ?? '/epfo-build-what-moves-india/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  build: {
    // Vendor split so the framework caches across deploys and the animation
    // library is a separate request from the app itself.
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (!id.includes('node_modules')) return
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/.test(id)) return 'react'
          if (/[\\/]node_modules[\\/]motion/.test(id)) return 'motion'
          if (/[\\/]node_modules[\\/](@radix-ui|radix-ui)[\\/]/.test(id)) return 'radix'
        },
      },
    },
    chunkSizeWarningLimit: 300,
  },
})
