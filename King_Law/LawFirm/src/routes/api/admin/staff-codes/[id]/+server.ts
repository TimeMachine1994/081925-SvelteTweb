import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { staffCodes } from '$lib/server/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import { validateSessionToken } from '$lib/server/auth';

async function requireAdmin(cookies: any) {
	const sessionToken = cookies.get('auth_session');
	if (!sessionToken) {
		throw error(401, 'Authentication required');
	}

	const { user: sessionUser } = await validateSessionToken(sessionToken);
	if (!sessionUser || sessionUser.role !== 'admin') {
		throw error(403, 'Admin access required');
	}

	return sessionUser;
}

export const DELETE: RequestHandler = async ({ params, cookies }) => {
	await requireAdmin(cookies);

	try {
		const { id } = params;

		// Only allow deleting unused codes
		const result = await db
			.delete(staffCodes)
			.where(and(eq(staffCodes.id, id), isNull(staffCodes.assignedToUserId)));

		return json({ success: true });
	} catch (err) {
		console.error('Failed to delete staff code:', err);
		throw error(500, 'Failed to delete staff code');
	}
};
