import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import tailwindcss from '@tailwindcss/vite';

const POSTGREST_ECKCHEN_URL = 'http://localhost:3001';
const POSTGREST_WORTIGER_URL = 'http://localhost:3002';
const POSTGREST_SPELLING_BEE_URL = 'http://localhost:3003';
const POSTGREST_WORTGEFLECHT_URL = 'http://localhost:3004';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit(), svelteTesting()],
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
