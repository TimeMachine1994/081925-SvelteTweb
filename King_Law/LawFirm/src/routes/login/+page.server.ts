import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { verifyPassword, generateSessionToken, createSession, SESSION_COOKIE_NAME } from '$lib/server/auth';
import { eq } from 'drizzle-orm';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString();
		const password = data.get('password')?.toString();

		if (!username || !password) {
			return fail(400, { error: 'Username and password are required' });
		}

		try {
			const existingUser = await db
				.select()
				.from(user)
				.where(eq(user.username, username))
				.limit(1);

			if (existingUser.length === 0) {
				return fail(400, { error: 'Invalid username or password' });
			}

			const dbUser = existingUser[0];
			const validPassword = await verifyPassword(dbUser.passwordHash, password);

			if (!validPassword) {
				return fail(400, { error: 'Invalid username or password' });
			}

			const sessionToken = generateSessionToken();
			await createSession(sessionToken, dbUser.id);

			cookies.set(SESSION_COOKIE_NAME, sessionToken, {
				path: '/',
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 30
			});

			const redirectPath =
				dbUser.role === 'lawyer' || dbUser.role === 'admin'
					? '/dashboard/lawyer'
					: '/dashboard/client';
			throw redirect(303, redirectPath);
		} catch (error) {
			if (error instanceof Response) throw error;
			console.error('Login error:', error);
			return fail(500, { error: 'An error occurred during login' });
		}
	}
};
