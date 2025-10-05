import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { streamId } = params;
	
	console.log('🎬 [WHIP] Generating WHIP URL for stream:', streamId);
	
	try {
		// Get the stream from database
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();
		
		if (!streamDoc.exists) {
			console.log('❌ [WHIP] Stream not found:', streamId);
			throw error(404, 'Stream not found');
		}
		
		const stream = streamDoc.data();
		console.log('📋 [WHIP] Stream data:', {
			id: streamId,
			title: stream?.title,
			status: stream?.status,
			cloudflareInputId: stream?.cloudflareInputId
		});
		
		if (!stream?.cloudflareInputId) {
			console.log('❌ [WHIP] No Cloudflare Input ID found for stream:', streamId);
			throw error(400, 'Stream not configured for live input');
		}
		
		// Get the actual WHIP URL from Cloudflare Live Input
		const liveInputUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${stream.cloudflareInputId}`;
		
		console.log('🔍 [WHIP] Fetching live input details from:', liveInputUrl);
		
		const liveInputResponse = await fetch(liveInputUrl, {
			headers: {
				'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
				'Content-Type': 'application/json'
			}
		});
		
		if (!liveInputResponse.ok) {
			console.error('❌ [WHIP] Failed to fetch live input details:', liveInputResponse.statusText);
			throw error(500, 'Failed to get live input details from Cloudflare');
		}
		
		const liveInputData = await liveInputResponse.json();
		console.log('📋 [WHIP] Live input data:', liveInputData);
		
		const whipUrl = liveInputData.result?.webRTC?.url;
		
		if (!whipUrl) {
			console.error('❌ [WHIP] No webRTC URL found in live input response');
			throw error(500, 'Live input does not have WebRTC enabled');
		}
		
		console.log('✅ [WHIP] Generated WHIP URL:', {
			streamId,
			cloudflareInputId: stream.cloudflareInputId,
			whipUrl
		});
		
		// Update stream status to indicate WHIP is being used
		await adminDb.collection('streams').doc(streamId).update({
			whipEnabled: true,
			whipGeneratedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});
		
		return json({
			success: true,
			whipUrl,
			streamId,
			cloudflareInputId: stream.cloudflareInputId,
			streamTitle: stream.title
			// Note: WHIP URLs are pre-authenticated, no auth token needed
		});
		
	} catch (err) {
		console.error('❌ [WHIP] Error generating WHIP URL:', err);
		
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		
		throw error(500, 'Failed to generate WHIP URL');
	}
};
