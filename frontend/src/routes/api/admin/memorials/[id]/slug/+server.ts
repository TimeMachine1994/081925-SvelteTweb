import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { validateCustomSlug, checkSlugExists } from '$lib/utils/memorial-slug';

/**
 * POST - Change the URL slug (slug + fullSlug) for a memorial
 * Admin only endpoint
 */
export const POST: RequestHandler = async ({ params, locals, request }) => {
	// Check admin authentication
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}

	const memorialId = params.id;
	if (!memorialId) {
		throw error(400, 'Memorial ID required');
	}

	try {
		const { newSlug } = await request.json();

		if (typeof newSlug !== 'string') {
			throw error(400, 'newSlug must be a string');
		}

		const validation = validateCustomSlug(newSlug);
		if (!validation.isValid || !validation.cleanedSlug) {
			throw error(400, validation.error || 'Invalid slug');
		}

		const cleanedSlug = validation.cleanedSlug;

		// Check if memorial exists
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();
		const oldSlug = memorialData?.fullSlug || '';

		// No-op if the slug hasn't actually changed
		if (cleanedSlug === oldSlug) {
			return json({
				success: true,
				fullSlug: cleanedSlug,
				message: 'Slug unchanged'
			});
		}

		// Ensure the new slug isn't already used by a different memorial
		const exists = await checkSlugExists(cleanedSlug, memorialId);
		if (exists) {
			throw error(409, 'This slug is already in use by another memorial');
		}

		await adminDb.collection('memorials').doc(memorialId).update({
			slug: cleanedSlug,
			fullSlug: cleanedSlug,
			updatedAt: new Date()
		});

		// Log audit trail
		await adminDb.collection('auditLogs').add({
			action: 'UPDATE_SLUG',
			performedBy: locals.user.uid,
			performedByEmail: locals.user.email,
			targetId: memorialId,
			targetType: 'memorial',
			changes: {
				oldSlug,
				newSlug: cleanedSlug
			},
			timestamp: new Date()
		});

		return json({
			success: true,
			fullSlug: cleanedSlug,
			message: 'Slug updated successfully'
		});
	} catch (err: any) {
		console.error('Error updating memorial slug:', err);
		throw error(err.status || 500, err.message || 'Failed to update slug');
	}
};
