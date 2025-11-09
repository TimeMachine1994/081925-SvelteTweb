// API: Stop Live Stream
// POST /api/live-streams/:id/stop
// Marks a stream as completed and optionally disables outputs

import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { LiveStream, LiveStreamResponse } from '$lib/types/stream-v2';
import { disableLiveOutput } from '$lib/server/cloudflare-stream';

export const POST: RequestHandler = async ({ locals, params }) => {
	const { id } = params;
	console.log('🛑 [API] POST /api/live-streams/:id/stop:', id);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [API] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const userRole = locals.user.role;

	try {
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

		// Update stream status
		const updates: Partial<LiveStream> = {
			status: 'completed',
			endedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		await streamRef.update(updates);

		// Optionally disable Cloudflare Live Output
		if (stream.cloudflare.outputId) {
			try {
				console.log('⏸️ [API] Disabling Cloudflare output...');
				await disableLiveOutput(stream.cloudflare.liveInputId, stream.cloudflare.outputId);
			} catch (error) {
				console.warn('⚠️ [API] Failed to disable output, continuing:', error);
			}
		}

		console.log('✅ [API] Stream stopped:', id);

		const updatedStream: LiveStream = {
			...stream,
			...updates
		};

		const response: LiveStreamResponse = {
			success: true,
			stream: updatedStream,
			message: 'Stream stopped successfully'
		};

		return json(response);
	} catch (error: any) {
		console.error('❌ [API] Error stopping stream:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw SvelteKitError(500, `Failed to stop stream: ${error?.message || 'Unknown error'}`);
	}
};
