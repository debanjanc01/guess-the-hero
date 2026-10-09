import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { runtimeHeroes } from './src/runtime-heroes.js';

export default defineConfig({
  // GitHub Pages keeps its existing subpath. Cloudflare builds opt into '/'.
  base: process.env.VITE_BASE_PATH || '/guess-the-hero/',
  plugins: [
    {
      name: 'compact-hero-runtime-data',
      enforce: 'pre',
      transform(source, id) {
        if (id.split('?')[0].endsWith('/src/data/heroes.json')) {
          return { code: JSON.stringify(runtimeHeroes(JSON.parse(source))), map: null };
        }
      },
    },
    react(), tailwindcss(),
  ],
});
