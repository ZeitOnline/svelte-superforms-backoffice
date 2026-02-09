import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  hot: !process.env.VITEST, // disable hot module reload when tests are running
  preprocess: vitePreprocess(),
  kit: {
    alias: {
      $components: './src/components',
      $views: './src/views',
      $types: './src/types',
      $stores: './src/stores',
      $data: './src/data',
      $utils: './src/utils',
      $schemas: './src/schemas',
      $config: './src/config',
    },
    paths: {
      base: process.env.NODE_ENV === 'development' ? '/backoffice' : '',
    },
    adapter: adapter({
      // default options are shown
      out: 'build',
      precompress: false,
      envPrefix: '',
    }),
  },
};

export default config;
