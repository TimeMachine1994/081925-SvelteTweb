import { defineConfig } from 'vitest/config';
import path from 'path';

// Node-environment suite for repository/schema tests that hit a real SQLite file.
// Kept separate from vitest.config.ts, whose jsdom setup file is browser-oriented.
export default defineConfig({
	test: {
		include: ['tests/db/**/*.{test,spec}.ts', 'src/lib/server/db/**/*.{test,spec}.ts'],
		environment: 'node',
		globals: true,
		testTimeout: 30000
	},
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
			'$env/dynamic/private': path.resolve('./src/mocks/env/dynamic-private.js')
		}
	}
});
