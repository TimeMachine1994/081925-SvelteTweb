import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { getLiveInput, getEmbedCode, extractEmbedIframeUrl } from '$lib/server/cloudflare-stream';
import type { RequestHandler } from './$types';

/**
 * Embed Stream Endpoint
 *
 * This endpoint provides the Cloudflare Stream embed script URL
 * that can be used in iframe src or script tags for embedding
 * streams in external websites or applications.
 *
 * URL: /api/streams/playback/[streamId]/embed
 *
 * Returns:
 * - embedUrl: The Cloudflare Stream embed URL
 * - iframeUrl: Direct iframe URL for embedding
 * - streamStatus: Current status of the stream
 */

export const GET: RequestHandler = async ({ params }) => {
	const { streamId } = params;

	if (!streamId) {
		return json({ error: 'Stream ID is required' }, { status: 400 });
	}

	try {
		console.log('🎬 [STREAM PLAYBACK API] Getting embed info for stream:', streamId);

		// Get stream data from Firestore
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			console.log('❌ [STREAM PLAYBACK API] Stream not found:', streamId);
			return json({ error: 'Stream not found' }, { status: 404 });
		}

		const streamData = streamDoc.data()!;
		const { cloudflareInputId, status } = streamData;

		if (!cloudflareInputId) {
			console.log('❌ [STREAM PLAYBACK API] No Cloudflare input ID found for stream:', streamId);
			return json({ error: 'Stream not configured for playback' }, { status: 400 });
		}

		// Get embed information from Cloudflare
		const embedCode = await getEmbedCode(cloudflareInputId);
		const iframeUrl = extractEmbedIframeUrl(embedCode);

		console.log('✅ [STREAM PLAYBACK API] Embed info retrieved for stream:', streamId);

		return json({
			success: true,
			streamId,
			embedUrl: embedCode,
			iframeUrl,
			streamStatus: status,
			cloudflareInputId
		});
	} catch (error) {
		console.error('❌ [STREAM PLAYBACK API] Error getting embed info:', error);
		return json(
			{
				error: 'Failed to get embed information',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
