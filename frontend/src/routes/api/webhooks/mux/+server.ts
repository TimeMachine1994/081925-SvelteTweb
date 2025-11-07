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
				const duration = event.data.duration;

				console.log('✅ [MUX_WEBHOOK] Asset ready:', assetId);

				const streamsSnapshot = await adminDb
					.collection('streams')
					.where('muxLiveStreamId', '==', event.object.id)
					.limit(1)
					.get();

				if (streamsSnapshot.empty) {
					console.warn('⚠️ [MUX_WEBHOOK] No stream found for:', event.object.id);
					return json({ success: true, message: 'Stream not found' });
				}

				const streamDoc = streamsSnapshot.docs[0];

				await streamDoc.ref.update({
					muxAssetId: assetId,
					muxAssetReady: true,
					muxPlaybackUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : undefined,
					'recordingSources.mux': {
						available: true,
						playbackUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : undefined,
						duration: duration
					},
					updatedAt: new Date().toISOString()
				});

				console.log('✅ [MUX_WEBHOOK] Stream updated:', streamDoc.id);
				break;
			}

			case 'video.live_stream.active': {
				console.log('🔴 [MUX_WEBHOOK] Live stream started:', event.object.id);
				break;
			}

			case 'video.live_stream.idle': {
				console.log('⚪ [MUX_WEBHOOK] Live stream stopped:', event.object.id);
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
