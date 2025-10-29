import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const { uploadId } = params;

	try {
		const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
		const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

		if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
			return json({ error: 'MUX credentials not configured' }, { status: 500 });
		}

		// Check MUX Direct Upload status
		const response = await fetch(`https://api.mux.com/video/v1/uploads/${uploadId}`, {
			headers: {
				'Authorization': `Basic ${Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64')}`
			}
		});

		if (!response.ok) {
			console.error(`[MUX-UPLOAD] Failed to fetch upload ${uploadId}: ${response.status}`);
			return json({ error: 'Failed to fetch upload status' }, { status: response.status });
		}

		const uploadData = await response.json();
		console.log(`[MUX-UPLOAD] Upload ${uploadId} status:`, uploadData.data.status);

		return json(uploadData.data);
	} catch (error) {
		console.error(`[MUX-UPLOAD] Error checking upload ${uploadId}:`, error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
