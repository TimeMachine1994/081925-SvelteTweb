import { chromium } from '@playwright/test';
import path from 'node:path';

const OUT_DIR = path.resolve('ui-renders');

async function main() {
	const browser = await chromium.launch({ channel: 'chrome' });
	const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
	await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 30000 });
	await page.waitForTimeout(1500);
	await page.screenshot({ path: path.join(OUT_DIR, 'home.png'), fullPage: true });
	console.log('OK home');
	await browser.close();
}

main();
