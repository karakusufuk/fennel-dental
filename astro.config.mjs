import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://fennel.ufuk.ie',
  server: { port: 4401, host: '127.0.0.1' },
  output: 'static',
  compressHTML: true,
  build: { inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
});
