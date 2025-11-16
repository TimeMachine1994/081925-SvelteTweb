import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { getLiveInputVideos } from '$lib/server/cloudflare-stream';

/**
 * Check if a stream is actively broadcasting from OBS
 * Returns the watch URL if live
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	const { streamId } = params;

	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Get stream document
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			throw error(404, 'Stream not found');
		}

		const streamData = streamDoc.data();
		if (!streamData) {
			throw error(404, 'Stream data not found');
		}

		// Get the cloudflareInputId from either new or legacy structure
		const cloudflareInputId =
			streamData.streamCredentials?.cloudflareInputId ||
			streamData.cloudflareInputId;

		if (!cloudflareInputId) {
			return json({
				isLive: false,
				message: 'No Cloudflare Input ID found for this stream'
			});
		}

		console.log('🔍 [CHECK-LIVE] Checking stream:', streamId, 'Input ID:', cloudflareInputId);

		// Get videos from Cloudflare
		const { activeVideo } = await getLiveInputVideos(cloudflareInputId);

		if (activeVideo) {
			console.log('✅ [CHECK-LIVE] Stream is LIVE! Video UID:', activeVideo.uid);
			
			return json({
				isLive: true,
				watchUrl: activeVideo.preview,
				videoUid: activeVideo.uid,
				hlsUrl: activeVideo.hlsUrl,
				dashUrl: activeVideo.dashUrl
			});
		}

		console.log('📴 [CHECK-LIVE] Stream is NOT live');

		return json({
			isLive: false,
			message: 'No active broadcast detected'
		});
	} catch (err: any) {
		console.error('❌ [CHECK-LIVE] Error:', err);
		
		// If it's a Cloudflare API error, return more details
		if (err.message?.includes('Cloudflare API error')) {
			return json({
				isLive: false,
				error: err.message
			});
		}

		throw error(500, `Failed to check stream status: ${err.message}`);
	}
};
