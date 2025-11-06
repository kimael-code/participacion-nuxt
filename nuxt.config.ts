import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  modules: [
    'shadcn-nuxt',
    '@nuxt/eslint',
    '@nuxtjs/color-mode',
    '@vueuse/nuxt',
  ],
  colorMode: {
    classSuffix: '',
  },
  eslint: {
    // options here
  },
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "~/components/ui"
     */
    componentDir: '~/components/ui',
  },
});
