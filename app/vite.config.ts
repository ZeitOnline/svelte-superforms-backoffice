import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import tailwindcss from '@tailwindcss/vite';

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
        target: 'http://localhost:3001',
        rewrite: path => path.replace(/^\/backoffice\/api\/eckchen/, ''),
      },
      '/backoffice/api/wortiger': {
        target: 'http://localhost:3002',
        rewrite: path => path.replace(/^\/backoffice\/api\/wortiger/, ''),
      },
      '/backoffice/api/spelling-bee': {
        target: 'http://localhost:3003',
        rewrite: path => path.replace(/^\/backoffice\/api\/spelling-bee/, ''),
      },
    },
  },
});
