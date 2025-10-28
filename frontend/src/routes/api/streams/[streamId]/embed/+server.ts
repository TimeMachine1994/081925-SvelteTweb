import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { getEmbedCode } from '$lib/server/cloudflare-stream';
import type { RequestHandler } from './$types';

/**
 * Stream Embed URL Endpoint
 * 
 * URL: /api/streams/[streamId]/embed
 * Returns the Cloudflare Stream embed URL for a live stream
 */
export const GET: RequestHandler = async ({ params }) => {
	const { streamId } = params;

	console.log('🎬 [STREAM EMBED API] Getting embed URL for stream:', streamId);

	try {
		// Get the stream from database
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			console.log('❌ [STREAM EMBED API] Stream not found:', streamId);
			throw error(404, 'Stream not found');
		}

		const stream = streamDoc.data();
		console.log('📋 [STREAM EMBED API] Stream data:', {
			id: streamId,
			title: stream?.title,
			status: stream?.status,
			cloudflareInputId: stream?.cloudflareInputId
		});

		if (!stream?.cloudflareInputId) {
			console.log('❌ [STREAM EMBED API] No Cloudflare Input ID found for stream:', streamId);
			throw error(400, 'Stream not configured for live input');
		}

		// Only provide embed URL for live streams
		if (stream.status !== 'live') {
			console.log('❌ [STREAM EMBED API] Stream is not live:', stream.status);
			throw error(400, 'Stream must be live to get embed URL');
		}

		// Get the embed code from Cloudflare
		console.log('🔍 [STREAM EMBED API] Fetching embed code from Cloudflare...');
		const embedHtml = await getEmbedCode(stream.cloudflareInputId);

		// Extract the iframe src URL from the embed HTML
		const iframeSrcMatch = embedHtml.match(/src="([^"]+)"/);
		const embedUrl = iframeSrcMatch ? iframeSrcMatch[1] : null;

		if (!embedUrl) {
			console.error('❌ [STREAM EMBED API] Could not extract embed URL from HTML');
			throw error(500, 'Failed to extract embed URL');
		}

		console.log('✅ [STREAM EMBED API] Generated embed URL:', {
			streamId,
			cloudflareInputId: stream.cloudflareInputId,
			embedUrl
		});

		return json({
			success: true,
			embedUrl,
			streamId,
			cloudflareInputId: stream.cloudflareInputId,
			streamTitle: stream.title
		});
	} catch (err) {
		console.error('❌ [STREAM EMBED API] Error generating embed URL:', err);

		if (err instanceof Error && 'status' in err) {
			throw err;
		}

		throw error(500, 'Failed to generate embed URL');
	}
};
