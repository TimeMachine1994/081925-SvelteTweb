import { adminAuth } from '$lib/server/firebase';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionCookie = event.cookies.get('session');

	if (sessionCookie) {
		try {
			const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
			const userRecord = await adminAuth.getUser(decodedClaims.uid);
			event.locals.user = {
				uid: userRecord.uid,
				email: userRecord.email,
				displayName: userRecord.displayName,
				role: userRecord.customClaims?.role,
				admin: userRecord.customClaims?.admin
			};
		} catch (error) {
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};