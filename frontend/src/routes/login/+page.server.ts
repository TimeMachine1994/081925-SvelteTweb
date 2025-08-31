import { getAdminAuth } from '$lib/server/firebase';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

import { getAdminDb } from '$lib/server/firebase';

export const actions: Actions = {
	login: async ({ request, cookies, url }) => {
		console.log('Starting login action...');
		const data = await request.formData();
		const idToken = data.get('idToken');
		const bookingId = data.get('bookingId'); // Anonymous booking ID from client

		if (typeof idToken !== 'string' || !idToken) {
			console.error('idToken is missing or not a string');
			return fail(400, { message: 'idToken is required' });
		}

		const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

		try {
			const decodedToken = await getAdminAuth().verifyIdToken(idToken);
			const userUid = decodedToken.uid;

			console.log('Creating session cookie for user:', userUid);
			const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });
			const options = { maxAge: expiresIn, httpOnly: true, secure: true, path: '/' };
			cookies.set('session', sessionCookie, options);
			console.log('Session cookie created and set successfully.');

			// Associate anonymous booking with the user
			if (typeof bookingId === 'string' && bookingId) {
				console.log(`Associating anonymous booking ${bookingId} with user ${userUid}`);
				const bookingRef = getAdminDb().collection('bookings').doc(bookingId);
				await bookingRef.update({ userId: userUid });
				console.log('Booking associated successfully.');
			}

		} catch (error: any) {
			console.error('Session cookie creation or booking association failed:', error);
			return fail(401, { message: 'Could not create session or associate booking.' });
		}

		const redirectTo = url.searchParams.get('redirectTo') || '/my-portal';
		console.log(`Redirecting to ${redirectTo}...`);
		redirect(303, redirectTo);
	}
};