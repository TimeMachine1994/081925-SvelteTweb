import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { invalidateSession, SESSION_COOKIE_NAME } from '$lib/server/auth';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	if (!locals.session) {
		return json({ success: false });
	}

	await invalidateSession(locals.session.id);
	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });

	return json({ success: true });
};
