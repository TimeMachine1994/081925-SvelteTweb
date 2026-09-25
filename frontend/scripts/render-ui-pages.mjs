// One-off script: capture full-page screenshots of every static (non-dynamic, non-auth-gated
// data) route in the app for UI reference purposes. Not part of the test suite.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.RENDER_BASE_URL || 'http://localhost:5173';
const OUT_DIR = process.env.RENDER_OUT_DIR || path.resolve('ui-renders');

// [urlPath, fileName]
const ROUTES = [
	['/', 'home'],
	['/how-it-works', 'how-it-works'],
	['/for-families', 'for-families'],
	['/for-funeral-directors', 'for-funeral-directors'],
	['/why-tributestream', 'why-tributestream'],
	['/pricing-breakdown', 'pricing-breakdown'],
	['/book-demo', 'book-demo'],
	['/contact', 'contact'],
	['/contact/confirmation', 'contact-confirmation'],
	['/contact/success', 'contact-success'],
	['/blog', 'blog'],
	['/partnership/basic-partnership', 'partnership-basic'],
	['/partnership/premium-partnership', 'partnership-premium'],
	['/login', 'login'],
	['/register', 'register'],
	['/register/funeral-director', 'register-funeral-director'],
	['/register/funeral-home', 'register-funeral-home'],
	['/register/loved-one', 'register-loved-one'],
	['/reset-password', 'reset-password'],
	['/email-confirmed', 'email-confirmed'],
	['/emergency', 'emergency'],
	['/search', 'search'],
	['/schedule', 'schedule'],
	['/schedule/new', 'schedule-new'],
	['/slideshow-generator', 'slideshow-generator'],
	['/profile', 'profile'],
	['/profile/settings', 'profile-settings'],
	['/my-portal', 'my-portal'],
	['/funeral-director/dashboard', 'funeral-director-dashboard'],
	['/app/book', 'app-book'],
	['/app/calculator', 'app-calculator'],
	['/app/checkout/success', 'app-checkout-success'],
	['/payment', 'payment'],
	['/payment/receipt', 'payment-receipt'],
	['/auth/login-with-token', 'auth-login-with-token'],
	['/auth/session', 'auth-session'],
	['/admin', 'admin-root'],
	['/admin/wiki', 'admin-wiki'],
	['/admin/wiki/new', 'admin-wiki-new'],
	['/admin/content/blog', 'admin-content-blog'],
	['/admin/content/blog/create', 'admin-content-blog-create'],
	['/admin/services/memorials', 'admin-services-memorials'],
	['/admin/services/memorials/create', 'admin-services-memorials-create'],
	['/admin/services/receipts', 'admin-services-receipts'],
	['/admin/services/recordings', 'admin-services-recordings'],
	['/admin/services/streams', 'admin-services-streams'],
	['/admin/system/audit-logs', 'admin-system-audit-logs'],
	['/admin/system/database', 'admin-system-database'],
	['/admin/system/email-logs', 'admin-system-email-logs'],
	['/admin/users/funeral-directors', 'admin-users-funeral-directors'],
	['/admin/users/memorial-owners', 'admin-users-memorial-owners']
];

async function main() {
	await mkdir(OUT_DIR, { recursive: true });
	const browser = await chromium.launch({ channel: 'chrome' });
	const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
	const page = await context.newPage();

	const results = [];

	for (const [urlPath, fileName] of ROUTES) {
		const url = BASE_URL + urlPath;
		try {
			const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
			await page.waitForTimeout(500); // let any client-side rendering settle
			const finalUrl = page.url();
			const status = response ? response.status() : null;
			const outFile = path.join(OUT_DIR, `${fileName}.png`);
			await page.screenshot({ path: outFile, fullPage: true });
			results.push({ urlPath, status, finalUrl, outFile, ok: true });
			console.log(`OK   ${urlPath}  (status ${status}, landed on ${finalUrl})`);
		} catch (err) {
			results.push({ urlPath, ok: false, error: String(err) });
			console.log(`FAIL ${urlPath}  -> ${err}`);
		}
	}

	await browser.close();

	const summaryPath = path.join(OUT_DIR, '_summary.json');
	await import('node:fs/promises').then((fs) =>
		fs.writeFile(summaryPath, JSON.stringify(results, null, 2))
	);
	console.log(`\nDone. ${results.filter((r) => r.ok).length}/${results.length} captured.`);
	console.log(`Screenshots + summary saved to: ${OUT_DIR}`);
}

main();
