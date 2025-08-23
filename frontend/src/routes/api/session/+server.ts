import { adminAuth } from '$lib/server/firebase';
import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	console.log('Starting session creation...');
	const data = await request.formData();
	const idToken = data.get('idToken');
	const slug = data.get('slug');

	if (typeof idToken !== 'string' || !idToken || typeof slug !== 'string' || !slug) {
		console.error('idToken or slug is missing or not a string');
		return json({ message: 'idToken and slug are required' }, { status: 400 });
	}

	const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

	try {
		console.log('Creating session cookie...');
		const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
		const options = { maxAge: expiresIn, httpOnly: true, secure: true, path: '/' };
		cookies.set('session', sessionCookie, options);
		console.log('Session cookie created and set successfully.');
	} catch (error: any) {
		console.error('Session cookie creation failed:', error);
		return json({ message: 'Could not create session cookie.' }, { status: 401 });
	}

	console.log(`Redirecting to /tributes/${slug}...`);
	redirect(303, `/tributes/${slug}`);
};