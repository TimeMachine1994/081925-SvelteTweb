import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { setupWHIPStreaming } from '$lib/server/streaming-methods';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const { memorialId, title, description, scheduledStartTime, enableMuxBackup } =
			await request.json();

		if (!memorialId || !title) {
			throw error(400, 'Missing required fields');
		}

		// Check user permission
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;
		const isAuthorized =
			locals.user.role === 'admin' ||
			memorial.ownerUid === locals.user.uid ||
			memorial.funeralDirectorUid === locals.user.uid;

		if (!isAuthorized) {
			throw error(403, 'Not authorized');
		}

		console.log('🎬 [API] Creating WHIP stream for memorial:', memorialId);

		// Setup WHIP streaming with dual recording
		const streamConfig = await setupWHIPStreaming(title, enableMuxBackup !== false);

		// Create stream document
		const streamData = {
			title,
			description: description || '',
			memorialId,
			status: 'ready',
			isVisible: true,
			streamingMethod: 'whip_browser',

			// Cloudflare
			cloudflareInputId: streamConfig.cloudflareInputId,
			whipUrl: streamConfig.whipUrl,
			playbackUrl: streamConfig.hlsPlaybackUrl,

			// Mux (optional)
			...(streamConfig.muxLiveStreamId && {
				muxLiveStreamId: streamConfig.muxLiveStreamId,
				muxStreamKey: streamConfig.muxStreamKey,
				muxPlaybackId: streamConfig.muxPlaybackId,
				cloudflareOutputId: streamConfig.cloudflareOutputId,
				simulcastEnabled: streamConfig.simulcastEnabled
			}),

			// Recording sources
			recordingSources: {
				cloudflare: {
					available: false,
					playbackUrl: undefined,
					duration: undefined
				},
				...(streamConfig.muxLiveStreamId && {
					mux: {
						available: false,
						playbackUrl: undefined,
						duration: undefined
					}
				})
			},
			preferredRecordingSource: 'cloudflare',

			// Scheduling
			...(scheduledStartTime && { scheduledStartTime }),

			// Metadata
			createdBy: locals.user.uid,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		const streamRef = await adminDb.collection('streams').add(streamData);
		const streamDoc = await streamRef.get();

		console.log('✅ [API] WHIP stream created:', streamRef.id);

		return json({
			success: true,
			stream: {
				id: streamRef.id,
				...streamDoc.data()
			}
		});
	} catch (err) {
		console.error('❌ [API] Failed to create WHIP stream:', err);

		if (err instanceof Error && 'status' in err) {
			throw err;
		}

		throw error(500, 'Failed to create stream');
	}
};
