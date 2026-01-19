import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq, or } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { lucia, generateId } from '$lib/server/auth';

const LAWYER_ACCESS_CODE = 'k1ngl4w';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { username, email, password, firstName, lastName, phoneNumber, role, accessCode } =
			await request.json();

		if (!username || !email || !password || !firstName || !lastName) {
			throw error(400, 'Required fields are missing');
		}

		if (password.length < 8) {
			throw error(400, 'Password must be at least 8 characters');
		}

		if (role === 'lawyer' && accessCode !== LAWYER_ACCESS_CODE) {
			throw error(400, 'Invalid lawyer access code');
		}

		const existingUsers = await db
			.select()
			.from(userTable)
			.where(or(eq(userTable.username, username), eq(userTable.email, email)))
			.limit(1);

		if (existingUsers.length > 0) {
			throw error(400, 'Username or email already exists');
		}

		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		const userId = generateId();
		const [newUser] = await db
			.insert(userTable)
			.values({
				id: userId,
				username,
				email,
				passwordHash,
				role: role || 'client',
				firstName,
				lastName,
				phoneNumber: phoneNumber || null
			})
			.returning();

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});

		return json({
			success: true,
			user: {
				id: newUser.id,
				username: newUser.username,
				email: newUser.email,
				role: newUser.role,
				firstName: newUser.firstName,
				lastName: newUser.lastName
			}
		});
	} catch (err) {
		console.error('Registration error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to register');
	}
};
