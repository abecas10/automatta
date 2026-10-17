// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Cambia `site` cuando tengáis dominio propio (y también SITE_URL en src/config.ts).
export default defineConfig({
  site: 'https://automatta.vercel.app',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'auto' },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
});
