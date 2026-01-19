import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verify } from '@node-rs/argon2';
import { lucia } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { username, password } = await request.json();

		if (!username || !password) {
			throw error(400, 'Username and password are required');
		}

		const [existingUser] = await db
			.select()
			.from(userTable)
			.where(eq(userTable.username, username))
			.limit(1);

		if (!existingUser) {
			throw error(400, 'Invalid username or password');
		}

		const validPassword = await verify(existingUser.passwordHash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		if (!validPassword) {
			throw error(400, 'Invalid username or password');
		}

		const session = await lucia.createSession(existingUser.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});

		return json({
			success: true,
			user: {
				id: existingUser.id,
				username: existingUser.username,
				email: existingUser.email,
				role: existingUser.role,
				firstName: existingUser.firstName,
				lastName: existingUser.lastName
			}
		});
	} catch (err) {
		console.error('Login error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to login');
	}
};
