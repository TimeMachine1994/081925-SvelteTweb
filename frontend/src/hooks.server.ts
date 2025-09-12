import { adminAuth } from '$lib/server/firebase';
import { auditMiddleware } from '$lib/server/auditMiddleware';
import { logUserAction, extractUserContext } from '$lib/server/auditLogger';
import type { Handle } from '@sveltejs/kit';

const authHandle: Handle = async ({ event, resolve }) => {
	console.log('🔐 Authentication check for:', event.url.pathname);
	
	const sessionCookie = event.cookies.get('session');
	console.log('🍪 Session cookie present:', !!sessionCookie);
	
	if (sessionCookie) {
		console.log('🔍 Session cookie found, verifying...');
		console.log('🍪 Cookie length:', sessionCookie.length);
		console.log('🍪 Cookie preview:', sessionCookie.substring(0, 50) + '...');
		
		try {
			console.log('🔐 Verifying session cookie with Firebase Admin...');
			const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
			console.log('✅ Session cookie verified successfully');
			console.log('👤 Decoded claims:');
			console.log('  - uid:', decodedClaims.uid);
			console.log('  - email:', decodedClaims.email);
			console.log('  - iat:', new Date(decodedClaims.iat * 1000));
			console.log('  - exp:', new Date(decodedClaims.exp * 1000));
			
			console.log('👤 Fetching user record...');
			// Add retry logic for user record fetching to handle propagation delays
			let userRecord;
			let retryCount = 0;
			const maxRetries = 3;
			
			while (retryCount < maxRetries) {
				try {
					userRecord = await adminAuth.getUser(decodedClaims.uid);
					break;
				} catch (userError: any) {
					if (userError.code === 'auth/user-not-found' && retryCount < maxRetries - 1) {
						console.log(`⏳ User not found, retry ${retryCount + 1}/${maxRetries} in 1s...`);
						await new Promise(resolve => setTimeout(resolve, 1000));
						retryCount++;
					} else {
						throw userError;
					}
				}
			}
			console.log('✅ User record fetched successfully');
			console.log('👤 User record details:');
			console.log('  - uid:', userRecord.uid);
			console.log('  - email:', userRecord.email);
			console.log('  - displayName:', userRecord.displayName);
			console.log('  - customClaims:', userRecord.customClaims);
			
			event.locals.user = {
				uid: userRecord.uid,
				email: userRecord.email || null,
				displayName: userRecord.displayName,
				role: userRecord.customClaims?.role || 'owner',
				isAdmin: userRecord.customClaims?.admin || false
			};
			
			console.log('✅ User set in event.locals:', event.locals.user);

			// Log successful login
			const userContext = extractUserContext(event);
			if (userContext && event.url.pathname.includes('/login')) {
				await logUserAction(userContext, 'user_login', userContext.userId, {
					loginTime: new Date().toISOString(),
					userAgent: userContext.userAgent
				});
			}
			
		} catch (error) {
			console.error('❌ Session verification failed:', error);
			console.error('📍 Error type:', error instanceof Error ? error.constructor.name : typeof error);
			console.error('📍 Error message:', error instanceof Error ? error.message : String(error));
			
			if (error instanceof Error && error.message.includes('expired')) {
				console.error('⏰ Session cookie has expired');
			} else if (error instanceof Error && error.message.includes('invalid signature')) {
				console.error('🔑 Session cookie has invalid signature - likely environment mismatch');
				// Clear the invalid cookie
				event.cookies.delete('session', { path: '/' });
				console.log('🗑️ Cleared invalid session cookie');
			}
			
			event.locals.user = null;
			console.log('❌ User set to null due to verification failure');
		}
	} else {
		console.log('🚫 No session cookie found');
		event.locals.user = null;
	}

	console.log('🏁 Authentication check complete for:', event.url.pathname);
	console.log('👤 Final user state:', event.locals.user ? 'authenticated' : 'not authenticated');
	
	return resolve(event);
};

// Combine authentication and audit middleware
export const handle: Handle = async ({ event, resolve }) => {
	// First run authentication
	const authResponse = await authHandle({ event, resolve: (e) => Promise.resolve(new Response()) });
	
	// Then run audit middleware
	return auditMiddleware({ event, resolve });
};