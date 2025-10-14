import { adminAuth, adminDb } from '$lib/server/firebase';
import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { verifyRecaptcha, RECAPTCHA_ACTIONS, getScoreThreshold } from '$lib/utils/recaptcha';

export const actions: Actions = {
	registerOwner: async ({ request }) => {
		console.log('[+page.server.ts] Register owner action started.');
		const data = await request.formData();
		const name = data.get('name');
		const email = data.get('email');
		const password = data.get('password');
		const recaptchaToken = data.get('recaptchaToken');

		if (!name || !email || !password) {
			console.error('[+page.server.ts] Missing required fields.');
			return fail(400, {
				message: 'Name, email and password are required'
			});
		}

		// Verify reCAPTCHA
		if (recaptchaToken) {
			const recaptchaResult = await verifyRecaptcha(
				recaptchaToken.toString(),
				RECAPTCHA_ACTIONS.REGISTER_OWNER,
				getScoreThreshold(RECAPTCHA_ACTIONS.REGISTER_OWNER)
			);

			if (!recaptchaResult.success) {
				console.error('[+page.server.ts] reCAPTCHA verification failed:', recaptchaResult.error);
				return fail(400, {
					message: 'Security verification failed. Please try again.'
				});
			}

			console.log(`[+page.server.ts] reCAPTCHA verified successfully. Score: ${recaptchaResult.score}`);
		} else {
			console.warn('[+page.server.ts] No reCAPTCHA token provided');
			return fail(400, {
				message: 'Security verification required. Please refresh and try again.'
			});
		}

		try {
			console.log(`[+page.server.ts] Attempting to create owner: ${email}`);
			const userRecord = await adminAuth.createUser({
				email: email.toString(),
				password: password.toString(),
				displayName: name.toString()
			});

			// Set custom claims for owner role
			await adminAuth.setCustomUserClaims(userRecord.uid, {
				role: 'owner',
				isOwner: true
			});

			const userDocRef = adminDb.collection('users').doc(userRecord.uid);
			await userDocRef.set({
				email: userRecord.email,
				displayName: name.toString(),
				role: 'owner',
				isOwner: true,
				hasPaidForMemorial: false,
				memorialCount: 0,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});

			console.log(`[+page.server.ts] Owner created and profile stored successfully: ${email}`);

			const customToken = await adminAuth.createCustomToken(userRecord.uid);

			return {
				success: true,
				customToken
			};
		} catch (error: any) {
			if (isRedirect(error)) {
				throw error;
			}
			console.error(`[+page.server.ts] Error creating owner ${email}:`, error);
			return fail(400, {
				message: error.message
			});
		}
	},
	registerViewer: async ({ request }) => {
		console.log('[+page.server.ts] Register viewer action started.');
		const data = await request.formData();
		const name = data.get('name');
		const email = data.get('email');
		const password = data.get('password');
		const recaptchaToken = data.get('recaptchaToken');

		if (!name || !email || !password) {
			console.error('[+page.server.ts] Missing required fields.');
			return fail(400, {
				message: 'Name, email and password are required'
			});
		}

		// Verify reCAPTCHA
		if (recaptchaToken) {
			const recaptchaResult = await verifyRecaptcha(
				recaptchaToken.toString(),
				RECAPTCHA_ACTIONS.REGISTER_VIEWER,
				getScoreThreshold(RECAPTCHA_ACTIONS.REGISTER_VIEWER)
			);

			if (!recaptchaResult.success) {
				console.error('[+page.server.ts] reCAPTCHA verification failed:', recaptchaResult.error);
				return fail(400, {
					message: 'Security verification failed. Please try again.'
				});
			}

			console.log(`[+page.server.ts] reCAPTCHA verified successfully. Score: ${recaptchaResult.score}`);
		} else {
			console.warn('[+page.server.ts] No reCAPTCHA token provided');
			return fail(400, {
				message: 'Security verification required. Please refresh and try again.'
			});
		}

		try {
			console.log(`[+page.server.ts] Attempting to create viewer: ${email}`);
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
				email: userRecord.email,
				displayName: name.toString(),
				role: 'viewer',
				isViewer: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});

			console.log(`[+page.server.ts] Viewer created and profile stored successfully: ${email}`);

			const customToken = await adminAuth.createCustomToken(userRecord.uid);

			return {
				success: true,
				customToken
			};
		} catch (error: any) {
			if (isRedirect(error)) {
				throw error;
			}
			console.error(`[+page.server.ts] Error creating viewer ${email}:`, error);
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

			await adminAuth.setCustomUserClaims(userRecord.uid, {
				role: 'admin',
				isAdmin: true
			});

			const userDocRef = adminDb.collection('users').doc(userRecord.uid);
			await userDocRef.set({
				email: userRecord.email,
				role: 'admin',
				isAdmin: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
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
