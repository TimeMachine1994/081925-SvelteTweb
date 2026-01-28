import { chromium } from '@playwright/test';

async function globalTeardown() {
	console.log('\n🧹 Running global test cleanup...');

	const browser = await chromium.launch();
	const context = await browser.newContext();
	const page = await context.newPage();

	try {
		// Login as lawyer to get auth cookie
		await page.goto('http://localhost:4173/login');
		await page.fill('input[id="username"]', 'lawyer@test.com');
		await page.fill('input[id="password"]', 'TestPassword123!');
		await page.click('button[type="submit"]');
		await page.waitForURL('**/dashboard/lawyer', { timeout: 10000 });

		// Call cleanup API
		const response = await page.request.post('http://localhost:4173/api/admin/test-cleanup', {
			data: { prefix: 'E2E_TEST_' }
		});

		if (response.ok()) {
			const result = await response.json();
			console.log('✅ Cleanup result:', JSON.stringify(result.deleted));
		} else {
			console.warn('⚠️ Cleanup API returned:', response.status());
		}
	} catch (error) {
		console.warn('⚠️ Cleanup warning (non-fatal):', (error as Error).message);
	}

	await browser.close();
	console.log('✅ Global teardown complete');
}

export default globalTeardown;
