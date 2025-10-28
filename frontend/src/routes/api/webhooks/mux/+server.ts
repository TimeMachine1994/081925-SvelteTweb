import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const MUX_WEBHOOK_SECRET = env.MUX_WEBHOOK_SECRET;

/**
 * Mux Webhook Endpoint
 * 
 * URL: /api/webhooks/mux
 * Purpose: Handle real-time events from Mux for bridge monitoring
 */
export const POST: RequestHandler = async ({ request }) => {
	console.log('🔔 [MUX_WEBHOOK] Received webhook from Mux');

	try {
		// Validate webhook signature (optional but recommended)
		if (MUX_WEBHOOK_SECRET) {
			const signature = request.headers.get('mux-signature');
			if (!signature) {
				console.warn('⚠️ [MUX_WEBHOOK] No signature provided');
				// Continue anyway for development - in production you might want to reject
			}
			// TODO: Implement signature verification if needed
			// For now, we'll trust the webhook since it's coming to a private endpoint
		}

		const webhook = await request.json();
		
		console.log('📋 [MUX_WEBHOOK] Event details:', {
			type: webhook.type,
			id: webhook.id,
			object: webhook.object,
			data: webhook.data?.id
		});

		// Handle different webhook events
		switch (webhook.type) {
			case 'video.live_stream.active':
				// Stream started
				await handleStreamStarted(webhook.data);
				break;
				
			case 'video.live_stream.idle':
				// Stream stopped
				await handleStreamStopped(webhook.data);
				break;
				
			case 'video.asset.ready':
				// Recording ready
				await handleRecordingReady(webhook.data);
				break;
				
			case 'video.live_stream.disconnected':
				// Connection issues
				await handleStreamDisconnected(webhook.data);
				break;
				
			case 'video.asset.errored':
				// Recording failed
				await handleRecordingError(webhook.data);
				break;
				
			default:
				console.log('ℹ️ [MUX_WEBHOOK] Unhandled event type:', webhook.type);
				break;
		}

		return json({ received: true });
	} catch (err) {
		console.error('❌ [MUX_WEBHOOK] Error processing webhook:', err);
		return json({ error: 'Webhook processing failed' }, { status: 500 });
	}
};

/**
 * Handle stream started event
 */
async function handleStreamStarted(liveStreamData: any) {
	try {
		console.log('🟢 [MUX_WEBHOOK] Stream started:', liveStreamData.id);

		// Find bridge by Mux stream ID
		const bridgeQuery = await adminDb
			.collection('mux_bridges')
			.where('muxLiveStreamId', '==', liveStreamData.id)
			.get();
			
		if (!bridgeQuery.empty) {
			const bridgeDoc = bridgeQuery.docs[0];
			await bridgeDoc.ref.update({
				status: 'active',
				startedAt: new Date().toISOString()
			});

			console.log('✅ [MUX_WEBHOOK] Bridge status updated to active:', bridgeDoc.id);
		} else {
			console.warn('⚠️ [MUX_WEBHOOK] No bridge found for stream:', liveStreamData.id);
		}
	} catch (error) {
		console.error('❌ [MUX_WEBHOOK] Error handling stream started:', error);
	}
}

/**
 * Handle stream stopped event
 */
async function handleStreamStopped(liveStreamData: any) {
	try {
		console.log('🔴 [MUX_WEBHOOK] Stream stopped:', liveStreamData.id);

		// Find bridge by Mux stream ID
		const bridgeQuery = await adminDb
			.collection('mux_bridges')
			.where('muxLiveStreamId', '==', liveStreamData.id)
			.get();
			
		if (!bridgeQuery.empty) {
			const bridgeDoc = bridgeQuery.docs[0];
			const bridge = bridgeDoc.data();

			// Only update if not already completed
			if (bridge?.status !== 'completed') {
				await bridgeDoc.ref.update({
					status: 'completed',
					completedAt: new Date().toISOString()
				});

				console.log('✅ [MUX_WEBHOOK] Bridge status updated to completed:', bridgeDoc.id);
			}
		} else {
			console.warn('⚠️ [MUX_WEBHOOK] No bridge found for stream:', liveStreamData.id);
		}
	} catch (error) {
		console.error('❌ [MUX_WEBHOOK] Error handling stream stopped:', error);
	}
}

