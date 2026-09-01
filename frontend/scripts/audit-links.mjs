#!/usr/bin/env node
/**
 * Audit internal links against the SvelteKit route tree.
 *
 * Finds every static or template-literal navigation target (href=, goto(,
 * redirect(N,) in src/** and reports any that do not resolve to a route
 * defined under src/routes. Dynamic segments ([param]) match any value.
 *
 * Usage: npm run audit:links   (exit 1 if anything is missing)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../src/', import.meta.url));
const ROUTES = join(ROOT, 'routes');

function walk(dir, out = []) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) walk(p, out);
		else out.push(p);
	}
	return out;
}

// Build route matchers from +page.svelte / +server.ts files
const routePatterns = walk(ROUTES)
	.filter((f) => /\+(page\.svelte|server\.ts)$/.test(f))
	.map((f) => '/' + relative(ROUTES, f).split(sep).slice(0, -1).join('/'))
	.map((r) => (r === '/' ? '/' : r))
	.map((r) => {
		const escaped = r
			.split('/')
			.map((seg) => {
				if (/^\[\.\.\..+\]$/.test(seg)) return '.*';
				if (/^\[.+\]$/.test(seg)) return '[^/]+';
				if (/^\(.+\)$/.test(seg)) return ''; // route groups
				return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			})
			.filter((s) => s !== '')
			.join('/');
		return new RegExp('^/' + escaped + '/?$');
	});

const LINK_RE = /(?:href=|goto\(|redirect\(\s*\d+\s*,\s*)["'`](\/[^"'`\s]*)["'`]/g;
const problems = [];

for (const file of walk(ROOT).filter((f) => /\.(svelte|ts)$/.test(f) && !/\.test\.ts$/.test(f))) {
	const src = readFileSync(file, 'utf8');
	for (const m of src.matchAll(LINK_RE)) {
		let target = m[1].split(/[?#]/)[0];
		// Template literal / svelte interpolation -> wildcard segment
		// (an unclosed brace means the expression spanned lines; treat the rest as dynamic)
		target = target.replace(/\$?\{[^}]*\}?/g, '__DYN__');
		const probe = target.replace(/__DYN__/g, 'x');
		if (probe === '/' || probe === '') continue;
		if (!routePatterns.some((re) => re.test(probe))) {
			const line = src.slice(0, m.index).split('\n').length;
			problems.push(`${relative(ROOT, file)}:${line}  ${m[1]}`);
		}
	}
}

if (problems.length) {
	console.error(`\n${problems.length} link(s) point to non-existent routes:\n`);
	for (const p of problems) console.error('  ' + p);
	process.exit(1);
}
console.log('audit-links: all internal links resolve to routes.');
