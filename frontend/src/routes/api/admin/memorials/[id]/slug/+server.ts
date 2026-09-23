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
 * POST /api/admin/memorials/[id]/slug
 *
 * "Change URL" — sets a new primary fullSlug for the memorial. The previous
 * fullSlug is automatically kept as a mirror link (added to
 * additionalSlugs) so any link/QR code/obituary listing already pointing at
 * it keeps working. To fully retire the old link, remove it afterwards via
 * DELETE /api/admin/memorials/[id]/slug/aliases/[alias].
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	requireAdmin(locals);
	const memorialId = params.id;
	if (!memorialId) throw error(400, 'Memorial ID required');

	try {
		const { newSlug } = await request.json();
		if (!newSlug || typeof newSlug !== 'string') {
			throw error(400, 'newSlug is required');
		}

		const validation = validateCustomSlug(newSlug);
		if (!validation.isValid || !validation.cleanedSlug) {
			throw error(400, validation.error || 'Invalid slug');
		}
		const cleanedSlug = validation.cleanedSlug;

		const memorial = await getMemorial(memorialId);
		if (!memorial) throw error(404, 'Memorial not found');

		const currentSlug = memorial.fullSlug as string | undefined;
		if (cleanedSlug === currentSlug) {
			return json({
				success: true,
				fullSlug: cleanedSlug,
				message: 'No change — already the current URL'
			});
		}

		const taken = await checkSlugExists(cleanedSlug, memorialId);
		if (taken) {
			throw error(409, `The URL "${cleanedSlug}" is already in use by another memorial`);
		}

		await updateMemorialFields(memorialId, {
			fullSlug: cleanedSlug,
			slug: cleanedSlug,
			...(currentSlug && { additionalSlugs: FieldValue.arrayUnion(currentSlug) })
		});

		await adminDb.collection('auditLogs').add({
			action: 'UPDATE_MEMORIAL_SLUG',
			performedBy: locals.user!.uid,
			performedByEmail: locals.user!.email,
			targetId: memorialId,
			targetType: 'memorial',
			changes: { from: currentSlug || null, to: cleanedSlug },
			timestamp: new Date()
		});

		return json({
			success: true,
			fullSlug: cleanedSlug,
			previousSlugKeptAsMirror: currentSlug || null
		});
	} catch (err: any) {
		if (err.status) throw err;
		console.error('[Slug API] Error changing URL:', err);
		throw error(500, err.message || 'Failed to change URL');
	}
};
