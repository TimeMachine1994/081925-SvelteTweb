import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, FieldValue } from '$lib/server/firebase';
import { hasPermission } from '$lib/admin/permissions';
import { checkSlugExists, validateCustomSlug } from '$lib/utils/memorial-slug';
import { getMemorial, updateMemorialFields } from '$lib/server/db/repos/memorials';

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

/**
 * POST /api/admin/memorials/[id]/slug/aliases
 *
 * "Add mirror link" — adds a second URL that resolves to this memorial,
 * without changing the primary fullSlug. Both URLs work; the primary one
 * is what's used in `<link rel="canonical">` and outbound emails/shares.
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	requireAdmin(locals);
	const memorialId = params.id;
	if (!memorialId) throw error(400, 'Memorial ID required');

	try {
		const { alias } = await request.json();
		if (!alias || typeof alias !== 'string') {
			throw error(400, 'alias is required');
		}

		const validation = validateCustomSlug(alias);
		if (!validation.isValid || !validation.cleanedSlug) {
			throw error(400, validation.error || 'Invalid slug');
		}
		const cleanedAlias = validation.cleanedSlug;

		const memorial = await getMemorial(memorialId);
		if (!memorial) throw error(404, 'Memorial not found');

		if (cleanedAlias === memorial.fullSlug) {
			throw error(400, 'This is already the primary URL for this memorial');
		}

		const taken = await checkSlugExists(cleanedAlias, memorialId);
		if (taken) {
			throw error(409, `The URL "${cleanedAlias}" is already in use`);
		}

		await updateMemorialFields(memorialId, {
			additionalSlugs: FieldValue.arrayUnion(cleanedAlias)
		});

		await adminDb.collection('auditLogs').add({
			action: 'ADD_SLUG_ALIAS',
			performedBy: locals.user!.uid,
			performedByEmail: locals.user!.email,
			targetId: memorialId,
			targetType: 'memorial',
			changes: { alias: cleanedAlias },
			timestamp: new Date()
		});

		return json({ success: true, alias: cleanedAlias });
	} catch (err: any) {
		if (err.status) throw err;
		console.error('[Slug Aliases API] Error adding alias:', err);
		throw error(500, err.message || 'Failed to add mirror link');
	}
};
