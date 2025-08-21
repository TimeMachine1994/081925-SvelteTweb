import { adminAuth, adminDb } from '$lib/server/firebase';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	register: async ({ request }) => {
		console.log('[+page.server.ts] Register action started.');
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		if (!email || !password) {
			console.error('[+page.server.ts] Missing email or password.');
			return fail(400, {
				message: 'Email and password are required'
			});
		}

		try {
			console.log(`[+page.server.ts] Attempting to create user: ${email}`);
			const userRecord = await adminAuth.createUser({
				email: email.toString(),
				password: password.toString()
			});

			const userDocRef = adminDb.collection('users').doc(userRecord.uid);
			await userDocRef.set({
				email: userRecord.email,
				createdAt: new Date().toISOString()
			});

			console.log(`[+page.server.ts] User created and profile stored successfully: ${email}`);

			// Create a session cookie
			const customToken = await adminAuth.createCustomToken(userRecord.uid);
			// Note: You'll need a client-side mechanism to exchange this for an ID token
			// and then post it back to a server endpoint to create the session cookie.
			// This example simplifies by directly returning a success message.
			// For a real app, you would redirect to a page that handles the token exchange.

		} catch (error: any) {
			console.error(`[+page.server.ts] Error creating user ${email}:`, error);
			return fail(400, {
				message: error.message
			});
		}

		return {
			status: 201,
			message: 'Account created successfully. Please log in.'
		};
	}
};