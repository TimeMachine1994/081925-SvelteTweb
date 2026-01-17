import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		throw error(403, 'Forbidden');
	}

	try {
		const role = url.searchParams.get('role');

		let users;
		if (role) {
			users = await db
				.select({
					id: userTable.id,
					username: userTable.username,
					email: userTable.email,
					firstName: userTable.firstName,
					lastName: userTable.lastName,
					phoneNumber: userTable.phoneNumber,
					role: userTable.role,
					createdAt: userTable.createdAt
				})
				.from(userTable)
				.where(eq(userTable.role, role as any));
		} else {
			users = await db
				.select({
					id: userTable.id,
					username: userTable.username,
					email: userTable.email,
					firstName: userTable.firstName,
					lastName: userTable.lastName,
					phoneNumber: userTable.phoneNumber,
					role: userTable.role,
					createdAt: userTable.createdAt
				})
				.from(userTable);
		}

		return json({ users });
	} catch (err) {
		console.error('Fetch users error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to fetch users');
	}
};
