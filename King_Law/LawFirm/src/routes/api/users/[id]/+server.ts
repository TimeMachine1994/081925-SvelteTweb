import { json, error, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET = async ({ params, locals }: RequestEvent) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		throw error(403, 'Forbidden');
	}

	try {
		const userId = params.id;
		if (!userId) {
			throw error(400, 'User ID is required');
		}

		const users = await db
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
			.where(eq(userTable.id, userId));

		if (users.length === 0) {
			throw error(404, 'User not found');
		}

		return json({ user: users[0] });
	} catch (err) {
		console.error('Fetch user error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to fetch user');
	}
};
