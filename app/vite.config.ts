import {defineConfig} from 'vitest/config'
import {sveltekit} from '@sveltejs/kit/vite'
import {svelteTesting} from '@testing-library/svelte/vite'

export default defineConfig({
  plugins: [sveltekit(), svelteTesting()],
  build: {
    manifest: true,
    outDir: 'build',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.js'],
  },
})