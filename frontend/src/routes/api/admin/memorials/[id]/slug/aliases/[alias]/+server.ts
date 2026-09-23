import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, FieldValue } from '$lib/server/firebase';
import { hasPermission } from '$lib/admin/permissions';
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
 * DELETE /api/admin/memorials/[id]/slug/aliases/[alias]
 * Removes a mirror link — that URL will 404 afterwards; the primary URL
 * (and any other mirrors) are unaffected.
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	requireAdmin(locals);
	const memorialId = params.id;
	const alias = params.alias;
	if (!memorialId || !alias) throw error(400, 'Memorial ID and alias are required');

	try {
		const memorial = await getMemorial(memorialId);
		if (!memorial) throw error(404, 'Memorial not found');

		await updateMemorialFields(memorialId, {
			additionalSlugs: FieldValue.arrayRemove(alias)
		});

		await adminDb.collection('auditLogs').add({
			action: 'REMOVE_SLUG_ALIAS',
			performedBy: locals.user!.uid,
			performedByEmail: locals.user!.email,
			targetId: memorialId,
			targetType: 'memorial',
			changes: { alias },
			timestamp: new Date()
		});

		return json({ success: true });
	} catch (err: any) {
		if (err.status) throw err;
		console.error('[Slug Aliases API] Error removing alias:', err);
		throw error(500, err.message || 'Failed to remove mirror link');
	}
};
