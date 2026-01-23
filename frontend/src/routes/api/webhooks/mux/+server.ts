/**
 * Mux Webhook Handler
 * 
 * Created: January 22, 2026
 * Handles all webhook events from Mux platform
 * 
 * Events handled:
 * - video.live_stream.active - Stream started broadcasting
 * - video.live_stream.idle - Stream stopped
 * - video.live_stream.disconnected - Stream disconnected
 * - video.asset.ready - Recording processed and ready
 * - video.asset.errored - Recording processing failed
 */

import { adminDb } from '$lib/server/firebase';
import { error as svelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyMuxWebhookSignature } from '$lib/server/mux';
import { env } from '$env/dynamic/private';

console.log('🔔 [MUX WEBHOOK] Webhook handler loaded and ready');

/**
 * POST - Handle Mux webhook events
 */
export const POST: RequestHandler = async ({ request }) => {
	console.log('🔔 [MUX WEBHOOK] ========================================');
	console.log('🔔 [MUX WEBHOOK] Incoming webhook request');
	console.log('🔔 [MUX WEBHOOK] Timestamp:', new Date().toISOString());

	try {
		// Get raw body and full headers for v12+ signature verification
		const body = await request.text();
		const headers = request.headers;

		console.log('🔔 [MUX WEBHOOK] Body length:', body.length);
		console.log('🔔 [MUX WEBHOOK] Has mux-signature header:', headers.has('mux-signature'));

		// Verify webhook signature (v12+ API uses full headers object)
		console.log('🔐 [MUX WEBHOOK] Verifying webhook signature...');
		
		if (!env.MUX_WEBHOOK_SECRET) {
			console.error('❌ [MUX WEBHOOK] MUX_WEBHOOK_SECRET not configured');
			throw svelteKitError(500, 'Webhook secret not configured');
		}
		
		const isValid = verifyMuxWebhookSignature(body, headers, env.MUX_WEBHOOK_SECRET);

		if (!isValid) {
			console.error('❌ [MUX WEBHOOK] Invalid webhook signature');
			console.error('❌ [MUX WEBHOOK] This may be a malicious request or secret mismatch');
			throw svelteKitError(401, 'Invalid webhook signature');
		}

		console.log('✅ [MUX WEBHOOK] Signature verified successfully');

		// Parse webhook event
		const event = JSON.parse(body);
		
		console.log('🔔 [MUX WEBHOOK] Event type:', event.type);
		console.log('🔔 [MUX WEBHOOK] Event ID:', event.id);
		console.log('🔔 [MUX WEBHOOK] Event created:', event.created_at);
		console.log('🔔 [MUX WEBHOOK] Event data:', JSON.stringify(event.data, null, 2));

		// Route to appropriate handler based on event type
		switch (event.type) {
			case 'video.live_stream.active':
				await handleStreamActive(event);
				break;

			case 'video.live_stream.idle':
			case 'video.live_stream.disconnected':
				await handleStreamEnded(event);
				break;

			case 'video.asset.ready':
				await handleRecordingReady(event);
				break;

			case 'video.asset.errored':
				await handleRecordingError(event);
				break;

			default:
				console.log('⚠️ [MUX WEBHOOK] Unhandled event type:', event.type);
				console.log('⚠️ [MUX WEBHOOK] Event will be acknowledged but not processed');
		}

		console.log('✅ [MUX WEBHOOK] Webhook processed successfully');
		console.log('🔔 [MUX WEBHOOK] ========================================');

		return json({ success: true, received: true });

	} catch (error: any) {
		console.error('❌ [MUX WEBHOOK] Error processing webhook:', error);
		console.error('❌ [MUX WEBHOOK] Error details:', {
			message: error?.message,
			stack: error?.stack
		});
		console.log('🔔 [MUX WEBHOOK] ========================================');

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteKitError(500, 'Webhook processing failed');
	}
};

/**
 * Handle stream going live
 */
