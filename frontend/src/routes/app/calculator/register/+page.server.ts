import { getAdminAuth, getAdminDb } from '$lib/server/firebase';
import { fail, redirect, isRedirect, type RequestEvent } from '@sveltejs/kit';
import type { Actions } from './$types';
import { Timestamp } from 'firebase-admin/firestore';

function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export const actions: Actions = {
	default: async ({ request, url }: RequestEvent) => {
		const data = await request.formData();
		
		const fullName = (data.get('fullName') as string)?.trim();
		const email = (data.get('email') as string)?.trim();
		const password = data.get('password') as string;

		const validationErrors: string[] = [];
		if (!fullName) validationErrors.push("Full name is required");
		if (!email) validationErrors.push('Email is required');
		if (!password) validationErrors.push('Password is required');
		if (email && !isValidEmail(email)) {
			validationErrors.push('Email must be a valid email address');
		}

		if (validationErrors.length > 0) {
			return fail(400, { error: `Validation failed: ${validationErrors.join(', ')}` });
		}

		try {
			const userRecord = await getAdminAuth().createUser({
				email,
				password,
				displayName: fullName
			});

			await getAdminAuth().setCustomUserClaims(userRecord.uid, { role: 'owner' });

			const userProfile = {
				email,
				displayName: fullName,
				role: 'owner',
				createdAt: Timestamp.fromDate(new Date())
			};

			await getAdminDb().collection('users').doc(userRecord.uid).set(userProfile);

			const customToken = await getAdminAuth().createCustomToken(userRecord.uid);
			
			const memorialId = url.searchParams.get('memorialId');
			const redirectUrl = `/auth/session?token=${customToken}&redirectTo=/app/calculator${memorialId ? `?memorialId=${memorialId}` : ''}`;
			
			redirect(303, redirectUrl);

		} catch (error: any) {
			if (isRedirect(error)) {
				throw error;
			}
			
			let errorMessage = 'An unexpected error occurred during registration.';
			if (error.code === 'auth/email-already-exists') {
				errorMessage = `An account with email ${email} already exists. Please log in or use a different email.`;
			} else if (error.message) {
				errorMessage = `Registration failed: ${error.message}`;
			}
			
			return fail(500, { error: errorMessage });
		}
	}
};