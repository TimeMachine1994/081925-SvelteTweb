// One-off script: injects a session cookie (grabbed from the user's real logged-in
// browser via DevTools) into a clean Playwright context, then screenshots the
// auth-gated pages that otherwise redirect to /login.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = 'http://localhost:5173';
const OUT_DIR = path.resolve('ui-renders');
const SESSION_COOKIE_VALUE = process.env.SESSION_COOKIE_VALUE;

if (!SESSION_COOKIE_VALUE) {
	console.error('Set SESSION_COOKIE_VALUE env var to the session cookie value.');
	process.exit(1);
}

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
	const browser = await chromium.launch({ channel: 'chrome' });
	const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

	await context.addCookies([
		{
			name: 'session',
			value: SESSION_COOKIE_VALUE,
			domain: 'localhost',
			path: '/',
			httpOnly: true,
			secure: false,
			sameSite: 'Lax'
		}
	]);

	const page = await context.newPage();

	// Sanity check: confirm we're actually authenticated before capturing everything.
	const check = await page.goto(`${BASE_URL}/profile`, { waitUntil: 'load', timeout: 20000 });
	await page.waitForTimeout(500);
	if (page.url().includes('/login')) {
		console.log('FAILED — cookie did not authenticate (still redirected to /login).');
		console.log('Check the cookie value/domain/path and try again.');
		await browser.close();
		return;
	}
	console.log(`Authenticated OK (status ${check?.status()}, landed on ${page.url()})`);

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

	await browser.close();
	console.log(`\nDone. ${results.filter((r) => r.ok).length}/${results.length} captured.`);

	const stillLogin = results.filter((r) => r.ok && r.finalUrl.includes('/login'));
	if (stillLogin.length) {
		console.log(`\nNote: ${stillLogin.length} route(s) still redirected to /login (likely role-restricted):`);
		stillLogin.forEach((r) => console.log(`  - ${r.urlPath}`));
	}
}

main();
