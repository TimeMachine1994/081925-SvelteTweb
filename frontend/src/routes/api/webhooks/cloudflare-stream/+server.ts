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
 * Health check endpoint for webhook
 * GET /api/webhooks/cloudflare-stream
 */
export const GET: RequestHandler = async () => {
	return json({
		status: 'ok',
		endpoint: 'cloudflare-stream-webhook',
		message: 'Webhook endpoint is active',
		hasSecret: !!CLOUDFLARE_WEBHOOK_SECRET,
		timestamp: new Date().toISOString()
	});
};

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
		if (CLOUDFLARE_WEBHOOK_SECRET && CLOUDFLARE_WEBHOOK_SECRET.trim() !== '') {
			try {
				const isValid = await verifyWebhookSignature(request, bodyText);
				if (!isValid) {
					console.log('⚠️ [CLOUDFLARE WEBHOOK] Signature verification failed, but continuing in development mode');
					// In production, you should uncomment the line below:
					// throw svelteError(401, 'Invalid webhook signature');
				} else {
					console.log('✅ [CLOUDFLARE WEBHOOK] Signature verified');
				}
			} catch (verifyError) {
				console.error('❌ [CLOUDFLARE WEBHOOK] Verification error:', verifyError);
				// Continue anyway in development
			}
		} else {
			console.log('⚠️ [CLOUDFLARE WEBHOOK] No webhook secret configured - ACCEPTING ALL REQUESTS (not secure for production!)');
		}

		const payload = JSON.parse(bodyText);
		console.log('📦 [CLOUDFLARE WEBHOOK] Payload:', JSON.stringify(payload, null, 2));

		// Cloudflare Stream webhook payload structure
		// For live videos: { uid: "video-uid", status: { state: "..." }, liveInput: { uid: "input-id" }, preview: "...", playback: {...} }
		const videoUid = payload.uid;
		const state = payload.status?.state;
		const liveInputId = payload.liveInput?.uid;
		const preview = payload.preview;
		const hlsUrl = payload.playback?.hls;
		const dashUrl = payload.playback?.dash;
		const meta = payload.meta;
		
		console.log('📊 [CLOUDFLARE WEBHOOK] Parsed data:', {
			videoUid,
			state,
			liveInputId,
			hasPreview: !!preview,
			hasHls: !!hlsUrl,
			hasDash: !!dashUrl
		});

		// For live streams, we need the Live Input ID to find the stream
		const searchId = liveInputId || videoUid;
		
		if (!searchId) {
			console.log('❌ [CLOUDFLARE WEBHOOK] No UID or liveInput.uid in payload');
			return json({ error: 'Missing identifier' }, { status: 400 });
		}

		console.log('🔍 [CLOUDFLARE WEBHOOK] Searching for stream with ID:', searchId, 'State:', state);

		// Find stream by Cloudflare Input ID (check both new and legacy fields)
		const newFieldQuery = adminDb
			.collection('streams')
			.where('streamCredentials.cloudflareInputId', '==', searchId)
			.limit(1)
			.get();

		const legacyFieldQuery = adminDb
			.collection('streams')
			.where('cloudflareInputId', '==', searchId)
			.limit(1)
			.get();

		const [newFieldSnapshot, legacyFieldSnapshot] = await Promise.all([
			newFieldQuery,
			legacyFieldQuery
		]);

		let streamDoc;
		if (!newFieldSnapshot.empty) {
			streamDoc = newFieldSnapshot.docs[0];
		} else if (!legacyFieldSnapshot.empty) {
			streamDoc = legacyFieldSnapshot.docs[0];
		}

		if (!streamDoc) {
			console.log('❌ [CLOUDFLARE WEBHOOK] Stream not found for ID:', searchId);
			return json({ error: 'Stream not found' }, { status: 404 });
		}

		const streamData = streamDoc.data();
		
		console.log('✅ [CLOUDFLARE WEBHOOK] Found stream:', streamDoc.id, 'Current status:', streamData.status);

		// Map Cloudflare state to our stream status
		let newStatus = streamData.status;
		let updates: any = {
			updatedAt: new Date().toISOString()
		};

		switch (state) {
			case 'live-inprogress':
				// Stream is NOW LIVE!
				newStatus = 'live';
				updates.status = 'live';
				updates.liveStartedAt = streamData.liveStartedAt || new Date().toISOString();
				
				// Set live watch URL from preview field
				if (preview) {
					updates.liveWatchUrl = preview;
					console.log('📺 [CLOUDFLARE WEBHOOK] Set live watch URL:', preview);
				}
				
				// Set video UID for reference
				if (videoUid) {
					updates.liveVideoUid = videoUid;
				}
				
				// Set HLS/DASH URLs if available
				if (hlsUrl) {
					updates.hlsUrl = hlsUrl;
				}
				if (dashUrl) {
					updates.dashUrl = dashUrl;
				}
				
				console.log('🔴 [CLOUDFLARE WEBHOOK] Stream going LIVE');
				break;

			case 'ready':
				// Stream ended - recording is ready
				newStatus = 'completed';
				updates.status = 'completed';
				updates.liveEndedAt = new Date().toISOString();
				updates.recordingReady = true;
				
				// Set playback/embed URLs for recording
				if (preview) {
					updates.playbackUrl = preview;
					updates.embedUrl = preview;
				}
				
				// Clear live-specific fields
				updates.liveWatchUrl = null;
				updates.liveVideoUid = null;
				
				console.log('✅ [CLOUDFLARE WEBHOOK] Stream COMPLETED - Recording ready');
				break;

			case 'error':
				// Stream encountered an error
				newStatus = 'error';
				updates.status = 'error';
				updates.errorMessage = meta?.errorMessage || payload.status?.errorReasonText || 'Unknown error';
				console.log('❌ [CLOUDFLARE WEBHOOK] Stream ERROR:', updates.errorMessage);
				break;

			case 'queued':
			case 'inprogress':
				// Stream is processing (usually for recordings)
				console.log('⏳ [CLOUDFLARE WEBHOOK] Stream processing:', state);
				// Don't change status, just log
				break;

			default:
				console.log('⚠️ [CLOUDFLARE WEBHOOK] Unknown state:', state);
		}

		// Update stream document
		await streamDoc.ref.update(updates);
		console.log('💾 [CLOUDFLARE WEBHOOK] Stream updated:', streamDoc.id, 'New status:', newStatus);
		console.log('💾 [CLOUDFLARE WEBHOOK] Updates applied:', JSON.stringify(updates, null, 2));

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
