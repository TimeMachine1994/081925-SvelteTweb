import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// POST - Webhook to receive Cloudflare Stream Live status updates
export const POST: RequestHandler = async ({ request }) => {
	console.log('🎬 [CLOUDFLARE WEBHOOK] Received stream status update');

	try {
		// Get raw body for signature verification
		const rawBody = await request.text();
		const signature = request.headers.get('cf-webhook-signature');
		
		// Verify webhook signature if secret is configured
		if (env.CLOUDFLARE_WEBHOOK_SECRET && signature) {
			const crypto = await import('crypto');
			const expectedSignature = crypto
				.createHmac('sha256', env.CLOUDFLARE_WEBHOOK_SECRET)
				.update(rawBody)
				.digest('hex');
			
			if (signature !== expectedSignature) {
				console.log('❌ [CLOUDFLARE WEBHOOK] Invalid signature');
				throw SvelteKitError(401, 'Invalid webhook signature');
			}
			console.log('✅ [CLOUDFLARE WEBHOOK] Signature verified');
		} else if (env.CLOUDFLARE_WEBHOOK_SECRET) {
			console.log('⚠️ [CLOUDFLARE WEBHOOK] No signature provided but secret configured');
		}

		const body = JSON.parse(rawBody);
		console.log('📡 [CLOUDFLARE WEBHOOK] Payload:', JSON.stringify(body, null, 2));

		// Handle both webhook formats:
		// Live Input: { name, text, data: { input_id, event_type, updated_at, ... }, ts }
		// Stream: { uid, readyToStream, status: { state }, meta, created, modified, ... }
		
		let streamId = null;
		let eventType = null;
		
		if (body.data && body.data.input_id && body.data.event_type) {
			// Live Input webhook format
			console.log('📡 [CLOUDFLARE WEBHOOK] Live Input webhook detected');
			streamId = body.data.input_id;
			eventType = body.data.event_type;
		} else if (body.uid && body.status) {
			// Stream webhook format
			console.log('📡 [CLOUDFLARE WEBHOOK] Stream webhook detected');
			streamId = body.uid;
			eventType = `stream.${body.status.state}`;
		} else {
			console.log('⚠️ [CLOUDFLARE WEBHOOK] Invalid payload format');
			console.log('📡 [CLOUDFLARE WEBHOOK] Received:', Object.keys(body));
			throw SvelteKitError(400, 'Invalid webhook payload');
		}

		// Find stream by cloudflareInputId OR cloudflareStreamId (handle both types)
		let streamsSnapshot = await adminDb
			.collection('streams')
			.where('cloudflareInputId', '==', streamId)
			.limit(1)
			.get();
		
		// If not found by inputId, try by streamId (for Stream webhooks)
		if (streamsSnapshot.empty) {
			streamsSnapshot = await adminDb
				.collection('streams')
				.where('cloudflareStreamId', '==', streamId)
				.limit(1)
				.get();
		}

		if (streamsSnapshot.empty) {
			console.log('❌ [CLOUDFLARE WEBHOOK] Stream not found for streamId:', streamId);
			// Return 200 to prevent Cloudflare from retrying
			return json({ success: true, message: 'Stream not found, ignoring' });
		}

		const streamDoc = streamsSnapshot.docs[0];
		const docId = streamDoc.id;

		// Handle Cloudflare event types
		switch (eventType) {
			case 'live_input.connected':
				// Live Input stream has started
				console.log('✅ [CLOUDFLARE WEBHOOK] Live Input connected:', docId);
				await adminDb.collection('streams').doc(docId).update({
					status: 'live',
					startedAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});
				break;

			case 'stream.ready':
				// Stream processing complete
				console.log('✅ [CLOUDFLARE WEBHOOK] Stream ready:', docId);
				await adminDb.collection('streams').doc(docId).update({
					status: 'ready',
					readyToStream: body.readyToStream || true,
					updatedAt: new Date().toISOString()
				});
				break;

			case 'live_input.disconnected':
				// Stream has stopped
				console.log('⏹️ [CLOUDFLARE WEBHOOK] Stream disconnected:', docId);
				await adminDb.collection('streams').doc(docId).update({
					status: 'completed',
					endedAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});
				break;

			case 'live_input.errored':
				// Stream encountered an error
				const errorInfo = body.data?.live_input_errored || {};
				console.log('❌ [CLOUDFLARE WEBHOOK] Stream error:', docId, errorInfo);
				await adminDb.collection('streams').doc(docId).update({
					status: 'error',
					updatedAt: new Date().toISOString(),
					errorCode: errorInfo.error?.code || 'UNKNOWN',
					errorMessage: errorInfo.error?.message || 'Stream error'
				});
				break;

			case 'stream.error':
				// Stream processing error
				console.log('❌ [CLOUDFLARE WEBHOOK] Stream processing error:', docId);
				await adminDb.collection('streams').doc(docId).update({
					status: 'error',
					updatedAt: new Date().toISOString(),
					errorCode: body.status?.errorReasonCode || 'UNKNOWN',
					errorMessage: body.status?.errorReasonText || 'Stream processing error'
				});
				break;

			default:
				console.log('⚠️ [CLOUDFLARE WEBHOOK] Unknown event type:', eventType);
		}

		return json({
			success: true,
			message: 'Stream status updated',
			streamId: docId,
			eventType
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
