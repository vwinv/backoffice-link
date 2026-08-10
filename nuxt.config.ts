// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'DropOne — Carte de visite digitale',
      htmlAttrs: { lang: 'fr' },
      meta: [
        {
          name: 'description',
          content:
            'DropOne — Connectez-vous. Partagez. Marquez les esprits. La carte de visite digitale pour particuliers et entreprises.',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/images/icone.png' },
        { rel: 'shortcut icon', type: 'image/png', href: '/images/icone.png' },
        { rel: 'apple-touch-icon', href: '/images/icone.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      // Surchargé automatiquement par NUXT_PUBLIC_API_BASE_URL
      apiBaseUrl: 'http://localhost:3000/api/v1',
    },
  },
})
