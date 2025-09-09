import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth } from '$lib/server/firebase';

export const GET: RequestHandler = async ({ cookies }) => {
	console.log('🚪 Processing GET logout request...');
	const sessionCookie = cookies.get('session');
	
	if (sessionCookie) {
		try {
			console.log('🔐 Revoking refresh tokens...');
			const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
			await adminAuth.revokeRefreshTokens(decodedClaims.sub);
			console.log('✅ Refresh tokens revoked');
		} catch (error) {
			console.log('⚠️ Session cookie invalid or expired, continuing with logout');
		}
	}

	console.log('🍪 Deleting session cookie...');
	cookies.delete('session', { path: '/' });
	console.log('✅ Logout complete, redirecting to home');
	
	throw redirect(303, '/');
};

export const POST: RequestHandler = async ({ cookies }) => {
	console.log('🚪 Processing POST logout request...');
	const sessionCookie = cookies.get('session');
	
	if (sessionCookie) {
		try {
			console.log('🔐 Revoking refresh tokens...');
			const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
			await adminAuth.revokeRefreshTokens(decodedClaims.sub);
			console.log('✅ Refresh tokens revoked');
		} catch (error) {
			console.log('⚠️ Session cookie invalid or expired, continuing with logout');
		}
	}

	console.log('🍪 Deleting session cookie...');
	cookies.delete('session', { path: '/' });
	console.log('✅ Logout complete, redirecting to home');
	
	throw redirect(303, '/');
};