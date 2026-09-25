// One-off script: launches the user's real default Chrome profile (so any existing
// login session carries over), and if not already logged in, waits for the user to
// log in manually. Then reuses that authenticated context to screenshot the
// auth-gated pages that otherwise redirect to /login.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = 'http://localhost:5173';
const OUT_DIR = path.resolve('ui-renders');
// A brand-new, throwaway Chrome profile — intentionally has none of the user's
// personal browsing data/cookies. They log in fresh with a tributestream account.
const CHROME_USER_DATA_DIR = 'C:\\temp-chrome-profile-clean';

const GATED_ROUTES = [
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
	['/admin/users/memorial-owners', 'admin-users-memorial-owners'],
	['/profile', 'profile'],
	['/profile/settings', 'profile-settings'],
	['/my-portal', 'my-portal'],
	['/funeral-director/dashboard', 'funeral-director-dashboard'],
	['/app/book', 'app-book'],
	['/payment', 'payment'],
	['/schedule', 'schedule'],
	['/register/funeral-director', 'register-funeral-director']
];

async function main() {
	await mkdir(OUT_DIR, { recursive: true });
	const context = await chromium.launchPersistentContext(CHROME_USER_DATA_DIR, {
		channel: 'chrome',
		headless: false,
		viewport: null,
		args: ['--start-maximized', '--window-position=0,0']
	});
	const page = context.pages()[0] ?? (await context.newPage());
	await page.bringToFront();

	console.log('Checking for an existing session on localhost:5173 ...');
	await page.goto(`${BASE_URL}/profile`, { waitUntil: 'load' });
	await page.waitForTimeout(1000);

	let cookies = await context.cookies();
	let hasSession = cookies.some((c) => c.name === 'session');

	if (!hasSession) {
		console.log('Not logged in yet. Please log in manually in the open Chrome window.');
		console.log('Waiting up to 10 minutes for a session cookie to appear...');
		const start = Date.now();
		let lastLog = 0;
		while (Date.now() - start < 10 * 60 * 1000) {
			cookies = await context.cookies();
			hasSession = cookies.some((c) => c.name === 'session');
			if (hasSession) break;
			const elapsed = Date.now() - start;
			if (elapsed - lastLog > 30000) {
				console.log(`...still waiting (${Math.round(elapsed / 1000)}s elapsed, current url: ${page.url()})`);
				lastLog = elapsed;
				await page.bringToFront().catch(() => {});
			}
			await page.waitForTimeout(2000);
		}
	}

	if (!hasSession) {
		console.log('TIMED OUT — no session cookie found. Closing without capturing gated pages.');
		await context.close();
		return;
	}

	console.log('Session found. Capturing gated pages...');
	const results = [];
	for (const [urlPath, fileName] of GATED_ROUTES) {
		const url = BASE_URL + urlPath;
		try {
			const response = await page.goto(url, { waitUntil: 'load', timeout: 20000 });
			await page.waitForTimeout(700);
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

	await context.close();
	console.log(`\nDone. ${results.filter((r) => r.ok).length}/${results.length} captured.`);

	const stillLogin = results.filter((r) => r.ok && r.finalUrl.includes('/login'));
	if (stillLogin.length) {
		console.log(`\nNote: ${stillLogin.length} route(s) still redirected to /login (likely role-restricted for this account):`);
		stillLogin.forEach((r) => console.log(`  - ${r.urlPath}`));
	}
}

main();
