import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { caseStaffAssignments, cases, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// GET - Get cases assigned to the current staff member
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (locals.user.role !== 'staff') {
		return json({ error: 'This endpoint is for staff only' }, { status: 403 });
	}

	// Get all cases assigned to this staff member
	const assignedCases = await db
		.select({
			id: cases.id,
			title: cases.title,
			description: cases.description,
			status: cases.status,
			createdAt: cases.createdAt,
			clientId: cases.clientId,
			clientFirstName: user.firstName,
			clientLastName: user.lastName,
			assignedAt: caseStaffAssignments.assignedAt
		})
		.from(caseStaffAssignments)
		.innerJoin(cases, eq(caseStaffAssignments.caseId, cases.id))
		.innerJoin(user, eq(cases.clientId, user.id))
		.where(eq(caseStaffAssignments.staffId, locals.user.id))
		.all();

	return json({ cases: assignedCases });
};
