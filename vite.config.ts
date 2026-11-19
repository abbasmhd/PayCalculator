import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/PayCalculator/',
  plugins: [tailwindcss(), svelte()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
