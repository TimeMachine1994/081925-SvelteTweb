import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth } from '$lib/server/firebase';

// Server-side role switching for DevRoleSwitcher
export const POST: RequestHandler = async ({ request, cookies }) => {
	const { email, password } = await request.json();

	if (!email || !password) {
		return json({ success: false, error: 'Email and password required' }, { status: 400 });
	}

	try {
		console.log(`🔄 Dev role switch: Authenticating ${email}...`);

		// Server-side authentication using Firebase Admin SDK
		// Get user by email first
		const userRecord = await adminAuth.getUserByEmail(email);
		
		// Verify this is a test account (basic security check)
		const testEmails = ['admin@test.com', 'director@test.com', 'owner@test.com', 'viewer@test.com'];
		if (!testEmails.includes(email)) {
			return json({ success: false, error: 'Not a valid test account' }, { status: 403 });
		}

		// Create a custom token for the user (bypasses password check in emulator)
		const customToken = await adminAuth.createCustomToken(userRecord.uid, {
			role: userRecord.customClaims?.role || 'owner',
			admin: userRecord.customClaims?.admin || false
		});

		console.log(`✅ Custom token created for ${email}`);

		// Create session cookie directly from custom token
		// First we need to exchange the custom token for an ID token
		const tokenResponse = await fetch(
			'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=dummy',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					token: customToken,
					returnSecureToken: true
				})
			}
		);

		if (!tokenResponse.ok) {
			const errorText = await tokenResponse.text();
			console.error('Token exchange failed:', errorText);
			return json({ success: false, error: 'Token exchange failed' }, { status: 500 });
		}

		const tokenData = await tokenResponse.json();
		const idToken = tokenData.idToken;

		// Create session cookie
		const expiresIn = 60 * 60 * 24 * 1000; // 24 hours
		const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
		
		const cookieOptions = {
			maxAge: expiresIn,
			httpOnly: true,
			secure: false, // Allow non-HTTPS in development
			sameSite: 'lax' as const,
			path: '/'
		};
		
		cookies.set('session', sessionCookie, cookieOptions);
		console.log(`✅ Session cookie created for ${email}`);

		// Determine redirect based on role
		const role = userRecord.customClaims?.role;
		let redirectTo = '/my-portal'; // default

		if (role === 'admin') {
			redirectTo = '/admin';
		} else if (role === 'funeral_director') {
			redirectTo = '/my-portal';
		} else if (role === 'owner') {
			redirectTo = '/my-portal';
		} else if (role === 'viewer') {
			redirectTo = '/';
		}

		return json({
			success: true,
			role: role,
			redirectTo: redirectTo
		});

	} catch (error: any) {
		console.error('Dev role switch error:', error);
		return json({ 
			success: false, 
			error: error.message || 'Authentication failed' 
		}, { status: 500 });
	}
};
