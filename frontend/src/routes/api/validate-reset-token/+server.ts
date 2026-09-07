import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getToken } from '$lib/server/db/repos/passwordResetTokens';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { token } = await request.json();

		if (!token) {
			return json({ valid: false, error: 'Token is required' }, { status: 400 });
		}

		// Check if token exists and is valid
		const tokenData = await getToken(token);

		if (!tokenData) {
			return json({ valid: false, error: 'Invalid token' });
		}

		const now = new Date();

		// Check if token is expired or already used
		if (new Date(tokenData.expiresAt) < now) {
			return json({ valid: false, error: 'Token has expired' });
		}

		if (tokenData.used) {
			return json({ valid: false, error: 'Token has already been used' });
		}

		return json({ valid: true });
	} catch (error) {
		console.error('💥 Token validation error:', error);
		return json({ valid: false, error: 'Error validating token' }, { status: 500 });
	}
};
