import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { caseStaffAssignments, user, cases } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// GET - List staff assigned to a case
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id: caseId } = params;

	// Only lawyers, admins, or assigned staff can view assignments
	const userRole = locals.user.role;
	if (userRole === 'client') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	// If staff, verify they're assigned to this case
	if (userRole === 'staff') {
		const assignment = await db
			.select()
			.from(caseStaffAssignments)
			.where(
				and(
					eq(caseStaffAssignments.caseId, caseId),
					eq(caseStaffAssignments.staffId, locals.user.id)
				)
			)
			.get();

		if (!assignment) {
			return json({ error: 'Not assigned to this case' }, { status: 403 });
		}
	}

	// Get all staff assigned to this case
	const assignments = await db
		.select({
			id: caseStaffAssignments.id,
			staffId: caseStaffAssignments.staffId,
			staffFirstName: user.firstName,
			staffLastName: user.lastName,
			staffEmail: user.email,
			assignedAt: caseStaffAssignments.assignedAt
		})
		.from(caseStaffAssignments)
		.innerJoin(user, eq(caseStaffAssignments.staffId, user.id))
		.where(eq(caseStaffAssignments.caseId, caseId))
		.all();

	return json({ assignments });
};

// POST - Assign staff to a case (lawyers and admins only)
export const POST: RequestHandler = async ({ params, locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userRole = locals.user.role;
	if (userRole !== 'lawyer' && userRole !== 'admin') {
		return json({ error: 'Only lawyers and admins can assign staff' }, { status: 403 });
	}

	const { id: caseId } = params;
	const { staffId } = await request.json();

	if (!staffId) {
		return json({ error: 'Staff ID is required' }, { status: 400 });
	}

	// Verify the case exists
	const caseRecord = await db.select().from(cases).where(eq(cases.id, caseId)).get();
	if (!caseRecord) {
		return json({ error: 'Case not found' }, { status: 404 });
	}

	// Verify the staff member exists and has staff role
	const staffMember = await db.select().from(user).where(eq(user.id, staffId)).get();
	if (!staffMember) {
		return json({ error: 'Staff member not found' }, { status: 404 });
	}
	if (staffMember.role !== 'staff') {
		return json({ error: 'User is not a staff member' }, { status: 400 });
	}

	// Check if already assigned
	const existing = await db
		.select()
		.from(caseStaffAssignments)
		.where(and(eq(caseStaffAssignments.caseId, caseId), eq(caseStaffAssignments.staffId, staffId)))
		.get();

	if (existing) {
		return json({ error: 'Staff member already assigned to this case' }, { status: 400 });
	}

	// Create assignment
	const assignment = {
		id: nanoid(),
		caseId,
		staffId,
		assignedById: locals.user.id,
		assignedAt: Math.floor(Date.now() / 1000)
	};

	await db.insert(caseStaffAssignments).values(assignment);

	return json({
		message: 'Staff assigned successfully',
		assignment: {
			...assignment,
			staffFirstName: staffMember.firstName,
			staffLastName: staffMember.lastName
		}
	});
};

// DELETE - Remove staff from a case (lawyers and admins only)
export const DELETE: RequestHandler = async ({ params, locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userRole = locals.user.role;
	if (userRole !== 'lawyer' && userRole !== 'admin') {
		return json({ error: 'Only lawyers and admins can remove staff assignments' }, { status: 403 });
	}

	const { id: caseId } = params;
	const { staffId } = await request.json();

	if (!staffId) {
		return json({ error: 'Staff ID is required' }, { status: 400 });
	}

	await db
		.delete(caseStaffAssignments)
		.where(and(eq(caseStaffAssignments.caseId, caseId), eq(caseStaffAssignments.staffId, staffId)));

	return json({ message: 'Staff removed from case' });
};