async function handleStreamActive(event: any) {
	console.log('🔴 [MUX WEBHOOK] Processing STREAM ACTIVE event');
	
	const liveStreamId = event.data.id;
	console.log('🔴 [MUX WEBHOOK] Live stream ID:', liveStreamId);

	try {
		// Find stream by Mux live stream ID
		console.log('🔍 [MUX WEBHOOK] Searching for stream in Firestore...');
		const streamSnapshot = await adminDb
			.collection('streams')
			.where('mux.liveStreamId', '==', liveStreamId)
			.limit(1)
			.get();

		if (streamSnapshot.empty) {
			console.warn('⚠️ [MUX WEBHOOK] No stream found for live stream ID:', liveStreamId);
			console.warn('⚠️ [MUX WEBHOOK] This may be a test stream or orphaned webhook');
			return;
		}

		const streamDoc = streamSnapshot.docs[0];
		console.log('✅ [MUX WEBHOOK] Stream found:', streamDoc.id);
		console.log('🔴 [MUX WEBHOOK] Current status:', streamDoc.data().status);

		// Update stream to live status
		console.log('💾 [MUX WEBHOOK] Updating stream to LIVE status...');
		await streamDoc.ref.update({
			status: 'live',
			'mux.streamingStatus': 'active',
			liveStartedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [MUX WEBHOOK] Stream updated to LIVE');
		console.log('🔴 [MUX WEBHOOK] Stream:', streamDoc.id, 'is now broadcasting');

	} catch (error) {
		console.error('❌ [MUX WEBHOOK] Error handling stream active:', error);
		throw error;
	}
}

/**
 * Handle stream ending or disconnecting
 */
async function handleStreamEnded(event: any) {
	console.log('⏹️ [MUX WEBHOOK] Processing STREAM ENDED event');
	console.log('⏹️ [MUX WEBHOOK] Event type:', event.type);
	
	const liveStreamId = event.data.id;
	console.log('⏹️ [MUX WEBHOOK] Live stream ID:', liveStreamId);

	try {
		// Find stream by Mux live stream ID
		console.log('🔍 [MUX WEBHOOK] Searching for stream in Firestore...');
		const streamSnapshot = await adminDb
			.collection('streams')
			.where('mux.liveStreamId', '==', liveStreamId)
			.limit(1)
			.get();

		if (streamSnapshot.empty) {
			console.warn('⚠️ [MUX WEBHOOK] No stream found for live stream ID:', liveStreamId);
			return;
		}

		const streamDoc = streamSnapshot.docs[0];
		console.log('✅ [MUX WEBHOOK] Stream found:', streamDoc.id);

		// Update stream status
		const streamingStatus = event.type === 'video.live_stream.disconnected' ? 'disconnected' : 'idle';
		
		console.log('💾 [MUX WEBHOOK] Updating stream status...');
		await streamDoc.ref.update({
			status: 'ended',  // Mark as ended so UI shows recording section
			'mux.streamingStatus': streamingStatus,
			liveEndedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [MUX WEBHOOK] Stream updated');
		console.log('⏹️ [MUX WEBHOOK] Stream:', streamDoc.id, 'has ended');

	} catch (error) {
		console.error('❌ [MUX WEBHOOK] Error handling stream ended:', error);
		throw error;
	}
}

/**
 * Handle recording ready
 */
async function handleRecordingReady(event: any) {
	console.log('📼 [MUX WEBHOOK] Processing RECORDING READY event');
	
	const assetId = event.data.id;
	const liveStreamId = event.data.live_stream_id;
	
	console.log('📼 [MUX WEBHOOK] Asset ID:', assetId);
	console.log('📼 [MUX WEBHOOK] Original live stream ID:', liveStreamId);

	try {
		// Find stream by Mux live stream ID
		console.log('🔍 [MUX WEBHOOK] Searching for stream in Firestore...');
		const streamSnapshot = await adminDb
			.collection('streams')
			.where('mux.liveStreamId', '==', liveStreamId)
			.limit(1)
			.get();

		if (streamSnapshot.empty) {
			console.warn('⚠️ [MUX WEBHOOK] No stream found for live stream ID:', liveStreamId);
			return;
		}

		const streamDoc = streamSnapshot.docs[0];
		console.log('✅ [MUX WEBHOOK] Stream found:', streamDoc.id);

		// Extract playback ID and duration
		const playbackId = event.data.playback_ids?.[0]?.id;
		const duration = event.data.duration;

		console.log('📼 [MUX WEBHOOK] VOD Playback ID:', playbackId);
		console.log('📼 [MUX WEBHOOK] Duration:', duration, 'seconds');

		// Update stream with recording information
		console.log('💾 [MUX WEBHOOK] Updating stream with recording data...');
		await streamDoc.ref.update({
			status: 'completed',
			'mux.assetId': assetId,
			'mux.vodPlaybackId': playbackId,
			'mux.recordingReady': true,
			'mux.duration': duration,
			'chat.archived': true, // Archive chat when recording is ready
			recordingReady: true,  // Legacy field for backward compatibility
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [MUX WEBHOOK] Recording information saved');
		console.log('📼 [MUX WEBHOOK] Stream:', streamDoc.id, 'recording is ready for playback');

	} catch (error) {
		console.error('❌ [MUX WEBHOOK] Error handling recording ready:', error);
		throw error;
	}
}

/**
 * Handle recording error
 */
async function handleRecordingError(event: any) {
	console.log('❌ [MUX WEBHOOK] Processing RECORDING ERROR event');
	
	const assetId = event.data.id;
	const liveStreamId = event.data.live_stream_id;
	const errorMessage = event.data.errors?.messages?.[0] || 'Unknown error';
	
	console.log('❌ [MUX WEBHOOK] Asset ID:', assetId);
	console.log('❌ [MUX WEBHOOK] Live stream ID:', liveStreamId);
	console.log('❌ [MUX WEBHOOK] Error:', errorMessage);

	try {
		// Find stream by Mux live stream ID
		console.log('🔍 [MUX WEBHOOK] Searching for stream in Firestore...');
		const streamSnapshot = await adminDb
			.collection('streams')
			.where('mux.liveStreamId', '==', liveStreamId)
			.limit(1)
			.get();

		if (streamSnapshot.empty) {
			console.warn('⚠️ [MUX WEBHOOK] No stream found for live stream ID:', liveStreamId);
			return;
		}

		const streamDoc = streamSnapshot.docs[0];
		console.log('✅ [MUX WEBHOOK] Stream found:', streamDoc.id);

		// Update stream with error status
		console.log('💾 [MUX WEBHOOK] Updating stream with error status...');
		await streamDoc.ref.update({
			status: 'error',
			'mux.recordingReady': false,
			updatedAt: new Date().toISOString()
		});

		console.error('❌ [MUX WEBHOOK] Recording failed for stream:', streamDoc.id);
		console.error('❌ [MUX WEBHOOK] Error message:', errorMessage);

	} catch (error) {
		console.error('❌ [MUX WEBHOOK] Error handling recording error:', error);
		throw error;
	}
}
