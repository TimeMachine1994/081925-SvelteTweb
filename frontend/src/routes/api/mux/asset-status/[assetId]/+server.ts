import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { assetId } = params;
	console.log(`🎬 [MUX-ASSET] Asset status request for: ${assetId}`);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [MUX-ASSET] Unauthorized request - no user');
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check if user has permission (admin or funeral director)
	if (locals.user.role !== 'admin' && locals.user.role !== 'funeral_director') {
		console.log(`❌ [MUX-ASSET] Insufficient permissions - user role: ${locals.user.role}`);
		return json({ error: 'Insufficient permissions' }, { status: 403 });
	}

	try {
		// MUX API credentials from environment
		const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
		const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

		if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
			console.log('❌ [MUX-ASSET] Missing MUX credentials in environment');
			return json({ error: 'MUX credentials not configured' }, { status: 500 });
		}

		console.log('🔑 [MUX-ASSET] Using MUX credentials for asset status check');

		// Get MUX asset status
		const muxResponse = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
			method: 'GET',
			headers: {
				'Authorization': `Basic ${Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64')}`
			}
		});

		console.log('📡 [MUX-ASSET] MUX API response status:', muxResponse.status);

		if (!muxResponse.ok) {
			const errorText = await muxResponse.text();
			console.log('❌ [MUX-ASSET] MUX API error response:', errorText);
			return json(
				{ error: `MUX API error: ${muxResponse.statusText}`, details: errorText },
				{ status: muxResponse.status }
			);
		}

		const muxData = await muxResponse.json();
		console.log('📊 [MUX-ASSET] MUX asset status:', {
			id: muxData.data.id,
			status: muxData.data.status,
			duration: muxData.data.duration,
			playback_ids: muxData.data.playback_ids?.length || 0,
			created_at: muxData.data.created_at
		});

		return json(muxData);

	} catch (error) {
		console.error('❌ [MUX-ASSET] Unexpected error:', error);
		return json(
			{ error: 'Internal server error', details: error.message },
			{ status: 500 }
		);
	}
};
