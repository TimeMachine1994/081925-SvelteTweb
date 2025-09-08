import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['src/routes/**/+*.test.ts'], // Only exclude SvelteKit page/layout tests
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    globals: true,
    testTimeout: 30000
  },
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib'),
      '$app/environment': path.resolve('./src/mocks/app/environment.js'),
      '$app/navigation': path.resolve('./src/mocks/app/navigation.js'),
      '$app/stores': path.resolve('./src/mocks/app/stores.js')
    }
  }
});
