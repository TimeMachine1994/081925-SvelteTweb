import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { getLiveInput, getEmbedCode, extractEmbedIframeUrl } from '$lib/server/cloudflare-stream';
import type { RequestHandler } from './$types';

/**
 * Embed Stream Endpoint
 *
 * This endpoint provides the Cloudflare Stream embed script URL
 * that can be used in iframe src or script tags for embedding
 */
export const GET: RequestHandler = async ({ params }) => {
	const { streamId } = params;

	console.log('🚀 [EMBED_API] ===== STARTING EMBED URL GENERATION =====');
	console.log('📺 [EMBED_API] Getting embed URL for stream:', streamId);
	console.log('📺 [EMBED_API] Params received:', params);

	try {
		// Get the stream from database
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		console.log('🔍 [EMBED_API] Checking if stream document exists...');
		if (!streamDoc.exists) {
			console.log('❌ [EMBED_API] Stream not found in database:', streamId);
			return json(
				{
					success: false,
					error: 'Stream not found'
				},
				{ status: 404 }
			);
		}

		console.log('✅ [EMBED_API] Stream document found, extracting data...');
		const stream = streamDoc.data();
		console.log('📋 [EMBED_API] Full stream data:', JSON.stringify(stream, null, 2));
		console.log('📋 [EMBED_API] Key stream fields:', {
			id: streamId,
			title: stream?.title,
			status: stream?.status,
			cloudflareInputId: stream?.cloudflareInputId,
			hasCloudflareInputId: !!stream?.cloudflareInputId
		});

		console.log('🔍 [EMBED_API] Checking cloudflareInputId...');
		if (!stream?.cloudflareInputId) {
			console.log('❌ [EMBED_API] No Cloudflare Input ID found for stream:', streamId);
			console.log('❌ [EMBED_API] Stream cloudflareInputId value:', stream?.cloudflareInputId);
			return json(
				{
					success: false,
					error: 'Stream not configured for live input'
				},
				{ status: 400 }
			);
		}

		console.log('✅ [EMBED_API] CloudflareInputId found:', stream.cloudflareInputId);

		// Get the live input details from Cloudflare
		console.log('🔍 [EMBED_API] Fetching live input details from Cloudflare API...');
		console.log('🔍 [EMBED_API] Using cloudflareInputId:', stream.cloudflareInputId);

		const liveInput = await getLiveInput(stream.cloudflareInputId);
		console.log('📋 [EMBED_API] Live input response received');
		console.log('📋 [EMBED_API] Full live input data:', JSON.stringify(liveInput, null, 2));
		console.log('📋 [EMBED_API] Live input key fields:', {
			uid: liveInput.uid,
			hasUid: !!liveInput.uid
		});

		// For live inputs, construct the iframe URL directly
		console.log('🔍 [EMBED_API] Constructing live stream iframe URL...');
		console.log('🔍 [EMBED_API] Using live input UID:', liveInput.uid);

		// Use the same customer code as in HLS function
		const customerCode = 'dyz4fsbg86xy3krn';
		console.log('🔍 [EMBED_API] Using customer code:', customerCode);

		// Construct the iframe src URL for live input
		const iframeUrl = `https://customer-${customerCode}.cloudflarestream.com/${liveInput.uid}/iframe`;
		console.log('✅ [EMBED_API] Constructed live iframe URL:', iframeUrl);
		console.log('✅ [EMBED_API] Iframe URL length:', iframeUrl.length);

		console.log('✅ [EMBED_API] Successfully generated embed URLs!');
		console.log('✅ [EMBED_API] Final result:', {
			streamId,
			cloudflareInputId: stream.cloudflareInputId,
			uid: liveInput.uid,
			iframeUrl,
			iframeUrlLength: iframeUrl?.length
		});

		// Update stream to track embed usage
		await adminDb.collection('streams').doc(streamId).update({
			embedEnabled: true,
			embedAccessedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});

		console.log('🚀 [EMBED_API] Preparing successful response...');
		const responseData = {
			success: true,
			embedUrl: iframeUrl,
			streamId,
			cloudflareInputId: stream.cloudflareInputId,
			uid: liveInput.uid,
			streamTitle: stream.title,
			streamStatus: stream.status,
			instructions: {
				usage: 'Use the embedUrl as iframe src for embedding',
				format: 'This is a Cloudflare Stream live iframe URL',
				example: `<iframe src="${iframeUrl}" width="640" height="360" frameborder="0" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowfullscreen="true"></iframe>`
			}
		};
		console.log('🚀 [EMBED_API] Response data:', JSON.stringify(responseData, null, 2));
		return json(responseData);
	} catch (err) {
		console.error('❌ [EMBED_API] ===== ERROR IN EMBED URL GENERATION =====');
		console.error('❌ [EMBED_API] Error getting embed URL:', err);
		console.error('❌ [EMBED_API] Error type:', typeof err);
		console.error(
			'❌ [EMBED_API] Error message:',
			err instanceof Error ? err.message : 'Unknown error'
		);
		console.error(
			'❌ [EMBED_API] Error stack:',
			err instanceof Error ? err.stack : 'No stack trace'
		);

		return json(
			{
				success: false,
				error: err instanceof Error ? err.message : 'Failed to get embed URL'
			},
			{ status: 500 }
		);
	}
};
