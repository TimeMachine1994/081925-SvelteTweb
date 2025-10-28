import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

/**
 * Production Environment Check
 * 
 * URL: /api/debug/production-check
 * Purpose: Check if production environment variables are configured
 * NOTE: Remove this endpoint after debugging
 */
export const GET: RequestHandler = async ({ locals }) => {
	// Only allow authenticated users
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const MUX_TOKEN_ID = env.MUX_TOKEN_ID;
	const MUX_TOKEN_SECRET = env.MUX_TOKEN_SECRET;
	const CLOUDFLARE_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
	const CLOUDFLARE_API_TOKEN = env.CLOUDFLARE_API_TOKEN;

	return json({
		environment: 'production',
		timestamp: new Date().toISOString(),
		user: locals.user.uid,
		credentials_status: {
			MUX_TOKEN_ID: MUX_TOKEN_ID ? 'SET' : 'MISSING',
			MUX_TOKEN_SECRET: MUX_TOKEN_SECRET ? 'SET' : 'MISSING',
			CLOUDFLARE_ACCOUNT_ID: CLOUDFLARE_ACCOUNT_ID ? 'SET' : 'MISSING',
			CLOUDFLARE_API_TOKEN: CLOUDFLARE_API_TOKEN ? 'SET' : 'MISSING'
		},
		note: 'This is a temporary debug endpoint - remove after fixing credentials'
	});
};
