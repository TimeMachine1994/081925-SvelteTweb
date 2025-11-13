import { adminDb } from '$lib/server/firebase';
import { json, error as svelteError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CLOUDFLARE_WEBHOOK_SECRET } from '$env/static/private';

/**
 * Verify Cloudflare webhook signature
 */
async function verifyWebhookSignature(
	request: Request,
	body: string
): Promise<boolean> {
	const signature = request.headers.get('Webhook-Signature');
	
	if (!signature) {
		console.log('⚠️ [CLOUDFLARE WEBHOOK] No signature header');
		return false;
	}

	// Parse signature header: time=1230811200,sig1=abc123...
	const parts = signature.split(',');
	const timeMatch = parts[0]?.match(/time=(\d+)/);
	const sig1Match = parts[1]?.match(/sig1=([a-f0-9]+)/);

	if (!timeMatch || !sig1Match) {
		console.log('❌ [CLOUDFLARE WEBHOOK] Invalid signature format');
		return false;
	}

	const timestamp = timeMatch[1];
	const receivedSig = sig1Match[1];

	// Check timestamp is recent (within 5 minutes)
	const currentTime = Math.floor(Date.now() / 1000);
	const timeDiff = currentTime - parseInt(timestamp);
	if (timeDiff > 300) {
		console.log('❌ [CLOUDFLARE WEBHOOK] Signature too old:', timeDiff, 'seconds');
		return false;
	}

	// Create signature source string: timestamp + "." + body
	const signatureSource = `${timestamp}.${body}`;

	// Compute HMAC-SHA256
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(CLOUDFLARE_WEBHOOK_SECRET),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);

	const signatureBytes = await crypto.subtle.sign(
		'HMAC',
		key,
		encoder.encode(signatureSource)
	);

	// Convert to hex string
	const expectedSig = Array.from(new Uint8Array(signatureBytes))
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');

	// Compare signatures (constant-time comparison would be better)
	const isValid = expectedSig === receivedSig;
	
	if (!isValid) {
		console.log('❌ [CLOUDFLARE WEBHOOK] Signature mismatch');
		console.log('Expected:', expectedSig);
		console.log('Received:', receivedSig);
	}

	return isValid;
}

/**
 * Cloudflare Stream Webhook Handler
 * Receives notifications when stream status changes (connected, live, disconnected, etc.)
 * 
 * For Live Inputs, Cloudflare sends webhooks for events like:
 * - video.live_input.connected - Encoder connected
 * - video.live_input.disconnected - Encoder disconnected
 * - video.live_input.ready - Live input ready
 */
export const POST: RequestHandler = async ({ request }) => {
	console.log('🔔 [CLOUDFLARE WEBHOOK] Received webhook');

	try {
		// Read body once for signature verification and processing
		const bodyText = await request.text();
		
		// Verify webhook signature if secret is configured
		if (CLOUDFLARE_WEBHOOK_SECRET) {
			const isValid = await verifyWebhookSignature(request, bodyText);
			if (!isValid) {
				throw svelteError(401, 'Invalid webhook signature');
			}
			console.log('✅ [CLOUDFLARE WEBHOOK] Signature verified');
		} else {
			console.log('⚠️ [CLOUDFLARE WEBHOOK] No webhook secret configured - skipping verification');
		}

		const payload = JSON.parse(bodyText);
		console.log('📦 [CLOUDFLARE WEBHOOK] Payload:', JSON.stringify(payload, null, 2));

		// Cloudflare Stream webhook payload structure
		const { uid, status, meta } = payload;

		if (!uid) {
			console.log('❌ [CLOUDFLARE WEBHOOK] No UID in payload');
			return json({ error: 'Missing UID' }, { status: 400 });
		}

		// Find stream by Cloudflare Input ID
		const streamsSnapshot = await adminDb
			.collection('streams')
			.where('streamCredentials.cloudflareInputId', '==', uid)
			.limit(1)
			.get();

		if (streamsSnapshot.empty) {
			console.log('❌ [CLOUDFLARE WEBHOOK] Stream not found for UID:', uid);
			return json({ error: 'Stream not found' }, { status: 404 });
		}

		const streamDoc = streamsSnapshot.docs[0];
		const streamData = streamDoc.data();
		
		console.log('✅ [CLOUDFLARE WEBHOOK] Found stream:', streamDoc.id);

		// Map Cloudflare status to our stream status
		let newStatus = streamData.status;
		let updates: any = {
			updatedAt: new Date().toISOString()
		};

		switch (status) {
			case 'connected':
			case 'live':
				// Stream is now live
				newStatus = 'live';
				updates.status = 'live';
				updates.liveStartedAt = streamData.liveStartedAt || new Date().toISOString();
				
				// Set playback URL for live stream
				// When Live Input goes live, it creates a video that can be played back
				// Extract video UID from webhook payload if available
				const videoUid = payload.liveInput?.uid || uid;
				
				if (!streamData.playbackUrl && videoUid) {
					// Use iframe player URL for the live stream
					updates.playbackUrl = `https://iframe.cloudflarestream.com/${videoUid}`;
					updates.embedUrl = `https://iframe.cloudflarestream.com/${videoUid}`;
					console.log('📺 [CLOUDFLARE WEBHOOK] Set playback URL:', updates.playbackUrl);
				}
				
				console.log('🔴 [CLOUDFLARE WEBHOOK] Stream going LIVE');
				break;

			case 'disconnected':
			case 'ended':
				// Stream has ended
				newStatus = 'completed';
				updates.status = 'completed';
				updates.liveEndedAt = new Date().toISOString();
				console.log('⚪ [CLOUDFLARE WEBHOOK] Stream ENDED');
				break;

			case 'ready':
				// Stream is ready but not yet live
				newStatus = 'ready';
				updates.status = 'ready';
				console.log('✅ [CLOUDFLARE WEBHOOK] Stream READY');
				break;

			case 'error':
				// Stream encountered an error
				newStatus = 'error';
				updates.status = 'error';
				updates.errorMessage = meta?.errorMessage || 'Unknown error';
				console.log('❌ [CLOUDFLARE WEBHOOK] Stream ERROR');
				break;

			default:
				console.log('⚠️ [CLOUDFLARE WEBHOOK] Unknown status:', status);
		}

		// Update stream document
		await streamDoc.ref.update(updates);
		console.log('💾 [CLOUDFLARE WEBHOOK] Stream updated:', streamDoc.id, 'Status:', newStatus);

		return json({
			success: true,
			streamId: streamDoc.id,
			status: newStatus
		});
	} catch (error: any) {
		console.error('❌ [CLOUDFLARE WEBHOOK] Error processing webhook:', error);
		return json(
			{
				error: 'Internal server error',
				message: error?.message
			},
			{ status: 500 }
		);
	}
};
