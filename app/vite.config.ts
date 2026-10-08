import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import tailwindcss from '@tailwindcss/vite';

const POSTGREST_ECKCHEN_URL = 'http://localhost:3001';
const POSTGREST_WORTIGER_URL = 'http://localhost:3002';
const POSTGREST_SPELLING_BEE_URL = 'http://localhost:3003';
const POSTGREST_WORTGEFLECHT_URL = 'http://localhost:3004';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      // Consult https://kit.svelte.dev/docs/integrations#preprocessors
      // for more information about preprocessors
      hot: !process.env.VITEST, // disable hot module reload when tests are running
      preprocess: vitePreprocess(),
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
    }),
    svelteTesting(),
  ],
  build: {
    manifest: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.js'],
  },
  server: {
    allowedHosts: [
      'localhost.staging.zeit.de',
    ],
    proxy: {
      '/backoffice/api/eckchen': {
        target: POSTGREST_ECKCHEN_URL,
        rewrite: path => path.replace(/^\/backoffice\/api\/eckchen/, ''),
      },
      '/backoffice/api/wortiger': {
        target: POSTGREST_WORTIGER_URL,
        rewrite: path => path.replace(/^\/backoffice\/api\/wortiger/, ''),
      },
      '/backoffice/api/spelling-bee': {
        target: POSTGREST_SPELLING_BEE_URL,
        rewrite: path => path.replace(/^\/backoffice\/api\/spelling-bee/, ''),
      },
      '/backoffice/api/wortgeflecht': {
        target: POSTGREST_WORTGEFLECHT_URL,
        rewrite: path => path.replace(/^\/backoffice\/api\/wortgeflecht/, ''),
      },
    },
  },
});
