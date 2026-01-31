import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// GET - List all staff users (for assignment dropdowns)
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Only lawyers and admins can see staff list
	const userRole = locals.user.role;
	if (userRole !== 'lawyer' && userRole !== 'admin') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const staffUsers = await db
		.select({
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email
		})
		.from(user)
		.where(eq(user.role, 'staff'))
		.all();

	return json({ staff: staffUsers });
};
