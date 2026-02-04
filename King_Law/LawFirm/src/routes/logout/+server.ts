import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { invalidateSession, SESSION_COOKIE_NAME } from '$lib/server/auth';

async function handleLogout(locals: App.Locals, cookies: any) {
	if (locals.session) {
		await invalidateSession(locals.session.id);
	}
	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
	throw redirect(303, '/');
}

export const POST: RequestHandler = async ({ locals, cookies }) => {
	return handleLogout(locals, cookies);
};

export const GET: RequestHandler = async ({ locals, cookies }) => {
	return handleLogout(locals, cookies);
};
