import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user, staffCodes } from '$lib/server/db/schema';
import { eq, isNull, count } from 'drizzle-orm';
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

export const GET: RequestHandler = async ({ cookies }) => {
	await requireAdmin(cookies);

	try {
		// Get user counts by role
		const users = await db.select().from(user);
		
		const totalUsers = users.length;
		const lawyers = users.filter(u => u.role === 'lawyer').length;
		const staff = users.filter(u => u.role === 'staff').length;
		const clients = users.filter(u => u.role === 'client').length;
		const admins = users.filter(u => u.role === 'admin').length;

		// Get unused staff codes count
		const unusedCodesResult = await db
			.select({ count: count() })
			.from(staffCodes)
			.where(isNull(staffCodes.assignedToUserId));

		const unusedCodes = unusedCodesResult[0]?.count || 0;

		return json({
			totalUsers,
			lawyers,
			staff,
			clients,
			admins,
			unusedCodes
		});
	} catch (err) {
		console.error('Failed to fetch stats:', err);
		throw error(500, 'Failed to fetch stats');
	}
};
