import { hash, verify } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import * as auth from '$lib/server/auth';
import { getDashboardRoute } from '$lib/utils/auth-helpers';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(302, getDashboardRoute(locals.user));
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		if (!username || !password) {
			return fail(400, { message: 'Username and password are required' });
		}

		const [existingUser] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.username, username as string));

		if (!existingUser) {
			return fail(400, { message: 'Invalid username or password' });
		}

		const validPassword = await verify(existingUser.passwordHash, password as string, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		if (!validPassword) {
			return fail(400, { message: 'Invalid username or password' });
		}

		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, existingUser.id);
		auth.setSessionTokenCookie(cookies, sessionToken, session.expiresAt);

		redirect(302, getDashboardRoute(existingUser));
	}
};
