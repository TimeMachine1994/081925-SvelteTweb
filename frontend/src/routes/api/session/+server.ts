import { getAdminAuth } from '$lib/server/firebase';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	console.log('🚀 Starting session creation process at /api/session');
	const { idToken, slug } = await request.json();
	console.log(`Received request with idToken length: ${idToken?.length || 0}, slug: ${slug}`);

	if (typeof idToken !== 'string' || !idToken) {
		console.error('❌ idToken is missing or not a string. Returning 400.');
		return json({ message: 'idToken is required' }, { status: 400 });
	}

	const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

	try {
		console.log('🍪 Attempting to create session cookie...');
		const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });
		const options = { maxAge: expiresIn, httpOnly: true, secure: true, path: '/' };
		cookies.set('session', sessionCookie, options);
		console.log('✅ Session cookie created and set successfully.');

		// Add a small delay to allow for user record propagation in Firebase
		console.log('⏳ Adding 1.5s delay for Firebase user propagation...');
		await new Promise((resolve) => setTimeout(resolve, 1500));
		console.log('✅ Delay complete.');
	} catch (error: any) {
		console.error('💥 Session cookie creation failed:', error);
		return json({ message: 'Could not create session cookie.' }, { status: 401 });
	}

	// Return JSON with redirect URL instead of using SvelteKit redirect
	let redirectUrl: string;
	if (slug && typeof slug === 'string') {
		redirectUrl = `/tributes/${slug}`;
		console.log(`➡️ Returning redirect URL: ${redirectUrl}`);
	} else {
		redirectUrl = '/my-portal';
		console.log('➡️ No slug provided. Returning redirect URL: /my-portal');
	}

	return json({
		success: true,
		redirectUrl,
		message: 'Session created successfully'
	});
};