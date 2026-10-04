import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hasPermission } from '$lib/admin/permissions';

function requireAdmin(locals: App.Locals) {
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}
	const adminUser = {
		uid: locals.user.uid,
		email: locals.user.email || '',
		adminRole: locals.user.adminRole
	};
	if (!hasPermission(adminUser, 'memorial', 'update')) {
		throw error(403, 'Insufficient permissions');
	}
}

// Strict allowlist checked before any outbound fetch — the whole point of
// this endpoint is to proxy a lookup for a single trusted provider, not to
// act as a general-purpose URL fetcher for admin-supplied input.
const ALLOWED_HOSTS = new Set(['vimeo.com', 'player.vimeo.com']);

const FETCH_TIMEOUT_MS = 10_000;

/**
 * GET /api/admin/video-thumbnail?url=<vimeo url>
 *
 * Resolves a Vimeo thumbnail via Vimeo's public oEmbed endpoint. Done
 * server-side (rather than fetched directly from the browser) so we don't
 * depend on Vimeo's CORS headers for the lookup itself — only the resulting
 * thumbnail image, which Vimeo serves with permissive CORS, is loaded
 * client-side.
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	requireAdmin(locals);

	const target = url.searchParams.get('url');
	if (!target) {
		throw error(400, 'url query parameter is required');
	}

	let parsed: URL;
	try {
		parsed = new URL(target);
	} catch {
		throw error(400, 'Invalid url');
	}

	const host = parsed.hostname.replace(/^www\./, '');
	if (!ALLOWED_HOSTS.has(host)) {
		throw error(400, 'Only vimeo.com URLs are supported');
	}

	const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(target)}`;

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

	try {
		const res = await fetch(oembedUrl, { signal: controller.signal });
		if (!res.ok) {
			throw error(502, `Vimeo lookup failed (${res.status})`);
		}

		const data = await res.json();
		const thumbnailUrl: string | undefined = data?.thumbnail_url;
		if (!thumbnailUrl) {
			throw error(502, 'Vimeo did not return a thumbnail');
		}

		return json({ thumbnailUrl });
	} catch (err: any) {
		if (err?.status) throw err;
		if (err?.name === 'AbortError') {
			throw error(504, 'Vimeo lookup timed out');
		}
		console.error('[video-thumbnail] Vimeo oEmbed lookup failed:', err);
		throw error(502, 'Failed to look up Vimeo thumbnail');
	} finally {
		clearTimeout(timeout);
	}
};
