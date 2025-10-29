import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
		const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

		console.log('[MUX-TEST] Testing MUX credentials...');
		console.log('[MUX-TEST] Token ID exists:', !!MUX_TOKEN_ID);
		console.log('[MUX-TEST] Token Secret exists:', !!MUX_TOKEN_SECRET);

		if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
			return json({ 
				success: false,
				error: 'MUX credentials not configured',
				hasTokenId: !!MUX_TOKEN_ID,
				hasTokenSecret: !!MUX_TOKEN_SECRET
			}, { status: 500 });
		}

		// Test credentials by listing assets (limit 1)
		const response = await fetch('https://api.mux.com/video/v1/assets?limit=1', {
			headers: {
				'Authorization': `Basic ${Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64')}`
			}
		});

		console.log('[MUX-TEST] MUX API response:', response.status);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[MUX-TEST] MUX API error:', errorText);
			return json({ 
				success: false,
				error: 'MUX API returned error',
				status: response.status,
				message: errorText
			}, { status: response.status });
		}

		const data = await response.json();
		console.log('[MUX-TEST] MUX API success, assets count:', data.data?.length || 0);

		return json({ 
			success: true,
			message: 'MUX credentials are valid',
			assetsCount: data.data?.length || 0
		});
	} catch (error) {
		console.error('[MUX-TEST] Error testing credentials:', error);
		return json({ 
			success: false,
			error: 'Internal server error',
			message: error.message
		}, { status: 500 });
	}
};
