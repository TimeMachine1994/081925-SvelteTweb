import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: [
			'src/lib/components/LivestreamArchive*.test.ts',
			'src/tests/livestream-archive.test.ts',
			'src/tests/integration/archive-api.test.ts'
		],
		environment: 'jsdom',
		setupFiles: ['src/lib/test-utils/setup.ts'],
		globals: true,
		coverage: {
			reporter: ['text', 'json', 'html'],
			include: [
				'src/lib/components/LivestreamArchive*.svelte',
				'src/routes/api/memorials/*/livestream/archive/**'
			]
		}
	}
});
