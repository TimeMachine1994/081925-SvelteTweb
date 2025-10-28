import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { streamId } = params;
	console.log(`🗑️ [MUX-DELETE] Delete stream request for: ${streamId}`);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [MUX-DELETE] Unauthorized request - no user');
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check if user has permission (admin or funeral director)
	if (locals.user.role !== 'admin' && locals.user.role !== 'funeral_director') {
		console.log(`❌ [MUX-DELETE] Insufficient permissions - user role: ${locals.user.role}`);
		return json({ error: 'Insufficient permissions' }, { status: 403 });
	}

	try {
		// MUX API credentials from environment
		const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
		const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

		if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
			console.log('❌ [MUX-DELETE] Missing MUX credentials in environment');
			return json({ error: 'MUX credentials not configured' }, { status: 500 });
		}

		console.log('🔑 [MUX-DELETE] Using MUX credentials for stream deletion');

		// Delete MUX live stream
		const muxResponse = await fetch(`https://api.mux.com/video/v1/live-streams/${streamId}`, {
			method: 'DELETE',
			headers: {
				'Authorization': `Basic ${Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64')}`
			}
		});

		console.log('📡 [MUX-DELETE] MUX API response status:', muxResponse.status);

		if (!muxResponse.ok) {
			const errorText = await muxResponse.text();
			console.log('❌ [MUX-DELETE] MUX API error response:', errorText);
			return json(
				{ error: `MUX API error: ${muxResponse.statusText}`, details: errorText },
				{ status: muxResponse.status }
			);
		}

		console.log('✅ [MUX-DELETE] MUX stream deleted successfully');

		return json({ success: true, message: 'Stream deleted successfully' });

	} catch (error) {
		console.error('❌ [MUX-DELETE] Unexpected error:', error);
		return json(
			{ error: 'Internal server error', details: error.message },
			{ status: 500 }
		);
	}
};
