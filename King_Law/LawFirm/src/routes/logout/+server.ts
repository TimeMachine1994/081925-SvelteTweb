import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { invalidateSession, SESSION_COOKIE_NAME } from '$lib/server/auth';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	if (locals.session) {
		await invalidateSession(locals.session.id);
	}

	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });

	throw redirect(303, '/');
};
