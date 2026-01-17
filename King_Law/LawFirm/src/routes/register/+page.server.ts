import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { hashPassword, generateSessionToken, createSession, SESSION_COOKIE_NAME } from '$lib/server/auth';
import { generateId } from '$lib/server/auth';
import { eq } from 'drizzle-orm';
import { dev } from '$app/environment';

const LAWYER_ACCESS_CODE = 'k1ngl4w';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		console.log('\n========== REGISTRATION ATTEMPT STARTED ==========');
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
		
		console.log('Registration data:', {
			username,
			email,
			firstName,
			lastName,
			phoneNumber,
			role,
			hasAccessCode: !!accessCode
		});

		if (!username || !email || !password || !confirmPassword || !firstName || !lastName) {
			console.log('❌ Registration failed: Missing required fields');
			return fail(400, { error: 'All required fields must be filled' });
		}

		if (password.length < 8) {
			console.log('❌ Registration failed: Password too short');
			return fail(400, { error: 'Password must be at least 8 characters' });
		}

		if (password !== confirmPassword) {
			console.log('❌ Registration failed: Passwords do not match');
			return fail(400, { error: 'Passwords do not match' });
		}

		if (role === 'lawyer' && accessCode !== LAWYER_ACCESS_CODE) {
			console.log('❌ Registration failed: Invalid lawyer access code');
			return fail(400, { error: 'Invalid lawyer access code' });
		}

		console.log('✅ All validation checks passed');

		console.log('🔍 Checking if username exists...');
		const existingUser = await db
			.select()
			.from(user)
			.where(eq(user.username, username))
			.limit(1);

		if (existingUser.length > 0) {
			console.log('❌ Registration failed: Username already exists');
			return fail(400, { error: 'Username already exists' });
		}
		console.log('✅ Username available');

		console.log('🔍 Checking if email exists...');
		const existingEmail = await db
			.select()
			.from(user)
			.where(eq(user.email, email))
			.limit(1);

		if (existingEmail.length > 0) {
			console.log('❌ Registration failed: Email already exists');
			return fail(400, { error: 'Email already exists' });
		}
		console.log('✅ Email available');

		try {
			console.log('🔐 Hashing password...');
			const passwordHash = await hashPassword(password);
			console.log('✅ Password hashed');
			
			console.log('🆔 Generating user ID...');
			const userId = generateId();
			console.log('Generated user ID:', userId);

			console.log('💾 Inserting user into database...');
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
			console.log('✅ User inserted into database');

			console.log('🎫 Generating session token...');
			const sessionToken = generateSessionToken();
			console.log('Session token generated:', sessionToken.substring(0, 10) + '...');
			
			console.log('💾 Creating session in database...');
			await createSession(sessionToken, userId);
			console.log('✅ Session created');

			console.log('🍪 Setting session cookie...');
			cookies.set(SESSION_COOKIE_NAME, sessionToken, {
				path: '/',
				httpOnly: true,
				secure: !dev,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 30
			});
			console.log('✅ Cookie set successfully');

			const redirectPath = role === 'lawyer' ? '/dashboard/lawyer' : '/dashboard/client';
			console.log('🎯 Redirecting to:', redirectPath);
			console.log('========== REGISTRATION SUCCESS ==========\n');
			throw redirect(303, redirectPath);
		} catch (error) {
			// Redirects are expected - check for redirect objects
			if (error instanceof Response || (error && typeof error === 'object' && 'status' in error && 'location' in error)) {
				throw error;
			}
			console.error('❌❌❌ REGISTRATION ERROR ❌❌❌');
			console.error('Error details:', error);
			console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
			return fail(500, { error: 'An error occurred during registration' });
		}
	}
};
