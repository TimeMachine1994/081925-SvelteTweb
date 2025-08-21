import { adminAuth } from '$lib/server/firebase';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { idToken } = await request.json();

	try {
		const decodedToken = await adminAuth.verifyIdToken(idToken);
		const sessionCookie = await adminAuth.createSessionCookie(idToken, {
			expiresIn: 60 * 60 * 24 * 5 * 1000 // 5 days
		});

		cookies.set('session', sessionCookie, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 5
		});

		return json({ status: 'signedIn' });
	} catch (error) {
		console.error('Error verifying ID token or creating session cookie:', error);
		return json({ status: 'error', message: 'Failed to create session.' }, { status: 401 });
	}
};