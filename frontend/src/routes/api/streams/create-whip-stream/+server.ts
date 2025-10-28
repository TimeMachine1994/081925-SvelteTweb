import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	console.log('🎬 [WHIP-STREAM] Create WHIP stream request received');

	// Check authentication
	if (!locals.user) {
		console.log('❌ [WHIP-STREAM] Unauthorized request - no user');
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check if user has permission (admin or funeral director)
	if (locals.user.role !== 'admin' && locals.user.role !== 'funeral_director') {
		console.log(`❌ [WHIP-STREAM] Insufficient permissions - user role: ${locals.user.role}`);
		return json({ error: 'Insufficient permissions' }, { status: 403 });
	}

	try {
		const { title, description } = await request.json();
		console.log('📋 [WHIP-STREAM] Stream details:', { title, description });

		// Cloudflare Stream API credentials from environment
		const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
		const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

		if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
			console.log('❌ [WHIP-STREAM] Missing Cloudflare credentials in environment');
			return json({ error: 'Cloudflare credentials not configured' }, { status: 500 });
		}

		console.log('🔑 [WHIP-STREAM] Using Cloudflare credentials:', { 
			accountId: CLOUDFLARE_ACCOUNT_ID.slice(0, 8) + '...', 
			hasToken: !!CLOUDFLARE_API_TOKEN 
		});

		// Create Cloudflare Live Input for WHIP streaming
		const cloudflareResponse = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`,
			{
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					meta: {
						name: title || 'MUX Bridge Test Stream'
					},
					recording: {
						mode: 'automatic',
						timeoutSeconds: 10
					}
				})
			}
		);

		console.log('📡 [WHIP-STREAM] Cloudflare API response status:', cloudflareResponse.status);

		if (!cloudflareResponse.ok) {
			const errorText = await cloudflareResponse.text();
			console.log('❌ [WHIP-STREAM] Cloudflare API error response:', errorText);
			return json(
				{ error: `Cloudflare API error: ${cloudflareResponse.statusText}`, details: errorText },
				{ status: cloudflareResponse.status }
			);
		}

		const cloudflareData = await cloudflareResponse.json();
		console.log('📊 [WHIP-STREAM] Cloudflare Live Input created:', {
			uid: cloudflareData.result.uid,
			status: cloudflareData.result.status,
			hasWebRTC: !!cloudflareData.result.webRTC,
			hasRTMPS: !!cloudflareData.result.rtmps
		});

		// Extract WHIP URL from WebRTC configuration
		const webRTCConfig = cloudflareData.result.webRTC;
		const whipUrl = webRTCConfig?.url;

		if (!whipUrl) {
			console.log('❌ [WHIP-STREAM] No WHIP URL found in Cloudflare response');
			return json({ error: 'WHIP URL not available from Cloudflare' }, { status: 500 });
		}

		console.log('🔗 [WHIP-STREAM] WHIP URL extracted:', whipUrl);

		// Return stream information
		const streamInfo = {
			id: cloudflareData.result.uid,
			title: title || 'MUX Bridge Test Stream',
			description: description || 'Test stream for MUX bridge validation',
			status: cloudflareData.result.status,
			whipUrl: whipUrl,
			rtmpsUrl: cloudflareData.result.rtmps?.url,
			streamKey: cloudflareData.result.rtmps?.streamKey,
			createdAt: new Date().toISOString()
		};

		console.log('✅ [WHIP-STREAM] Stream created successfully:', {
			id: streamInfo.id,
			whipUrl: streamInfo.whipUrl?.slice(0, 50) + '...'
		});

		return json({
			success: true,
			stream: streamInfo
		});

	} catch (error) {
		console.error('❌ [WHIP-STREAM] Unexpected error:', error);
		return json(
			{ error: 'Internal server error', details: error.message },
			{ status: 500 }
		);
	}
};
