import type { Handle } from '@sveltejs/kit';
import { validateSessionToken, SESSION_COOKIE_NAME } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE_NAME);

	if (!token) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await validateSessionToken(token);

	event.locals.session = session;
	event.locals.user = user;

	return resolve(event);
};
