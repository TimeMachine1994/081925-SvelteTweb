import { adminAuth } from '$lib/server/firebase';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	console.log('[+layout.server.ts] Load function running...');
	const sessionCookie = cookies.get('session');

	if (!sessionCookie) {
		console.log('[+layout.server.ts] No session cookie found.');
		return {
			user: null
		};
	}

	try {
		console.log('[+layout.server.ts] Session cookie found, verifying...');
		const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
		console.log('[+layout.server.ts] Session cookie verified successfully for user:', decodedClaims.uid);
		return {
			user: {
				uid: decodedClaims.uid,
				email: decodedClaims.email
			}
		};
	} catch (error) {
		console.error('[+layout.server.ts] Error verifying session cookie:', error);
		// Session cookie is invalid.
		return {
			user: null
		};
	}
};