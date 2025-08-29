import { getAdminAuth } from '$lib/server/firebase';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	console.log('🔐 Authentication check for:', event.url.pathname);
	console.log('----------------------------------------------------');
	
	const sessionCookie = event.cookies.get('session');
	console.log('🍪 Session cookie present:', !!sessionCookie);
	
	if (sessionCookie) {
		console.log('🔍 Session cookie found, verifying...');
		console.log('🍪 Cookie length:', sessionCookie.length);
		console.log('🍪 Cookie preview:', sessionCookie.substring(0, 50) + '...');
		
		try {
			console.log('🔐 Verifying session cookie with Firebase Admin...');
			const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);
			console.log('✅ Session cookie verified successfully');
			console.log('👤 Decoded claims:');
			console.log('  - uid:', decodedClaims.uid);
			console.log('  - email:', decodedClaims.email);
			console.log('  - iat:', new Date(decodedClaims.iat * 1000));
			console.log('  - exp:', new Date(decodedClaims.exp * 1000));
			
			console.log('👤 Fetching user record...');
			const userRecord = await getAdminAuth().getUser(decodedClaims.uid);
			console.log('✅ User record fetched successfully');
			console.log('👤 User record details:');
			console.log('  - uid:', userRecord.uid);
			console.log('  - email:', userRecord.email);
			console.log('  - displayName:', userRecord.displayName);
			console.log('  - customClaims:', userRecord.customClaims);
			
			event.locals.user = {
				uid: userRecord.uid,
				email: userRecord.email,
				displayName: userRecord.displayName,
				role: userRecord.customClaims?.role,
				admin: userRecord.customClaims?.admin
			};
			
			console.log('✅ User set in event.locals:', event.locals.user);

			// Check for first-time memorial visit cookie
			const firstVisitCookie = event.cookies.get('first_visit_memorial_popup');
			if (firstVisitCookie === 'true') {
				event.locals.showFirstVisitPopup = true;
				console.log('🍪 First-time memorial visit cookie found, setting event.locals.showFirstVisitPopup to true');
			} else {
				event.locals.showFirstVisitPopup = false;
				console.log('🚫 First-time memorial visit cookie not found or false');
			}
			
		} catch (error) {
			console.error('❌ Session verification failed:', error);
			console.error('📍 Error type:', error instanceof Error ? error.constructor.name : typeof error);
			console.error('📍 Error message:', error instanceof Error ? error.message : String(error));
			
			if (error instanceof Error && error.message.includes('expired')) {
				console.error('⏰ Session cookie has expired');
			}
			
			// Clear the invalid session cookie
			event.cookies.delete('session', { path: '/' });
			console.log('🗑️ Invalid session cookie cleared.');

			event.locals.user = null;
			event.locals.showFirstVisitPopup = false; // Ensure this is false if user is not authenticated
			console.log('❌ User set to null and showFirstVisitPopup to false due to verification failure');
		}
	} else {
		console.log('🚫 No session cookie found');
		event.locals.user = null;
		event.locals.showFirstVisitPopup = false; // Ensure this is false if no session
	}

	console.log('🏁 Authentication check complete for:', event.url.pathname);
	console.log('👤 Final user state:', event.locals.user ? 'authenticated' : 'not authenticated');
	console.log('✨ Final showFirstVisitPopup state:', event.locals.showFirstVisitPopup);
	
	return resolve(event);
};