/**
 * Handle recording ready event
 */
async function handleRecordingReady(assetData: any) {
	try {
		console.log('📹 [MUX_WEBHOOK] Recording ready:', assetData.id);

		// Find bridge by live stream ID
		const bridgeQuery = await adminDb
			.collection('mux_bridges')
			.where('muxLiveStreamId', '==', assetData.live_stream_id)
			.get();
			
		if (!bridgeQuery.empty) {
			const bridgeDoc = bridgeQuery.docs[0];
			const bridge = bridgeDoc.data();
			
			// Update bridge with recording info
			await bridgeDoc.ref.update({
				muxAssetId: assetData.id,
				recordingDuration: assetData.duration,
				recordingUrl: assetData.playback_ids?.[0]?.id ? 
					`https://stream.mux.com/${assetData.playback_ids[0].id}.mp4` : null
			});
			
			// Update the associated stream with recording details
			if (bridge?.streamId) {
				await adminDb.collection('streams').doc(bridge.streamId).update({
					hasRecording: true,
					muxAssetId: assetData.id,
					recordingDuration: assetData.duration,
					recordingUrl: assetData.playback_ids?.[0]?.id ? 
						`https://stream.mux.com/${assetData.playback_ids[0].id}.mp4` : null,
					recordingStatus: 'ready'
				});
			}

			console.log('✅ [MUX_WEBHOOK] Recording info updated:', {
				bridgeId: bridgeDoc.id,
				assetId: assetData.id,
				duration: assetData.duration
			});
		} else {
			console.warn('⚠️ [MUX_WEBHOOK] No bridge found for live stream:', assetData.live_stream_id);
		}
	} catch (error) {
		console.error('❌ [MUX_WEBHOOK] Error handling recording ready:', error);
	}
}

/**
 * Handle stream disconnected event
 */
async function handleStreamDisconnected(liveStreamData: any) {
	try {
		console.log('⚠️ [MUX_WEBHOOK] Stream disconnected:', liveStreamData.id);

		// Find bridge by Mux stream ID
		const bridgeQuery = await adminDb
			.collection('mux_bridges')
			.where('muxLiveStreamId', '==', liveStreamData.id)
			.get();
			
		if (!bridgeQuery.empty) {
			const bridgeDoc = bridgeQuery.docs[0];
			await bridgeDoc.ref.update({
				status: 'disconnected',
				lastError: 'Stream disconnected unexpectedly',
				updatedAt: new Date().toISOString()
			});

			console.log('✅ [MUX_WEBHOOK] Bridge status updated to disconnected:', bridgeDoc.id);
		} else {
			console.warn('⚠️ [MUX_WEBHOOK] No bridge found for stream:', liveStreamData.id);
		}
	} catch (error) {
		console.error('❌ [MUX_WEBHOOK] Error handling stream disconnected:', error);
	}
}

/**
 * Handle recording error event
 */
async function handleRecordingError(assetData: any) {
	try {
		console.log('❌ [MUX_WEBHOOK] Recording error:', assetData.id);

		// Find bridge by live stream ID
		const bridgeQuery = await adminDb
			.collection('mux_bridges')
			.where('muxLiveStreamId', '==', assetData.live_stream_id)
			.get();
			
		if (!bridgeQuery.empty) {
			const bridgeDoc = bridgeQuery.docs[0];
			const bridge = bridgeDoc.data();
			
			// Update bridge with error info
			await bridgeDoc.ref.update({
				recordingError: assetData.errors?.[0]?.message || 'Recording failed',
				updatedAt: new Date().toISOString()
			});
			
			// Update the associated stream
			if (bridge?.streamId) {
				await adminDb.collection('streams').doc(bridge.streamId).update({
					recordingStatus: 'error',
					recordingError: assetData.errors?.[0]?.message || 'Recording failed'
				});
			}

			console.log('✅ [MUX_WEBHOOK] Recording error info updated:', {
				bridgeId: bridgeDoc.id,
				assetId: assetData.id,
				error: assetData.errors?.[0]?.message
			});
		} else {
			console.warn('⚠️ [MUX_WEBHOOK] No bridge found for live stream:', assetData.live_stream_id);
		}
	} catch (error) {
		console.error('❌ [MUX_WEBHOOK] Error handling recording error:', error);
	}
}
