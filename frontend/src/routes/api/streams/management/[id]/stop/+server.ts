import { adminAuth, adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Stream } from '$lib/types/stream';

// POST - Stop stream
export const POST: RequestHandler = async ({ locals, params }) => {
	console.log('🎬 [STREAM MANAGEMENT API] POST - Stopping stream:', params.id);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [STREAM MANAGEMENT API] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const streamId = params.id;

	try {
		// Fetch and verify stream exists
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			console.log('❌ [STREAM MANAGEMENT API] Stream not found:', streamId);
			throw SvelteKitError(404, 'Stream not found');
		}

		const streamData = streamDoc.data() as Stream;

		// Check permissions
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
			console.log('❌ [STREAM MANAGEMENT API] User lacks permission:', userId);
			throw SvelteKitError(403, 'Permission denied');
		}

		// Update stream status to completed
		await adminDb.collection('streams').doc(streamId).update({
			status: 'completed',
			endedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [STREAM MANAGEMENT API] Stream stopped:', streamId);

		return json({
			success: true,
			message: 'Stream stopped successfully',
			status: 'completed'
		});
	} catch (error: any) {
		console.error('❌ [STREAM MANAGEMENT API] Error stopping stream:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw SvelteKitError(500, 'Failed to stop stream');
	}
};
