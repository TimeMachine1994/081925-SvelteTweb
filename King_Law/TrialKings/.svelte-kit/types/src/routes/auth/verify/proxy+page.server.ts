// @ts-nocheck
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { verifyMagicLink, getOrCreateUser, generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';

export const load = async (event: Parameters<PageServerLoad>[0]) => {
	const token = event.url.searchParams.get('token');

	if (!token) {
		return { error: 'Invalid or missing token' };
	}

	const result = await verifyMagicLink(token);

	if (!result) {
		return { error: 'Invalid or expired link. Please request a new login link.' };
	}

	// Get or create user and create session
	const user = await getOrCreateUser(result.email);
	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, user.id);
	setSessionTokenCookie(event, sessionToken, session.expiresAt);

	throw redirect(302, '/dashboard');
};
