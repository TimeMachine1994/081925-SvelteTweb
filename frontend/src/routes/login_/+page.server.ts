import { getAdminAuth } from '$lib/server/firebase';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		console.log('Starting login action for /login_...');
		const data = await request.formData();
		const idToken = data.get('idToken');

		if (typeof idToken !== 'string' || !idToken) {
			console.error('idToken is missing or not a string');
			return fail(400, { message: 'idToken is required' });
		}

		const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

		try {
			console.log('Creating session cookie for /login_...');
			const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });
			const options = { maxAge: expiresIn, httpOnly: true, secure: true, path: '/' };
			cookies.set('session', sessionCookie, options);
			console.log('Session cookie created and set successfully for /login_.');
		} catch (error: any) {
			console.error('❌ Session cookie creation failed for /login_:', error);
			console.error('  - Error code:', error.code);
			console.error('  - Error message:', error.message);
			return fail(401, { message: 'Could not create session cookie. Please try again.' });
		}

		console.log('Redirecting to /my-portal from /login_...');
		redirect(303, '/my-portal');
	}
};