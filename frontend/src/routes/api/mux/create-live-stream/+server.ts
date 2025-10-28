import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	console.log('🎬 [MUX-API] Create live stream request received');

	// Check authentication
	if (!locals.user) {
		console.log('❌ [MUX-API] Unauthorized request - no user');
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check if user has permission (admin or funeral director)
	if (locals.user.role !== 'admin' && locals.user.role !== 'funeral_director') {
		console.log(`❌ [MUX-API] Insufficient permissions - user role: ${locals.user.role}`);
		return json({ error: 'Insufficient permissions' }, { status: 403 });
	}

	try {
		const requestBody = await request.json();
		console.log('📋 [MUX-API] Request body:', requestBody);

		// MUX API credentials from environment
		const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
		const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

		if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
			console.log('❌ [MUX-API] Missing MUX credentials in environment');
			return json({ error: 'MUX credentials not configured' }, { status: 500 });
		}

		console.log('🔑 [MUX-API] Using MUX credentials:', { 
			tokenId: MUX_TOKEN_ID.slice(0, 8) + '...', 
			hasSecret: !!MUX_TOKEN_SECRET 
		});

		// Create MUX live stream
		const muxResponse = await fetch('https://api.mux.com/video/v1/live-streams', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Basic ${Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64')}`
			},
			body: JSON.stringify({
				playback_policy: ['public'],
				new_asset_settings: {
					playback_policy: ['public']
				},
				...requestBody
			})
		});

		console.log('📡 [MUX-API] MUX API response status:', muxResponse.status);

		if (!muxResponse.ok) {
			const errorText = await muxResponse.text();
			console.log('❌ [MUX-API] MUX API error response:', errorText);
			return json(
				{ error: `MUX API error: ${muxResponse.statusText}`, details: errorText },
				{ status: muxResponse.status }
			);
		}

		const muxData = await muxResponse.json();
		console.log('📊 [MUX-API] MUX stream created successfully:', {
			id: muxData.data.id,
			status: muxData.data.status,
			playback_ids: muxData.data.playback_ids?.length || 0
		});

		return json(muxData);

	} catch (error) {
		console.error('❌ [MUX-API] Unexpected error:', error);
		return json(
			{ error: 'Internal server error', details: error.message },
			{ status: 500 }
		);
	}
};
