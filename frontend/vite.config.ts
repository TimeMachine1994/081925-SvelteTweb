import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
	plugins: [tailwindcss(), sveltekit({
		// Disable type checking during development for faster builds
		typeCheck: mode === 'production'
	})],
	server: {
		allowedHosts: [
			'localhost',
			'127.0.0.1',
			'lenticularly-swingeing-aleisha.ngrok-free.dev',
			'.ngrok.io',
			'.ngrok-free.dev'
		]
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		setupFiles: ['./src/test-setup.ts'],
		globals: true
	},
	define: {
		// Ensure we have proper environment variables for tests
		'process.env.NODE_ENV': JSON.stringify(mode)
	}
}));
