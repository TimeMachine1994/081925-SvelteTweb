import { getAdminAuth } from '$lib/server/firebase';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	console.log('🚀 API POST /api/session: Creating session...');
	try {
		const { token, slug } = await request.json();
		console.log('🔑 Received token of length:', token.length);
		const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

		const decodedIdToken = await getAdminAuth().verifyIdToken(token, true);
		console.log('✅ Token verified for UID:', decodedIdToken.uid);

		// The ID token is verified. Now create a session cookie.
		console.log('🔐 Creating session cookie...');
		const sessionCookie = await getAdminAuth().createSessionCookie(token, { expiresIn });
		cookies.set('session', sessionCookie, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: expiresIn / 1000
		});
		console.log('🍪 Session cookie set successfully.');

		if (slug) {
			const redirectUrl = `/tributes/${slug}`;
			console.log(`✅ Slug provided, returning redirectUrl: ${redirectUrl}`);
			return json({ status: 'signedIn', redirectUrl });
		}

		return json({ status: 'signedIn' });
	} catch (e) {
		console.error('❌ API POST /api/session: Error creating session', JSON.stringify(e, null, 2));
		throw error(401, 'Could not create session.');
	}
};

export const DELETE: RequestHandler = async ({ cookies }) => {
	console.log('🚀 API DELETE /api/session: Deleting session...');
	try {
		cookies.delete('session', { path: '/' });
		console.log('🗑️ Session cookie deleted.');
		return json({ status: 'signedOut' });
	} catch (e) {
		console.error('❌ API DELETE /api/session: Error deleting session', e);
		throw error(401, 'Could not delete session.');
	}
};