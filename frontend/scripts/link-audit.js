/**
 * LINK AUDIT CRAWLER
 *
 * Crawls a running instance of the site (local or production), follows every
 * internal link, and reports any link that returns a non-OK status.
 * External links are checked (HEAD, falling back to GET) but not crawled.
 *
 * Usage:
 *   node scripts/link-audit.js                              # crawls http://localhost:5173
 *   node scripts/link-audit.js https://www.tributestream.com
 *   node scripts/link-audit.js http://localhost:5173 --cookie "session=abc123"   # authenticated crawl (e.g. /admin)
 *   node scripts/link-audit.js https://www.tributestream.com --header "X-Crawler-Key: secret"  # Cloudflare WAF skip header
 *   node scripts/link-audit.js --max-pages 500 --skip-external
 *
 * Exit code is 1 if any broken links are found (CI-friendly).
 */

const args = process.argv.slice(2);
const baseUrl = args.find((a) => a.startsWith('http')) || 'http://localhost:5173';

function argValue(flag) {
	const i = args.indexOf(flag);
	return i !== -1 ? args[i + 1] : undefined;
}

const maxPages = parseInt(argValue('--max-pages') || '300', 10);
const cookie = argValue('--cookie');
const extraHeader = argValue('--header');
const skipExternal = args.includes('--skip-external');

const origin = new URL(baseUrl).origin;
const headers = { 'User-Agent': 'TributestreamLinkAudit/1.0' };
if (cookie) headers['Cookie'] = cookie;
if (extraHeader) {
	const [name, ...rest] = extraHeader.split(':');
	headers[name.trim()] = rest.join(':').trim();
}

/** Extract href/src values from an HTML string. */
function extractLinks(html) {
	const links = new Set();
	const re = /(?:href|src)\s*=\s*["']([^"'#]+)["']/gi;
	let m;
	while ((m = re.exec(html)) !== null) {
		const raw = m[1].trim();
		if (
			!raw ||
			raw.startsWith('mailto:') ||
			raw.startsWith('tel:') ||
			raw.startsWith('javascript:') ||
			raw.startsWith('data:') ||
			raw.startsWith('blob:')
		) {
			continue;
		}
		links.add(raw);
	}
	return [...links];
}

/** Normalize a URL: resolve against page, strip hash. */
function normalize(raw, pageUrl) {
	try {
		const url = new URL(raw, pageUrl);
		url.hash = '';
		return url.href;
	} catch {
		return null;
	}
}

const visited = new Set(); // internal pages crawled
const checked = new Map(); // url -> status (or 'ERROR: msg')
const broken = []; // { url, status, foundOn }
const queue = [{ url: origin + '/', foundOn: '(start)' }];

async function checkUrl(url, method = 'HEAD') {
	try {
		const res = await fetch(url, { method, headers, redirect: 'follow' });
		// Some servers reject HEAD; retry with GET
		if (method === 'HEAD' && (res.status === 405 || res.status === 403 || res.status === 501)) {
			return checkUrl(url, 'GET');
		}
		return res;
	} catch (err) {
		return { ok: false, status: `ERROR: ${err.message}` };
	}
}

async function crawl() {
	console.log(`\nLink audit starting at ${baseUrl} (max ${maxPages} pages)\n`);

	while (queue.length > 0 && visited.size < maxPages) {
		const { url, foundOn } = queue.shift();
		if (visited.has(url)) continue;
		visited.add(url);

		let res;
		try {
			res = await fetch(url, { headers, redirect: 'follow' });
		} catch (err) {
			checked.set(url, `ERROR: ${err.message}`);
			broken.push({ url, status: `ERROR: ${err.message}`, foundOn });
			continue;
		}

		checked.set(url, res.status);
		if (!res.ok) {
			broken.push({ url, status: res.status, foundOn });
			process.stdout.write('x');
			continue;
		}
		process.stdout.write('.');

		const contentType = res.headers.get('content-type') || '';
		if (!contentType.includes('text/html')) continue;

		const html = await res.text();
		for (const raw of extractLinks(html)) {
			const link = normalize(raw, url);
			if (!link || !link.startsWith('http')) continue;

			if (link.startsWith(origin)) {
				// Internal: crawl it (queue dedupe via visited check on dequeue)
				if (!visited.has(link)) queue.push({ url: link, foundOn: url });
			} else if (!skipExternal && !checked.has(link)) {
				// External: check once, don't crawl
				checked.set(link, 'pending');
				const extRes = await checkUrl(link);
				checked.set(link, extRes.status);
				if (!extRes.ok) {
					broken.push({ url: link, status: extRes.status, foundOn: url });
					process.stdout.write('X');
				}
			}
		}
	}

	// Report
	console.log('\n');
	console.log('='.repeat(70));
	console.log(`Pages crawled:   ${visited.size}`);
	console.log(`URLs checked:    ${checked.size}`);
	console.log(`Broken links:    ${broken.length}`);
	console.log('='.repeat(70));

	if (broken.length > 0) {
		console.log('\nBROKEN LINKS:\n');
		for (const b of broken) {
			console.log(`  [${b.status}] ${b.url}`);
			console.log(`          found on: ${b.foundOn}\n`);
		}
		process.exitCode = 1;
	} else {
		console.log('\nAll links OK.');
	}
}

crawl();
