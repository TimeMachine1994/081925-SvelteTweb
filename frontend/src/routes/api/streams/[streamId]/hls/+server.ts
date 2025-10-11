import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { getLiveInput, getHLSPlaybackURL } from '$lib/server/cloudflare-stream';
import type { RequestHandler } from './$types';

/**
 * HLS Stream Endpoint for OBS
 *
 * This endpoint provides the direct HLS stream URL that OBS can consume
 * without needing JavaScript or WebRTC. This is much more reliable for OBS.
 */
export const GET: RequestHandler = async ({ params }) => {
	const { streamId } = params;

	console.log('📺 [HLS] Getting HLS stream URL for OBS:', streamId);

	try {
		// Get the stream from database
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			console.log('❌ [HLS] Stream not found:', streamId);
			return json(
				{
					success: false,
					error: 'Stream not found'
				},
				{ status: 404 }
			);
		}

		const stream = streamDoc.data();
		console.log('📋 [HLS] Stream data:', {
			id: streamId,
			title: stream?.title,
			status: stream?.status,
			cloudflareInputId: stream?.cloudflareInputId
		});

		if (!stream?.cloudflareInputId) {
			console.log('❌ [HLS] No Cloudflare Input ID found for stream:', streamId);
			return json(
				{
					success: false,
					error: 'Stream not configured for live input'
				},
				{ status: 400 }
			);
		}

		// Get the live input details from Cloudflare
		console.log('🔍 [HLS] Fetching live input details from Cloudflare API');

		const liveInput = await getLiveInput(stream.cloudflareInputId);
		console.log('📋 [HLS] Live input data:', {
			uid: liveInput.uid,
			hasRtmpsPlayback: !!liveInput.rtmpsPlayback,
			rtmpsPlaybackUrl: liveInput.rtmpsPlayback?.url
		});

		// Get the HLS playback URL using the imported function
		const hlsUrl = getHLSPlaybackURL(liveInput);

		if (!hlsUrl) {
			console.error('❌ [HLS] No HLS playback URL found in live input response');
			console.error('Available URLs:', {
				webRTC: liveInput.webRTC?.url,
				rtmps: liveInput.rtmps?.url,
				rtmpsPlayback: liveInput.rtmpsPlayback?.url
			});
			return json(
				{
					success: false,
					error: 'Live input does not have HLS playback URL'
				},
				{ status: 500 }
			);
		}

		console.log('✅ [HLS] Generated HLS stream URL:', {
			streamId,
			cloudflareInputId: stream.cloudflareInputId,
			hlsUrl
		});

		// Update stream to track HLS usage
		await adminDb.collection('streams').doc(streamId).update({
			hlsEnabled: true,
			hlsAccessedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});

		return json({
			success: true,
			hlsUrl,
			streamId,
			cloudflareInputId: stream.cloudflareInputId,
			streamTitle: stream.title,
			streamStatus: stream.status,
			instructions: {
				obs: 'Use this HLS URL directly in OBS Media Source',
				latency: 'HLS has 10-30 second latency but is very reliable',
				format: 'This is an HLS (.m3u8) stream URL'
			}
		});
	} catch (err) {
		console.error('❌ [HLS] Error getting HLS stream URL:', err);

		return json(
			{
				success: false,
				error: err instanceof Error ? err.message : 'Failed to get HLS stream URL'
			},
			{ status: 500 }
		);
	}
};
