import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST }) as any],
	test: {
		include: [
			'src/**/*.{test,spec}.{js,ts}',
			'tests/**/*.{test,spec}.{js,ts}',
			'test-utils/**/*.{test,spec}.{js,ts}'
		],
		exclude: [
			'src/routes/**/+*.test.ts',
			'e2e/**/*',
			'node_modules/**/*'
		],
		environment: 'jsdom',
		setupFiles: ['src/test-setup.ts'],
		globals: true,
		testTimeout: 30000,
		coverage: {
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'src/test-setup.ts',
				'test-utils/',
				'e2e/',
				'**/*.d.ts',
				'**/*.config.*',
				'src/mocks/',
				'src/app.html'
			],
			thresholds: {
				global: {
					branches: 70,
					functions: 70,
					lines: 70,
					statements: 70
				}
			}
		}
	},
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
			'$app/environment': path.resolve('./src/mocks/app/environment.js'),
			'$app/navigation': path.resolve('./src/mocks/app/navigation.js'),
			'$app/stores': path.resolve('./src/mocks/app/stores.js'),
			'$test-utils': path.resolve('./test-utils')
		}
	}
});
