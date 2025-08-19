import { adminAuth } from '$lib/server/firebase';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	console.log('[api/session] POST request received to create session.');
	const { idToken } = await request.json();

	const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

	try {
		console.log('[api/session] Creating session cookie...');
		const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
		const options = { maxAge: expiresIn, httpOnly: true, secure: true, path: '/' };
		cookies.set('session', sessionCookie, options);
		console.log('[api/session] Session cookie created and set successfully.');

		return json({ status: 'signedIn' });
	} catch (error) {
		console.error('[api/session] Session cookie creation failed:', error);
		return json({ status: 'error', message: 'Could not create session cookie.' }, { status: 401 });
	}
};

export const DELETE: RequestHandler = async ({ cookies }) => {
	console.log('[api/session] DELETE request received to delete session.');
	cookies.delete('session', { path: '/' });
	console.log('[api/session] Session cookie deleted.');
	return json({ status: 'signedOut' });
};