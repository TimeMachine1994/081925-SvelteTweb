import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth } from '$lib/server/firebase';

export const POST: RequestHandler = async ({ cookies }) => {
	const sessionCookie = cookies.get('session');
	if (sessionCookie) {
		try {
			const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
			await adminAuth.revokeRefreshTokens(decodedClaims.sub);
		} catch (error) {
			// Session cookie is invalid or expired.
			// No further action needed.
		}
	}

	console.log('Logging out...');
	cookies.delete('session', { path: '/' });
	redirect(303, '/login');
};