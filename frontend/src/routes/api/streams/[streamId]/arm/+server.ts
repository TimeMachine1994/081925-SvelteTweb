import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createLiveInput } from '$lib/server/cloudflare-stream';
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

		// Create Cloudflare Live Input based on arm type
		let credentials: StreamCredentials = {};

		console.log('📡 [ARM API] Creating Cloudflare Live Input...');
		const liveInput = await createLiveInput(streamData.title);

		if (armType === 'mobile_input' || armType === 'mobile_streaming') {
			// WHIP-based streaming
			credentials = {
				whipUrl: liveInput.whipUrl,
				whepUrl: liveInput.whepUrl,
				cloudflareInputId: liveInput.liveInputId
			};
			console.log('✅ [ARM API] WHIP credentials created');
		} else if (armType === 'stream_key') {
			// RTMP-based streaming (OBS)
			// Cloudflare provides RTMP via Live Input as well
			const rtmpUrl = `rtmps://live.cloudflare.com:443/live/`;
			const streamKey = liveInput.liveInputId; // Using input ID as stream key

			credentials = {
				rtmpUrl,
				streamKey,
				cloudflareInputId: liveInput.liveInputId,
				whepUrl: liveInput.whepUrl // For playback
			};
			console.log('✅ [ARM API] RTMP credentials created');
		}

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
