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
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: adapter({
      // default options are shown
      out: 'build',
      precompress: false,
      envPrefix: '',
    }),
  },
};

export default config;
