import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// POST - Webhook to receive Cloudflare Stream Live status updates
export const POST: RequestHandler = async ({ request }) => {
	console.log('🎬 [CLOUDFLARE WEBHOOK] Received stream status update');

	try {
		const body = await request.json();
		console.log('📡 [CLOUDFLARE WEBHOOK] Payload:', JSON.stringify(body, null, 2));

		// Cloudflare webhook format:
		// { name, text, data: { input_id, event_type, updated_at, ... }, ts }
		const { data } = body;
		
		if (!data || !data.input_id || !data.event_type) {
			console.log('⚠️ [CLOUDFLARE WEBHOOK] Invalid payload format');
			throw SvelteKitError(400, 'Invalid webhook payload');
		}

		const { input_id, event_type, updated_at } = data;

		// Find stream by cloudflareInputId
		const streamsSnapshot = await adminDb
			.collection('streams')
			.where('cloudflareInputId', '==', input_id)
			.limit(1)
			.get();

		if (streamsSnapshot.empty) {
			console.log('❌ [CLOUDFLARE WEBHOOK] Stream not found for input_id:', input_id);
			// Return 200 to prevent Cloudflare from retrying
			return json({ success: true, message: 'Stream not found, ignoring' });
		}

		const streamDoc = streamsSnapshot.docs[0];
		const streamId = streamDoc.id;

		// Handle Cloudflare event types
		switch (event_type) {
			case 'live_input.connected':
				// Stream has started
				console.log('✅ [CLOUDFLARE WEBHOOK] Stream connected:', streamId);
				await adminDb.collection('streams').doc(streamId).update({
					status: 'live',
					startedAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});
				break;

			case 'live_input.disconnected':
				// Stream has stopped
				console.log('⏹️ [CLOUDFLARE WEBHOOK] Stream disconnected:', streamId);
				await adminDb.collection('streams').doc(streamId).update({
					status: 'completed',
					endedAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});
				break;

			case 'live_input.errored':
				// Stream encountered an error
				const errorInfo = data.live_input_errored || {};
				console.log('❌ [CLOUDFLARE WEBHOOK] Stream error:', streamId, errorInfo);
				await adminDb.collection('streams').doc(streamId).update({
					status: 'error',
					updatedAt: new Date().toISOString(),
					errorCode: errorInfo.error?.code || 'UNKNOWN',
					errorMessage: errorInfo.error?.message || 'Stream error'
				});
				break;

			default:
				console.log('⚠️ [CLOUDFLARE WEBHOOK] Unknown event type:', event_type);
		}

		return json({
			success: true,
			message: 'Stream status updated',
			streamId,
			event_type
		});

	} catch (error: any) {
		console.error('❌ [STREAM WEBHOOK] Error processing webhook:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw SvelteKitError(500, 'Failed to process stream webhook');
	}
};

// GET - Health check endpoint
export const GET: RequestHandler = async () => {
	return json({
		status: 'ok',
		endpoint: 'stream-status-webhook',
		message: 'Webhook endpoint is active'
	});
};
