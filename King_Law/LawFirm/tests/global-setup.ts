import { chromium } from '@playwright/test';

async function globalSetup() {
	console.log('🧪 Running global test setup...');

	const browser = await chromium.launch();
	const page = await browser.newPage();

	try {
		// Verify app is accessible
		await page.goto('http://localhost:4173/login', { timeout: 30000 });
		console.log('✅ App is accessible at http://localhost:4173');
	} catch (error) {
		console.error('❌ App is not accessible. Make sure to run: npm run build && npm run preview');
		throw error;
	}

	await browser.close();
	console.log('✅ Global setup complete\n');
}

export default globalSetup;
