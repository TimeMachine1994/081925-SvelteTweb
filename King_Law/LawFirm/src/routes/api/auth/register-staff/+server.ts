import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user as userTable, staffCodes } from '$lib/server/db/schema';
import { eq, or } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { lucia, generateId } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Verify staff password cookie exists
		const staffVerified = cookies.get('staff_verified');
		if (staffVerified !== 'true') {
			throw error(401, 'Staff verification required. Please enter the staff password first.');
		}

		const { username, email, password, firstName, lastName, phoneNumber, employeeNumber } =
			await request.json();

		// Validate required fields
		if (!username || !email || !password || !firstName || !lastName || !employeeNumber) {
			throw error(400, 'Required fields are missing');
		}

		if (password.length < 8) {
			throw error(400, 'Password must be at least 8 characters');
		}

		// Look up the employee number
		const codeResults = await db
			.select()
			.from(staffCodes)
			.where(eq(staffCodes.employeeNumber, employeeNumber.toUpperCase()))
			.limit(1);

		if (codeResults.length === 0) {
			throw error(400, 'Invalid employee number. Please contact your administrator.');
		}

		const staffCode = codeResults[0];

		// Check if code is already used
		if (staffCode.assignedToUserId) {
			throw error(400, 'This employee number has already been used.');
		}

		// Check if username or email already exists
		const existingUsers = await db
			.select()
			.from(userTable)
			.where(or(eq(userTable.username, username), eq(userTable.email, email)))
			.limit(1);

		if (existingUsers.length > 0) {
			throw error(400, 'Username or email already exists');
		}

		// Hash password
		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		// Create user with role from staff code
		const userId = generateId();
		const [newUser] = await db
			.insert(userTable)
			.values({
				id: userId,
				username,
				email,
				passwordHash,
				role: staffCode.role,
				firstName,
				lastName,
				phoneNumber: phoneNumber || null
			})
			.returning();

		// Mark the staff code as used
		await db
			.update(staffCodes)
			.set({
				assignedToUserId: userId,
				usedAt: Math.floor(Date.now() / 1000)
			})
			.where(eq(staffCodes.id, staffCode.id));

		// Create session
		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});

		// Clear staff verification cookie
		cookies.delete('staff_verified', { path: '/' });

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
		console.error('Staff registration error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to register');
	}
};
