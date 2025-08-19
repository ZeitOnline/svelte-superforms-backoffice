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
    proxy: {
      '/api/eckchen': {
        target: 'http://localhost:3001',
        rewrite: path => path.replace(/^\/api\/eckchen/, ''),
      },
      '/api/wortiger': {
        target: 'http://localhost:3002',
        rewrite: path => path.replace(/^\/api\/wortiger/, ''),
      },
    },
  },
});
