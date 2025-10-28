import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { streamId } = params;
	console.log(`🔍 [MUX-STATUS] Stream status request for: ${streamId}`);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [MUX-STATUS] Unauthorized request - no user');
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check if user has permission (admin or funeral director)
	if (locals.user.role !== 'admin' && locals.user.role !== 'funeral_director') {
		console.log(`❌ [MUX-STATUS] Insufficient permissions - user role: ${locals.user.role}`);
		return json({ error: 'Insufficient permissions' }, { status: 403 });
	}

	try {
		// MUX API credentials from environment
		const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
		const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

		if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
			console.log('❌ [MUX-STATUS] Missing MUX credentials in environment');
			return json({ error: 'MUX credentials not configured' }, { status: 500 });
		}

		console.log('🔑 [MUX-STATUS] Using MUX credentials for stream status check');

		// Get MUX live stream status
		const muxResponse = await fetch(`https://api.mux.com/video/v1/live-streams/${streamId}`, {
			method: 'GET',
			headers: {
				'Authorization': `Basic ${Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64')}`
			}
		});

		console.log('📡 [MUX-STATUS] MUX API response status:', muxResponse.status);

		if (!muxResponse.ok) {
			const errorText = await muxResponse.text();
			console.log('❌ [MUX-STATUS] MUX API error response:', errorText);
			return json(
				{ error: `MUX API error: ${muxResponse.statusText}`, details: errorText },
				{ status: muxResponse.status }
			);
		}

		const muxData = await muxResponse.json();
		console.log('📊 [MUX-STATUS] MUX stream status:', {
			id: muxData.data.id,
			status: muxData.data.status,
			recent_asset_ids: muxData.data.recent_asset_ids?.length || 0,
			created_at: muxData.data.created_at
		});

		return json(muxData);

	} catch (error) {
		console.error('❌ [MUX-STATUS] Unexpected error:', error);
		return json(
			{ error: 'Internal server error', details: error.message },
			{ status: 500 }
		);
	}
};
