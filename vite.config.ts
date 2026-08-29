import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512-square.png', 'icons/icon-maskable-square.png'],
      manifest: {
        id: '/',
        name: 'GymLab',
        short_name: 'GymLab',
        description: 'Tu tracker de entrenamiento personal',
        theme_color: '#2563eb',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'es',
        categories: ['health', 'fitness', 'lifestyle'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512-square.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-maskable-square.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['icons/image_copy.png'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fitnessprogramer\.com\/.*\.(?:gif|png|jpe?g|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'exercise-media-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
