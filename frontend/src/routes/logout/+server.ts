import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdminAuth } from '$lib/server/firebase';

export const GET: RequestHandler = async ({ cookies }) => {
	const sessionCookie = cookies.get('session');
	if (sessionCookie) {
		try {
			const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie);
			await getAdminAuth().revokeRefreshTokens(decodedClaims.sub);
		} catch (error) {
			// Session cookie is invalid or expired.
			// No further action needed.
		}
	}

	console.log('Logging out...');
	cookies.delete('session', { path: '/' });
	redirect(303, '/login');
};

export const POST: RequestHandler = async ({ cookies }) => {
	const sessionCookie = cookies.get('session');
	if (sessionCookie) {
		try {
			const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie);
			await getAdminAuth().revokeRefreshTokens(decodedClaims.sub);
		} catch (error) {
			// Session cookie is invalid or expired.
			// No further action needed.
		}
	}

	console.log('Logging out...');
	cookies.delete('session', { path: '/' });
	redirect(303, '/login');
};