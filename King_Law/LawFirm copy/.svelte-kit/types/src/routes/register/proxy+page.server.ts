// @ts-nocheck
import { hash } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import * as auth from '$lib/server/auth';
import { getDashboardRoute } from '$lib/utils/auth-helpers';
import type { Actions, PageServerLoad } from './$types';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
	if (locals.user) {
		redirect(302, getDashboardRoute(locals.user));
	}
	return {};
};

const LAWYER_ACCESS_CODE = 'k1ngl4w';

export const actions = {
	default: async ({ request, cookies }: import('./$types').RequestEvent) => {
		const formData = await request.formData();
		const username = formData.get('username');
		const email = formData.get('email');
		const password = formData.get('password');
		const confirmPassword = formData.get('confirmPassword');
		const firstName = formData.get('firstName');
		const lastName = formData.get('lastName');
		const phoneNumber = formData.get('phoneNumber');
		const role = formData.get('role') as 'client' | 'lawyer';
		const lawyerCode = formData.get('lawyerCode');

		// Validation
		if (!username || !email || !password || !firstName || !lastName) {
			return fail(400, { message: 'All required fields must be filled' });
		}

		if (password !== confirmPassword) {
			return fail(400, { message: 'Passwords do not match' });
		}

		if ((password as string).length < 8) {
			return fail(400, { message: 'Password must be at least 8 characters long' });
		}

		// Validate lawyer access code
		if (role === 'lawyer' && lawyerCode !== LAWYER_ACCESS_CODE) {
			return fail(400, { message: 'Invalid firm access code' });
		}

		// Check if username exists
		const [existingUsername] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.username, username as string));

		if (existingUsername) {
			return fail(400, { message: 'Username already taken' });
		}

		// Check if email exists
		const [existingEmail] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.email, email as string));

		if (existingEmail) {
			return fail(400, { message: 'Email already registered' });
		}

		// Hash password
		const passwordHash = await hash(password as string, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		// Create user
		const userId = crypto.randomUUID();
		const now = new Date();

		await db.insert(table.user).values({
			id: userId,
			username: username as string,
			passwordHash,
			role: role || 'client',
			email: email as string,
			firstName: firstName as string,
			lastName: lastName as string,
			phoneNumber: phoneNumber as string | null,
			createdAt: now,
			updatedAt: now
		});

		// Create session
		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, userId);
		auth.setSessionTokenCookie(cookies, sessionToken, session.expiresAt);

		// Redirect to appropriate dashboard
		const user = { id: userId, role: role || 'client' } as table.User;
		redirect(302, getDashboardRoute(user));
	}
};
;null as any as Actions;