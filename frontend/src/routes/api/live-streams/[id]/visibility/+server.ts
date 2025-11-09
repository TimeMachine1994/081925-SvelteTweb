// API: Update Stream Visibility
// POST /api/live-streams/:id/visibility
// Updates the visibility status (public, hidden, archived)

import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { LiveStream, LiveStreamResponse, UpdateVisibilityRequest } from '$lib/types/stream-v2';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const { id } = params;
	console.log('👁️ [API] POST /api/live-streams/:id/visibility:', id);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [API] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const userRole = locals.user.role;

	try {
		// Parse request body
		const body: UpdateVisibilityRequest = await request.json();
		const { visibility } = body;

		// Validate visibility value
		if (!visibility || !['public', 'hidden', 'archived'].includes(visibility)) {
			throw SvelteKitError(400, 'Invalid visibility value');
		}

		// Get stream document
		const streamRef = adminDb.collection('live_streams').doc(id);
		const streamDoc = await streamRef.get();

		if (!streamDoc.exists) {
			console.log('❌ [API] Stream not found:', id);
			throw SvelteKitError(404, 'Stream not found');
		}

		const stream = { id: streamDoc.id, ...streamDoc.data() } as LiveStream;

		// Verify memorial permissions
		const memorialDoc = await adminDb.collection('memorials').doc(stream.memorialId).get();

		if (!memorialDoc.exists) {
			throw SvelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;

		// Check permissions
		const hasPermission =
			userRole === 'admin' ||
			memorial.ownerUid === userId ||
			memorial.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [API] User lacks permission:', userId);
			throw SvelteKitError(403, 'Permission denied');
		}

		// Update visibility
		const updates: Partial<LiveStream> = {
			visibility,
			updatedAt: new Date().toISOString()
		};

		await streamRef.update(updates);

		console.log('✅ [API] Visibility updated:', id, '→', visibility);

		const updatedStream: LiveStream = {
			...stream,
			...updates
		};

		const response: LiveStreamResponse = {
			success: true,
			stream: updatedStream,
			message: `Stream visibility set to ${visibility}`
		};

		return json(response);
	} catch (error: any) {
		console.error('❌ [API] Error updating visibility:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw SvelteKitError(
			500,
			`Failed to update visibility: ${error?.message || 'Unknown error'}`
		);
	}
};
