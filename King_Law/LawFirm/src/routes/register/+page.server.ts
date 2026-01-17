import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { hashPassword, generateSessionToken, createSession, SESSION_COOKIE_NAME } from '$lib/server/auth';
import { generateId } from '$lib/server/auth';
import { eq } from 'drizzle-orm';

const LAWYER_ACCESS_CODE = 'k1ngl4w';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();
		const firstName = data.get('firstName')?.toString();
		const lastName = data.get('lastName')?.toString();
		const phoneNumber = data.get('phoneNumber')?.toString() || null;
		const role = data.get('role')?.toString() as 'client' | 'lawyer';
		const accessCode = data.get('accessCode')?.toString();

		if (!username || !email || !password || !confirmPassword || !firstName || !lastName) {
			return fail(400, { error: 'All required fields must be filled' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match' });
		}

		if (role === 'lawyer' && accessCode !== LAWYER_ACCESS_CODE) {
			return fail(400, { error: 'Invalid lawyer access code' });
		}

		try {
			const existingUser = await db
				.select()
				.from(user)
				.where(eq(user.username, username))
				.limit(1);

			if (existingUser.length > 0) {
				return fail(400, { error: 'Username already exists' });
			}

			const existingEmail = await db
				.select()
				.from(user)
				.where(eq(user.email, email))
				.limit(1);

			if (existingEmail.length > 0) {
				return fail(400, { error: 'Email already exists' });
			}

			const passwordHash = await hashPassword(password);
			const userId = generateId();

			await db.insert(user).values({
				id: userId,
				username,
				email,
				passwordHash,
				firstName,
				lastName,
				phoneNumber,
				role: role || 'client',
				createdAt: new Date(),
				updatedAt: new Date()
			});

			const sessionToken = generateSessionToken();
			await createSession(sessionToken, userId);

			cookies.set(SESSION_COOKIE_NAME, sessionToken, {
				path: '/',
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 30
			});

			const redirectPath = role === 'lawyer' ? '/dashboard/lawyer' : '/dashboard/client';
			throw redirect(303, redirectPath);
		} catch (error) {
			if (error instanceof Response) throw error;
			console.error('Registration error:', error);
			return fail(500, { error: 'An error occurred during registration' });
		}
	}
};
