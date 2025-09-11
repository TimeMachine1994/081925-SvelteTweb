import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { requireLivestreamAccess, createMemorialRequest } from '$lib/server/memorialMiddleware';
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_CUSTOMER_CODE } from '$env/static/private';

/**
 * Creates a new WHIP (WebRTC-HTTP Ingestion Protocol) endpoint for mobile streaming.
 */
export const POST: RequestHandler = async ({ params, locals }) => {
	console.log('📱 WHIP endpoint creation request for memorial:', params.memorialId);

	try {
		const { memorialId } = params;

		// 1. Verify user has permission to livestream
		const memorialRequest = createMemorialRequest(memorialId, locals);
		await requireLivestreamAccess(memorialRequest);

		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}
		const memorial = memorialDoc.data();

		// 2. Create a new Live Input in Cloudflare Stream, which will provide a WHIP endpoint
		const cfResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				meta: { name: `${memorial?.lovedOneName} - Mobile Stream` },
				recording: { mode: 'automatic' }
			})
		});

		if (!cfResponse.ok) {
			const errorBody = await cfResponse.text();
			console.error(`Cloudflare API error: ${cfResponse.status} - ${errorBody}`);
			return json({ error: 'Failed to create WHIP endpoint', details: errorBody }, { status: 502 });
		}

		const cfData = await cfResponse.json();
		const liveInput = cfData.result;

		if (!liveInput.webRTC || !liveInput.webRTC.url) {
			console.error('Cloudflare API response did not include a WebRTC (WHIP) URL.', cfData);
			return json({ error: 'Failed to get a mobile stream URL from the provider. WebRTC might be disabled for your account.' }, { status: 502 });
		}

		const whipEndpoint = liveInput.webRTC.url;
		const playbackUrl = `https://customer-${CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com/${liveInput.uid}/iframe`;

		// 3. Update the memorial with the new WHIP stream details
		// This replaces any existing stream, as WHIP is now the active method
		if (!locals.user) {
			return json({ error: 'Authentication required.' }, { status: 401 });
		}
		await memorialRef.update({
			'livestream.isActive': true,
			'livestream.isMobileStream': true,
			'livestream.cloudflareId': liveInput.uid,
			'livestream.startedAt': new Date(),
			'livestream.startedBy': locals.user.uid,
			'livestream.playbackUrl': playbackUrl,
			// Clear RTMP details if they exist
			'livestream.streamUrl': null,
			'livestream.streamKey': null
		});

		console.log('✅ WHIP endpoint created and memorial updated:', liveInput.uid);

		// 4. Return the WHIP endpoint URL to the client
		return json({
			success: true,
			whipEndpoint: whipEndpoint,
			playbackUrl: playbackUrl
		});

	} catch (error) {
		console.error('💥 Error creating WHIP endpoint:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		if (errorMessage.includes('Permission denied')) {
			return json({ error: 'Permission denied to start livestream' }, { status: 403 });
		}
		return json({ error: 'Failed to create WHIP endpoint', details: errorMessage }, { status: 500 });
	}
};
