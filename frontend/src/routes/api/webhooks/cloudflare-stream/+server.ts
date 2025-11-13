import { adminDb } from '$lib/server/firebase';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Cloudflare Stream Webhook Handler
 * Receives notifications when stream status changes (connected, live, disconnected, etc.)
 */
export const POST: RequestHandler = async ({ request }) => {
	console.log('🔔 [CLOUDFLARE WEBHOOK] Received webhook');

	try {
		const payload = await request.json();
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
				updates.liveStartedAt = updates.liveStartedAt || new Date().toISOString();
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
