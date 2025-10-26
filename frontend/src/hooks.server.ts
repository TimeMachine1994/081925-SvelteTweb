import { adminAuth } from '$lib/server/firebase';
import { auditMiddleware } from '$lib/server/auditMiddleware';
import { logUserAction, extractUserContext } from '$lib/server/auditLogger';
import type { Handle } from '@sveltejs/kit';

const authHandle: Handle = async ({ event, resolve }) => {
	// Skip authentication middleware for logout endpoint and static assets
	if (event.url.pathname === '/logout' || 
		event.url.pathname.startsWith('/_app/') ||
		event.url.pathname.includes('mockServiceWorker.js') ||
		event.url.pathname.endsWith('.js') ||
		event.url.pathname.endsWith('.css') ||
		event.url.pathname.endsWith('.map')) {
		return resolve(event);
	}

	const sessionCookie = event.cookies.get('session');

	if (sessionCookie) {
		try {
			// Add timeout to prevent hanging
			const verificationPromise = adminAuth.verifySessionCookie(sessionCookie, true);
			const timeoutPromise = new Promise<never>((_, reject) => 
				setTimeout(() => reject(new Error('Session verification timeout')), 5000)
			);

			const decodedClaims = await Promise.race([verificationPromise, timeoutPromise]);

			// Get user record with timeout
			const userRecordPromise = adminAuth.getUser(decodedClaims.uid);
			const userTimeoutPromise = new Promise<never>((_, reject) => 
				setTimeout(() => reject(new Error('User fetch timeout')), 3000)
			);

			const userRecord = await Promise.race([userRecordPromise, userTimeoutPromise]);

			event.locals.user = {
				uid: userRecord.uid,
				email: userRecord.email || null,
				displayName: userRecord.displayName,
				role: userRecord.customClaims?.role || 'owner'
			};

		} catch (error) {
			console.error('❌ Session verification failed:', error);

			// Clear expired or invalid session cookies
			if (error instanceof Error && (
				error.message.includes('expired') || 
				error.message.includes('invalid signature') ||
				error.message.includes('session-cookie-expired') ||
				error.message.includes('timeout')
			)) {
				event.cookies.delete('session', { path: '/' });
			}

			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};

// Use only authentication middleware for now (audit disabled to prevent timeouts)
export const handle: Handle = authHandle;
