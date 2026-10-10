import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Scout Journey',
        short_name: 'Scout Journey',
        description: 'Annota i tuoi obiettivi e segui i progressi.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f8f8f4',
        theme_color: '#224a39',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        globPatterns: ['**/*.{html,js,css,svg,png}'],
        navigateFallback: '/index.html',
        skipWaiting: true,
      },
    }),
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
})
