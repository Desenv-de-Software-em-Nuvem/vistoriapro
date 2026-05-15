import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Imob Vistorias - Sistema Profissional',
        short_name: 'Imob Vistorias',
        description: 'Sistema profissional de vistorias de imóveis da Imob Empreendimentos com captura de fotos e transcrição de áudio',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0f',
        theme_color: '#ff4500',
        orientation: 'portrait-primary',
        scope: '/',
        lang: 'pt-BR',
        categories: ['business', 'productivity', 'utilities'],
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,ico,png,svg,webp,woff,woff2}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//, /\.(?:js|css|map|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
