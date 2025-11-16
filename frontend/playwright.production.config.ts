import { defineConfig, devices } from '@playwright/test';

/**
 * PRODUCTION SMOKE TEST CONFIGURATION
 * Runs critical path tests against live production
 * Safe for continuous monitoring - no data modifications
 */
export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/production-smoke.spec.ts', // Only run smoke tests
	timeout: 30 * 1000, // 30 seconds per test
	expect: {
		timeout: 10 * 1000
	},
	fullyParallel: true,
	forbidOnly: true, // Never allow .only in production tests
	retries: 2, // Retry failed tests twice
	workers: 2, // Limit parallel workers for production
	reporter: [
		['html', { outputFolder: 'playwright-report/production' }],
		['list'],
		['json', { outputFile: 'playwright-report/production-results.json' }]
	],
	use: {
		// Point to your production URL
		baseURL: process.env.PRODUCTION_URL || 'https://tributestream.com',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		// Add production-specific headers if needed
		extraHTTPHeaders: {
			'User-Agent': 'TributestreamSmokeTest/1.0'
		}
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'mobile',
			use: { ...devices['iPhone 12'] }
		}
	],
	// Don't start local server - testing production
	webServer: undefined
});
