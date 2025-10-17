import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { getLiveInput, getWHEPPlaybackURL } from '$lib/server/cloudflare-stream';
import type { RequestHandler } from './$types';

/**
 * WHEP (WebRTC-HTTP Egress Protocol) Endpoint
 *
 * This endpoint provides the WebRTC playback URL for a stream,
 * which can be used in OBS Browser Source to pull the live video
 * from Cloudflare Stream into OBS for further processing.
 * 
 * URL: /api/streams/playback/[streamId]/whep
 */
export const GET: RequestHandler = async ({ params }) => {
	const { streamId } = params;

	console.log('🎬 [STREAM PLAYBACK API] Getting WHEP playback URL for stream:', streamId);

	try {
		// Get the stream from database
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			console.log('❌ [STREAM PLAYBACK API] Stream not found:', streamId);
			throw error(404, 'Stream not found');
		}

		const stream = streamDoc.data();
		console.log('📋 [STREAM PLAYBACK API] Stream data:', {
			id: streamId,
			title: stream?.title,
			status: stream?.status,
			cloudflareInputId: stream?.cloudflareInputId
		});

		if (!stream?.cloudflareInputId) {
			console.log('❌ [STREAM PLAYBACK API] No Cloudflare Input ID found for stream:', streamId);
			throw error(400, 'Stream not configured for live input');
		}

		// Get the live input details from Cloudflare
		console.log('🔍 [STREAM PLAYBACK API] Fetching live input details from Cloudflare API');

		const liveInput = await getLiveInput(stream.cloudflareInputId);
		console.log('📋 [STREAM PLAYBACK API] Live input data:', {
			uid: liveInput.uid,
			hasWebRTC: !!liveInput.webRTC,
			hasWebRTCPlayback: !!liveInput.webRTCPlayback
		});

		// Extract the WHEP playback URL
		const whepUrl = getWHEPPlaybackURL(liveInput);

		if (!whepUrl) {
			console.error('❌ [STREAM PLAYBACK API] No webRTCPlayback URL found in live input response');
			console.error('Available URLs:', {
				webRTC: liveInput.webRTC?.url,
				rtmps: liveInput.rtmps?.url,
				rtmpsPlayback: liveInput.rtmpsPlayback?.url
			});
			throw error(500, 'Live input does not have WebRTC playback enabled');
		}

		console.log('✅ [STREAM PLAYBACK API] Generated WHEP playback URL:', {
			streamId,
			cloudflareInputId: stream.cloudflareInputId,
			whepUrl
		});

		// Update stream to track WHEP usage
		await adminDb.collection('streams').doc(streamId).update({
			whepEnabled: true,
			whepAccessedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});

		return json({
			success: true,
			whepUrl,
			streamId,
			cloudflareInputId: stream.cloudflareInputId,
			streamTitle: stream.title,
			streamStatus: stream.status,
			instructions: {
				obs: 'Use this URL in OBS Browser Source to pull the live stream',
				browserTest: 'Open this URL in a browser to test playback',
				latency: 'WebRTC provides <1 second latency'
			}
		});
	} catch (err) {
		console.error('❌ [STREAM PLAYBACK API] Error getting WHEP playback URL:', err);

		if (err instanceof Error && 'status' in err) {
			throw err;
		}

		throw error(500, 'Failed to get WHEP playback URL');
	}
};
