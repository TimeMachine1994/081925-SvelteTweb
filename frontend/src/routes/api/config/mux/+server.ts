import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

/**
 * Mux Configuration Check Endpoint
 * 
 * URL: /api/config/mux
 * Purpose: Check if Mux integration is properly configured
 */
export const GET: RequestHandler = async ({ locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		return json({ configured: false, error: 'Authentication required' }, { status: 401 });
	}

	const MUX_TOKEN_ID = env.MUX_TOKEN_ID;
	const MUX_TOKEN_SECRET = env.MUX_TOKEN_SECRET;

	const isConfigured = !!(MUX_TOKEN_ID && MUX_TOKEN_SECRET);

	return json({
		configured: isConfigured,
		message: isConfigured 
			? 'Mux integration is properly configured'
			: 'Mux credentials are missing. Please add MUX_TOKEN_ID and MUX_TOKEN_SECRET to your .env file.',
		setupUrl: 'https://dashboard.mux.com/settings/access-tokens'
	});
};
