import { getAdminAuth, getAdminDb } from '$lib/server/firebase';
import { fail, redirect, isRedirect } from '@sveltejs/kit';
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
			const userRecord = await getAdminAuth().createUser({
				email: email.toString(),
				password: password.toString()
			});

			const userDocRef = getAdminDb().collection('users').doc(userRecord.uid);
			await userDocRef.set({
				email: userRecord.email,
				createdAt: new Date().toISOString()
			});

			console.log(`[+page.server.ts] User created and profile stored successfully: ${email}`);

			const customToken = await getAdminAuth().createCustomToken(userRecord.uid);

			// Redirect to the session creation page
			const redirectUrl = `/auth/session?token=${customToken}`;
			redirect(303, redirectUrl);
		} catch (error: any) {
			if (isRedirect(error)) {
				throw error;
			}
			console.error(`[+page.server.ts] Error creating user ${email}:`, error);
			return fail(400, {
				message: error.message
			});
		}
	},
	registerAdmin: async ({ request }) => {
		console.log('[+page.server.ts] Register admin action started.');
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
			console.log(`[+page.server.ts] Attempting to create admin user: ${email}`);
			const userRecord = await getAdminAuth().createUser({
				email: email.toString(),
				password: password.toString()
			});

			await getAdminAuth().setCustomUserClaims(userRecord.uid, { isAdmin: true });

			const userDocRef = getAdminDb().collection('users').doc(userRecord.uid);
			await userDocRef.set({
				email: userRecord.email,
				isAdmin: true,
				createdAt: new Date().toISOString()
			});

			console.log(`[+page.server.ts] Admin user created and profile stored successfully: ${email}`);

			const customToken = await getAdminAuth().createCustomToken(userRecord.uid);

			const redirectUrl = `/auth/session?token=${customToken}`;
			redirect(303, redirectUrl);
		} catch (error: any) {
			if (isRedirect(error)) {
				throw error;
			}
			console.error(`[+page.server.ts] Error creating admin user ${email}:`, error);
			return fail(400, {
				message: error.message
			});
		}
	}
};