// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './site.config.mjs';

// El dominio se cambia en site.config.mjs.
// Las páginas se generan como /pagina.html y vercel.json (cleanUrls) las sirve como /pagina.
export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  // Conserva los saltos de línea entre etiquetas: sin ellos, quien lee el texto plano
  // (Google, lectores de pantalla) ve palabras pegadas como "Cajadentro".
  compressHTML: false,
  build: { format: 'file', inlineStylesheets: 'auto' },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
});
