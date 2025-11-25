import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Update stream scheduled start time
 */
export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	console.log('📅 [SCHEDULE API] PATCH - Updating stream schedule:', params.streamId);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [SCHEDULE API] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const streamId = params.streamId;

	try {
		// Parse request body
		const { scheduledStartTime } = await request.json();

		if (!scheduledStartTime) {
			throw SvelteKitError(400, 'Scheduled start time is required');
		}

		// Validate date
		const startDate = new Date(scheduledStartTime);
		if (isNaN(startDate.getTime())) {
			throw SvelteKitError(400, 'Invalid date format');
		}

		console.log('📅 [SCHEDULE API] New scheduled time:', startDate.toISOString());

		// Get stream document
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			console.log('❌ [SCHEDULE API] Stream not found:', streamId);
			throw SvelteKitError(404, 'Stream not found');
		}

		const streamData = streamDoc.data()!;

		// Verify permissions
		const memorialDoc = await adminDb.collection('memorials').doc(streamData.memorialId).get();
		if (!memorialDoc.exists) {
			throw SvelteKitError(404, 'Event not found');
		}

		const event = memorialDoc.data()!;
		const hasPermission =
			locals.user.role === 'admin' ||
			event.ownerUid === userId ||
			event.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [SCHEDULE API] User lacks permission:', userId);
			throw SvelteKitError(403, 'Permission denied');
		}

		// Update stream schedule
		await streamDoc.ref.update({
			scheduledStartTime: startDate.toISOString(),
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [SCHEDULE API] Stream schedule updated');

		return json({
			success: true,
			streamId,
			scheduledStartTime: startDate.toISOString()
		});
	} catch (err: any) {
		console.error('❌ [SCHEDULE API] Error updating schedule:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw SvelteKitError(500, `Failed to update schedule: ${err?.message || 'Unknown error'}`);
	}
};
