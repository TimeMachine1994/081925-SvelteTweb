import { json, error, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verify } from '@node-rs/argon2';
import { createSession, generateSessionToken, SESSION_COOKIE_NAME } from '$lib/server/auth';
import { dev } from '$app/environment';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		console.log('\n🔐 [LOGIN] ====== LOGIN ATTEMPT ======');
		console.log('🔐 [LOGIN] Request body:', JSON.stringify(body, null, 2));
		
		const { username, password } = body;

		if (!username || !password) {
			console.log('🔐 [LOGIN] ❌ Missing username or password');
			throw error(400, 'Username and password are required');
		}
		
		console.log('🔐 [LOGIN] Attempting login for username:', username);
		console.log('🔐 [LOGIN] Password length:', password?.length || 0);

		console.log('🔐 [LOGIN] Querying database for user...');
		const [existingUser] = await db
			.select()
			.from(userTable)
			.where(eq(userTable.username, username))
			.limit(1);

		if (!existingUser) {
			console.log('🔐 [LOGIN] ❌ No user found with username:', username);
			
			// Try email as well
			console.log('🔐 [LOGIN] Trying email lookup...');
			const [userByEmail] = await db
				.select()
				.from(userTable)
				.where(eq(userTable.email, username))
				.limit(1);
			
			if (userByEmail) {
				console.log('🔐 [LOGIN] ✅ Found user by EMAIL:', userByEmail.email);
				console.log('🔐 [LOGIN] User details:', {
					id: userByEmail.id,
					username: userByEmail.username,
					email: userByEmail.email,
					role: userByEmail.role
				});
			} else {
				console.log('🔐 [LOGIN] ❌ No user found by email either');
			}
			
			throw error(400, 'Invalid username or password');
		}

		console.log('🔐 [LOGIN] ✅ User found:', {
			id: existingUser.id,
			username: existingUser.username,
			email: existingUser.email,
			role: existingUser.role,
			passwordHashLength: existingUser.passwordHash?.length || 0
		});

		console.log('🔐 [LOGIN] Verifying password...');
		const validPassword = await verify(existingUser.passwordHash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		console.log('🔐 [LOGIN] Password verification result:', validPassword ? '✅ VALID' : '❌ INVALID');

		if (!validPassword) {
			console.log('🔐 [LOGIN] ❌ Password mismatch for user:', username);
			throw error(400, 'Invalid username or password');
		}

		// Use custom session system (not Lucia)
		console.log('🔐 [LOGIN] ✅ Password valid! Creating session...');
		const token = generateSessionToken();
		console.log('🔐 [LOGIN] Generated token:', token.substring(0, 10) + '...');
		
		await createSession(token, existingUser.id);
		console.log('🔐 [LOGIN] Session created in database');
		
		console.log('🔐 [LOGIN] Setting cookie:', SESSION_COOKIE_NAME);
		cookies.set(SESSION_COOKIE_NAME, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});

		console.log('🔐 [LOGIN] ✅✅✅ LOGIN SUCCESSFUL for:', existingUser.email);
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
		console.error('🔐 [LOGIN] ❌❌❌ Login error:', err);
		// Re-throw expected SvelteKit errors (400, 404, etc.)
		if (isHttpError(err)) {
			throw err;
		}
		// Only wrap unexpected errors as 500
		throw error(500, 'Failed to login');
	}
};
