import { adminAuth } from '$lib/server/firebase';
import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	console.log('Starting session creation...');
	const { idToken, slug } = await request.json();

	if (typeof idToken !== 'string' || !idToken) {
		console.error('idToken is missing or not a string');
		return json({ message: 'idToken is required' }, { status: 400 });
	}

	const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

	try {
		console.log('Creating session cookie...');
		const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
		const options = { maxAge: expiresIn, httpOnly: true, secure: true, path: '/' };
		cookies.set('session', sessionCookie, options);
		console.log('Session cookie created and set successfully.');

		// Add a small delay to allow for user record propagation in Firebase
		console.log('Adding 1.5s delay for Firebase user propagation...');
		await new Promise((resolve) => setTimeout(resolve, 1500));
		console.log('Delay complete.');
	} catch (error: any) {
		console.error('Session cookie creation failed:', error);
		return json({ message: 'Could not create session cookie.' }, { status: 401 });
	}

	if (slug && typeof slug === 'string') {
		console.log(`Redirecting to /tributes/${slug}...`);
		redirect(303, `/tributes/${slug}`);
	} else {
		console.log('Redirecting to home...');
		redirect(303, '/');
	}
};