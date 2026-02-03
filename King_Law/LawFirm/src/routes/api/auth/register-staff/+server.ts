import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user as userTable, staffCodes } from '$lib/server/db/schema';
import { eq, or } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { generateId, createSession, generateSessionToken, SESSION_COOKIE_NAME } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Verify staff password cookie exists
		const staffVerified = cookies.get('staff_verified');
		if (staffVerified !== 'true') {
			throw error(401, 'Staff verification required. Please enter the staff password first.');
		}

		const { email, password, firstName, lastName, phoneNumber, employeeNumber } =
			await request.json();

		// Validate required fields
		if (!email || !password || !firstName || !lastName || !employeeNumber) {
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
			.where(eq(userTable.email, email))
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
		const token = generateSessionToken();
		await createSession(token, userId);
		cookies.set(SESSION_COOKIE_NAME, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false, // set to true in production
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});

		// Clear staff verification cookie
		cookies.delete('staff_verified', { path: '/' });

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
	} catch (err: any) {
		console.error('Staff registration error:', err);
		// Re-throw HTTP errors (like our validation errors)
		if (err instanceof Response) throw err;
		if (err?.status && err?.body) throw err;
		
		// Check for specific database errors
		const errMsg = err?.message || String(err);
		if (errMsg.includes('UNIQUE constraint failed') && errMsg.includes('email')) {
			throw error(400, 'An account with this email already exists');
		}
		if (errMsg.includes('UNIQUE constraint failed')) {
			throw error(400, 'An account with this information already exists');
		}
		
		throw error(500, 'Registration failed. Please try again later.');
	}
};
