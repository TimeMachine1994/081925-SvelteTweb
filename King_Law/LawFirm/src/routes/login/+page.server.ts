import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { verifyPassword, generateSessionToken, createSession, SESSION_COOKIE_NAME } from '$lib/server/auth';
import { eq } from 'drizzle-orm';
import { dev } from '$app/environment';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString();
		const password = data.get('password')?.toString();

		if (!username || !password) {
			return fail(400, { error: 'Username and password are required' });
		}

		// Normalize username/email to lowercase for case-insensitive login
		const normalizedUsername = username.toLowerCase();

		// Try to find user by username first
		let existingUser = await db
			.select()
			.from(user)
			.where(eq(user.username, normalizedUsername))
			.limit(1);
		
		// If not found by username, try email
		if (existingUser.length === 0) {
			existingUser = await db
				.select()
				.from(user)
				.where(eq(user.email, normalizedUsername))
				.limit(1);
		}

		if (existingUser.length === 0) {
			return fail(400, { error: 'Invalid username or password' });
		}

		const dbUser = existingUser[0];
		const validPassword = await verifyPassword(dbUser.passwordHash, password);

		if (!validPassword) {
			return fail(400, { error: 'Invalid username or password' });
		}

		// Create session
		const sessionToken = generateSessionToken();
		await createSession(sessionToken, dbUser.id);

		// Set session cookie
		cookies.set(SESSION_COOKIE_NAME, sessionToken, {
			path: '/',
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30
		});

		// Redirect based on role - redirect() throws automatically
		const redirectPath =
			dbUser.role === 'lawyer' || dbUser.role === 'admin'
				? '/dashboard/lawyer'
				: '/dashboard/client';
		
		redirect(303, redirectPath);
	}
};
