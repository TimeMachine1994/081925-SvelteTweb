import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { env } from '$env/dynamic/private';
import crypto from 'crypto';

const MUX_WEBHOOK_SECRET = env.MUX_WEBHOOK_SECRET;

function verifyMuxSignature(rawBody: string, signature: string | null): boolean {
	if (!MUX_WEBHOOK_SECRET || !signature) {
		console.warn('⚠️ [MUX_WEBHOOK] No signature verification');
		return true;
	}

	const hmac = crypto.createHmac('sha256', MUX_WEBHOOK_SECRET);
	hmac.update(rawBody);
	const expectedSignature = hmac.digest('hex');

	return signature === expectedSignature;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const signature = request.headers.get('mux-signature');
		const rawBody = await request.text();

		if (!verifyMuxSignature(rawBody, signature)) {
			console.error('❌ [MUX_WEBHOOK] Invalid signature');
			return json({ error: 'Invalid signature' }, { status: 401 });
		}

		const event = JSON.parse(rawBody);
		console.log('🎬 [MUX_WEBHOOK] Received event:', event.type);

		switch (event.type) {
			case 'video.asset.ready': {
				const assetId = event.data.id;
				const playbackId = event.data.playback_ids?.[0]?.id;
				const liveStreamId = event.data.live_stream_id;

				console.log('✅ [MUX_WEBHOOK] Asset ready:', assetId);

				// Search in new live_streams collection
				const streamsSnapshot = await adminDb
					.collection('live_streams')
					.where('mux.liveStreamId', '==', liveStreamId)
					.limit(1)
					.get();

				if (streamsSnapshot.empty) {
					console.warn('⚠️ [MUX_WEBHOOK] No live_stream found for:', liveStreamId);
					// Fallback to old streams collection for backward compatibility
					const oldStreamsSnapshot = await adminDb
						.collection('streams')
						.where('muxLiveStreamId', '==', event.object.id)
						.limit(1)
						.get();

					if (!oldStreamsSnapshot.empty) {
						const streamDoc = oldStreamsSnapshot.docs[0];
						await streamDoc.ref.update({
							muxAssetId: assetId,
							muxAssetReady: true,
							muxPlaybackUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : undefined,
							'recordingSources.mux': {
								available: true,
								playbackUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : undefined,
								duration: event.data.duration
							},
							updatedAt: new Date().toISOString()
						});
						console.log('✅ [MUX_WEBHOOK] Legacy stream updated:', streamDoc.id);
					}
					return json({ success: true });
				}

				const streamDoc = streamsSnapshot.docs[0];

				await streamDoc.ref.update({
					'mux.assetId': assetId,
					'mux.playbackId': playbackId,
					status: 'completed',
					updatedAt: new Date().toISOString()
				});

				console.log('✅ [MUX_WEBHOOK] Live stream updated with asset:', streamDoc.id);
				break;
			}

			case 'video.live_stream.connected':
			case 'video.live_stream.active': {
				console.log('🔴 [MUX_WEBHOOK] Live stream started:', event.data.id);

				// Update status to live
				const streamsSnapshot = await adminDb
					.collection('live_streams')
					.where('mux.liveStreamId', '==', event.data.id)
					.limit(1)
					.get();

				if (!streamsSnapshot.empty) {
					const streamDoc = streamsSnapshot.docs[0];
					await streamDoc.ref.update({
						status: 'live',
						startedAt: new Date().toISOString(),
						updatedAt: new Date().toISOString()
					});
					console.log('✅ [MUX_WEBHOOK] Stream status → live:', streamDoc.id);
				}
				break;
			}

			case 'video.live_stream.disconnected':
			case 'video.live_stream.idle': {
				console.log('⚪ [MUX_WEBHOOK] Live stream stopped:', event.data.id);

				// Update status to completed (unless already completed)
				const streamsSnapshot = await adminDb
					.collection('live_streams')
					.where('mux.liveStreamId', '==', event.data.id)
					.limit(1)
					.get();

				if (!streamsSnapshot.empty) {
					const streamDoc = streamsSnapshot.docs[0];
					const streamData = streamDoc.data();
					
					if (streamData.status !== 'completed') {
						await streamDoc.ref.update({
							status: 'completed',
							endedAt: new Date().toISOString(),
							updatedAt: new Date().toISOString()
						});
						console.log('✅ [MUX_WEBHOOK] Stream status → completed:', streamDoc.id);
					}
				}
				break;
			}

			default:
				console.log('ℹ️ [MUX_WEBHOOK] Unhandled event:', event.type);
		}

		return json({ success: true });
	} catch (error) {
		console.error('❌ [MUX_WEBHOOK] Error:', error);
		return json({ error: 'Webhook processing failed' }, { status: 500 });
	}
};
