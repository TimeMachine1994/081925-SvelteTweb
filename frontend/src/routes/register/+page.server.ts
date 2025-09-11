import { adminAuth, adminDb } from '$lib/server/firebase';
import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	registerViewer: async ({ request }) => {
		console.log('[+page.server.ts] Register viewer action started.');
		const data = await request.formData();
		const name = data.get('name');
		const email = data.get('email');
		const password = data.get('password');

		if (!name || !email || !password) {
			console.error('[+page.server.ts] Missing required fields.');
			return fail(400, {
				error: 'Name, email and password are required'
			});
		}

		try {
			console.log(`[+page.server.ts] Attempting to create viewer user: ${email}`);
			const userRecord = await adminAuth.createUser({
				email: email.toString(),
				password: password.toString(),
				displayName: name.toString()
			});

			// Set custom claims for viewer role
			await adminAuth.setCustomUserClaims(userRecord.uid, { 
				role: 'viewer',
				isViewer: true 
			});

			const userDocRef = adminDb.collection('users').doc(userRecord.uid);
			await userDocRef.set({
				name: name.toString(),
				email: userRecord.email,
				role: 'viewer',
				followedMemorials: [], // Array to store memorial IDs they follow
				createdAt: new Date().toISOString(),
				lastLoginAt: new Date().toISOString()
			});

			console.log(`[+page.server.ts] Viewer user created and profile stored successfully: ${email}`);

			const customToken = await adminAuth.createCustomToken(userRecord.uid);

			// Redirect to the session creation page
			const redirectUrl = `/auth/session?token=${customToken}&redirect=/profile`;
			redirect(303, redirectUrl);
		} catch (error: any) {
			if (isRedirect(error)) {
				throw error;
			}
			console.error(`[+page.server.ts] Error creating viewer user ${email}:`, error);
			return fail(400, {
				error: error.message || 'Failed to create account. Please try again.'
			});
		}
	},
	
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

			const customToken = await adminAuth.createCustomToken(userRecord.uid);

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
			const userRecord = await adminAuth.createUser({
				email: email.toString(),
				password: password.toString()
			});

			await adminAuth.setCustomUserClaims(userRecord.uid, { isAdmin: true });

			const userDocRef = adminDb.collection('users').doc(userRecord.uid);
			await userDocRef.set({
				email: userRecord.email,
				isAdmin: true,
				createdAt: new Date().toISOString()
			});

			console.log(`[+page.server.ts] Admin user created and profile stored successfully: ${email}`);

			const customToken = await adminAuth.createCustomToken(userRecord.uid);

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
