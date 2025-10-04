import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://iharc.ca',
  integrations: [tailwind()],
  output: 'static',
  outDir: './dist',
  build: {
    assets: 'assets'
  },
  vite: {
    css: {
      postcss: './postcss.config.cjs'
    }
  }
});