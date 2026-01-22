import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createMuxLiveStream } from '$lib/server/mux';
import type { StreamArmType, StreamArmStatus, StreamCredentials } from '$lib/types/stream';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	console.log('🎯 [ARM API] POST - Arming stream:', params.streamId);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [ARM API] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const streamId = params.streamId;

	try {
		// Parse request body
		const { armType }: { armType: StreamArmType } = await request.json();

		if (!armType || !['mobile_input', 'mobile_streaming', 'stream_key'].includes(armType)) {
			throw SvelteKitError(400, 'Invalid arm type');
		}

		console.log(`🎯 [ARM API] Arm type: ${armType}`);

		// Get stream document
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			console.log('❌ [ARM API] Stream not found:', streamId);
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
			console.log('❌ [ARM API] User lacks permission:', userId);
			throw SvelteKitError(403, 'Permission denied');
		}

		// Create Mux Live Stream
		let credentials: StreamCredentials = {};
		let muxData: any = {};

		console.log('📡 [ARM API] Creating Mux Live Stream...');
		const muxStream = await createMuxLiveStream(streamData.title);

		// All arm types now use Mux RTMP
		credentials = {
			rtmpUrl: muxStream.rtmpUrl,
			streamKey: muxStream.streamKey
		};
		
		muxData = {
			liveStreamId: muxStream.id,
			playbackId: muxStream.playbackId,
			rtmpUrl: muxStream.rtmpUrl,
			streamKey: muxStream.streamKey,
			streamingStatus: 'idle'
		};

		console.log('✅ [ARM API] Mux credentials created');
		console.log('📺 [ARM API] RTMP URL:', muxStream.rtmpUrl);
		console.log('🔑 [ARM API] Stream Key:', muxStream.streamKey);

		// Create arm status
		const armStatus: StreamArmStatus = {
			isArmed: true,
			armType,
			armedAt: new Date().toISOString(),
			armedBy: userId
		};

		// Update stream document
		await streamDoc.ref.update({
			armStatus,
			streamCredentials: credentials,
			mux: muxData,
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [ARM API] Stream armed successfully');

		// Return updated stream
		const updatedStream = {
			id: streamId,
			...streamData,
			armStatus,
			streamCredentials: credentials
		};

		return json({
			success: true,
			stream: updatedStream
		});
	} catch (err: any) {
		console.error('❌ [ARM API] Error arming stream:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw SvelteKitError(500, `Failed to arm stream: ${err?.message || 'Unknown error'}`);
	}
};
