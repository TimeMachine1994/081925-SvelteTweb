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
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required' });
		}

		// Normalize email to lowercase for case-insensitive login
		const normalizedEmail = email.toLowerCase();

		// Find user by email
		const existingUser = await db
			.select()
			.from(user)
			.where(eq(user.email, normalizedEmail))
			.limit(1);

		if (existingUser.length === 0) {
			return fail(400, { error: 'Invalid email or password' });
		}

		const dbUser = existingUser[0];
		const validPassword = await verifyPassword(dbUser.passwordHash, password);

		if (!validPassword) {
			return fail(400, { error: 'Invalid email or password' });
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
