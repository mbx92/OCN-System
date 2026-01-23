// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  srcDir: 'app/',

  dir: {
    pages: 'pages',
    layouts: 'layouts',
    middleware: 'middleware',
  },

  devServer: {
    port: 4000,
  },

  modules: ['@pinia/nuxt', '@vueuse/nuxt', '@vite-pwa/nuxt'],

  vite: {
    plugins: [tailwindcss()],
    vue: {
      template: {
        compilerOptions: {
          // Treat cally calendar elements as custom elements
          isCustomElement: (tag: string) => tag.startsWith('calendar-'),
        },
      },
    },
  },

  css: ['./app/tailwind.css'],

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    public: {
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    },
  },

  nitro: {
    experimental: {
      asyncContext: true,
    },
  },

  // Disable SSR for protected pages to avoid auth redirect issues
  routeRules: {
    '/dashboard/**': { ssr: false },
    '/projects/**': { ssr: false },
    '/customers/**': { ssr: false },
    '/quotations/**': { ssr: false },
    '/purchase-orders/**': { ssr: false },
    '/suppliers/**': { ssr: false },
    '/inventory/**': { ssr: false },
    '/finance/**': { ssr: false },
    '/maintenance/**': { ssr: false },
    '/settings/**': { ssr: false },
    '/technician/**': { ssr: false },
    '/packages/**': { ssr: false },
    '/profile': { ssr: false },
  },

  typescript: {
    strict: false,
    typeCheck: false,
    shim: false,
  },

  app: {
    head: {
      title: 'OCN System',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'OCN CCTV & Networking Solutions - Sistem Manajemen Bisnis',
        },
        { name: 'theme-color', content: '#1e40af' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'OCN System',
      short_name: 'OCN',
      description: 'OCN CCTV & Networking Solutions - Sistem Manajemen Bisnis',
      theme_color: '#1e40af',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },
})
