import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hasPermission } from '$lib/admin/permissions';
import { checkSlugExists, validateCustomSlug } from '$lib/utils/memorial-slug';

function requireAdmin(locals: App.Locals) {
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}
	const adminUser = {
		uid: locals.user.uid,
		email: locals.user.email || '',
		adminRole: locals.user.adminRole
	};
	if (!hasPermission(adminUser, 'memorial', 'read')) {
		throw error(403, 'Insufficient permissions');
	}
}

/**
 * GET /api/admin/memorials/[id]/slug/check?slug=...
 * Availability check used by the "Change URL" and "Add mirror link" forms
 * before enabling their submit buttons.
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
	requireAdmin(locals);
	const memorialId = params.id;
	const slug = url.searchParams.get('slug') || '';

	const validation = validateCustomSlug(slug);
	if (!validation.isValid || !validation.cleanedSlug) {
		return json({ available: false, cleanedSlug: null, error: validation.error });
	}

	const taken = await checkSlugExists(validation.cleanedSlug, memorialId);
	return json({ available: !taken, cleanedSlug: validation.cleanedSlug });
};
