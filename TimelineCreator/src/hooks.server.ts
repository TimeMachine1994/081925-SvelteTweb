import type { Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { dev } from '$app/environment';

const handleAuth: Handle = async ({ event, resolve }) => {
	let sessionToken = event.cookies.get(auth.sessionCookieName);

	// Auto-login as admin in development
	if (!sessionToken && dev) {
		const [admin] = await db.select().from(table.user).where(eq(table.user.username, 'admin'));
		if (admin) {
			sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, admin.id);
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		}
	}

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;

		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);

	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;

	return resolve(event);
};

export const handle: Handle = handleAuth;
