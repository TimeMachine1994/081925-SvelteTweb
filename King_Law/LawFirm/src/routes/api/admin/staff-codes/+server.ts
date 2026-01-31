import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { staffCodes, user } from '$lib/server/db/schema';
import { eq, isNull } from 'drizzle-orm';
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
		const codes = await db
			.select({
				id: staffCodes.id,
				employeeNumber: staffCodes.employeeNumber,
				role: staffCodes.role,
				assignedToUserId: staffCodes.assignedToUserId,
				createdAt: staffCodes.createdAt,
				usedAt: staffCodes.usedAt
			})
			.from(staffCodes)
			.orderBy(staffCodes.createdAt);

		// Get assigned user details for used codes
		const codesWithUsers = await Promise.all(
			codes.map(async (code) => {
				if (code.assignedToUserId) {
					const [assignedUser] = await db
						.select({
							firstName: user.firstName,
							lastName: user.lastName,
							email: user.email
						})
						.from(user)
						.where(eq(user.id, code.assignedToUserId))
						.limit(1);

					return { ...code, assignedUser };
				}
				return { ...code, assignedUser: null };
			})
		);

		return json(codesWithUsers);
	} catch (err) {
		console.error('Failed to fetch staff codes:', err);
		throw error(500, 'Failed to fetch staff codes');
	}
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	await requireAdmin(cookies);

	try {
		const { employeeNumber, role } = await request.json();

		if (!employeeNumber || !role) {
			throw error(400, 'Employee number and role are required');
		}

		if (!['lawyer', 'staff', 'admin'].includes(role)) {
			throw error(400, 'Invalid role');
		}

		const codeId = 'code_' + Date.now() + '_' + Math.random().toString(36).substring(7);

		await db.insert(staffCodes).values({
			id: codeId,
			employeeNumber: employeeNumber.toUpperCase(),
			role: role as 'lawyer' | 'staff' | 'admin'
		});

		return json({ success: true, id: codeId });
	} catch (err: any) {
		console.error('Failed to create staff code:', err);
		if (err.message?.includes('UNIQUE constraint failed')) {
			throw error(400, 'Employee number already exists');
		}
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to create staff code');
	}
};
