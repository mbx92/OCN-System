// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  tailwindcss: {
    configPath: 'tailwind.config.js',
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    public: {
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    }
  },

  nitro: {
    experimental: {
      asyncContext: true,
    },
  },
})
