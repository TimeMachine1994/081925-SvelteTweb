import { adminDb, FieldValue } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Update (or clear) a stream's scheduled start time.
 *
 * Body: { scheduledStartTime: string | null }
 * - A valid ISO/parseable date string sets the schedule.
 * - `null` (or an empty string) clears it.
 *
 * `status` is auto-synced between 'ready' <-> 'scheduled' only, so this never
 * clobbers 'live' / 'completed' / 'ended' / 'error' streams.
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
		const body = await request.json();
		const rawScheduledStartTime = body?.scheduledStartTime;
		const isClearing = rawScheduledStartTime === null || rawScheduledStartTime === '';

		let startDate: Date | null = null;
		if (!isClearing) {
			startDate = new Date(rawScheduledStartTime);
			if (isNaN(startDate.getTime())) {
				throw SvelteKitError(400, 'Invalid date format');
			}
		}

		console.log(
			'📅 [SCHEDULE API] New scheduled time:',
			isClearing ? 'cleared' : startDate!.toISOString()
		);

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
			throw SvelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;
		const hasPermission =
			locals.user.role === 'admin' ||
			memorial.ownerUid === userId ||
			memorial.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [SCHEDULE API] User lacks permission:', userId);
			throw SvelteKitError(403, 'Permission denied');
		}

		// Auto-sync status between 'ready' <-> 'scheduled' only; never touch
		// live/completed/ended/error streams.
		const currentStatus = streamData.status;
		const update: Record<string, unknown> = {
			updatedAt: new Date().toISOString()
		};

		if (isClearing) {
			update.scheduledStartTime = FieldValue.delete();
			if (currentStatus === 'scheduled') {
				update.status = 'ready';
			}
		} else {
			update.scheduledStartTime = startDate!.toISOString();
			if (currentStatus === 'ready' || currentStatus === 'scheduled') {
				update.status = 'scheduled';
			}
		}

		await streamDoc.ref.update(update);

		console.log('✅ [SCHEDULE API] Stream schedule updated');

		return json({
			success: true,
			streamId,
			scheduledStartTime: isClearing ? null : startDate!.toISOString(),
			status: update.status ?? currentStatus
		});
	} catch (err: any) {
		console.error('❌ [SCHEDULE API] Error updating schedule:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw SvelteKitError(500, `Failed to update schedule: ${err?.message || 'Unknown error'}`);
	}
};
