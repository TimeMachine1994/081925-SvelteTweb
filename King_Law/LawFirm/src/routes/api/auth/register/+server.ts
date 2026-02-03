import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq, or } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { lucia, generateId } from '$lib/server/auth';

// Lawyer access code removed - staff now register via /staff-sign-up

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { email, password, firstName, lastName, phoneNumber, role, accessCode } =
			await request.json();

		if (!email || !password || !firstName || !lastName) {
			throw error(400, 'Required fields are missing');
		}

		if (password.length < 8) {
			throw error(400, 'Password must be at least 8 characters');
		}

		// Staff registration must use /staff-sign-up endpoint
		if (role && role !== 'client') {
			throw error(400, 'Staff must register via /staff-sign-up');
		}

		const existingUsers = await db
			.select()
			.from(userTable)
			.where(eq(userTable.email, email))
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
