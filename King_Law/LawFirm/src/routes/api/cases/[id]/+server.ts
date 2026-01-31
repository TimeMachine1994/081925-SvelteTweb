import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { cases, caseStaffAssignments, user } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// Helper to check if staff is assigned to a case
async function isStaffAssignedToCase(staffId: string, caseId: string): Promise<boolean> {
	const assignment = await db
		.select()
		.from(caseStaffAssignments)
		.where(and(eq(caseStaffAssignments.caseId, caseId), eq(caseStaffAssignments.staffId, staffId)))
		.get();
	return !!assignment;
}

// GET - Get case details (with staff assignment check)
export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const caseId = params.id;
	const userRole = locals.user.role;

	// Get the case
	const [caseData] = await db
		.select({
			id: cases.id,
			title: cases.title,
			description: cases.description,
			status: cases.status,
			clientId: cases.clientId,
			lawyerId: cases.lawyerId,
			createdAt: cases.createdAt
		})
		.from(cases)
		.where(eq(cases.id, caseId))
		.limit(1);

	if (!caseData) {
		throw error(404, 'Case not found');
	}

	// Permission checks
	if (userRole === 'client' && caseData.clientId !== locals.user.id) {
		throw error(403, 'Access denied');
	}

	if (userRole === 'staff') {
		const isAssigned = await isStaffAssignedToCase(locals.user.id, caseId);
		if (!isAssigned) {
			throw error(403, 'You are not assigned to this case');
		}
	}

	// Lawyers and admins can access any case
	return json(caseData);
};

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	if (!locals.user || locals.user.role === 'client' || locals.user.role === 'staff') {
		throw error(403, 'Only lawyers and admins can update cases');
	}

	try {
		const { title, description, status } = await request.json();
		const caseId = params.id;

		const [existingCase] = await db
			.select()
			.from(cases)
			.where(eq(cases.id, caseId))
			.limit(1);

		if (!existingCase) {
			throw error(404, 'Case not found');
		}

		if (existingCase.lawyerId !== locals.user.id && locals.user.role !== 'admin') {
			throw error(403, 'Access denied');
		}

		const [updatedCase] = await db
			.update(cases)
			.set({
				...(title && { title }),
				...(description !== undefined && { description }),
				...(status && { status })
			})
			.where(eq(cases.id, caseId))
			.returning();

		return json({ success: true, case: updatedCase });
	} catch (err) {
		console.error('Update case error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to update case');
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user || locals.user.role === 'client' || locals.user.role === 'staff') {
		throw error(403, 'Only lawyers and admins can delete cases');
	}

	try {
		const caseId = params.id;

		const [existingCase] = await db
			.select()
			.from(cases)
			.where(eq(cases.id, caseId))
			.limit(1);

		if (!existingCase) {
			throw error(404, 'Case not found');
		}

		if (existingCase.lawyerId !== locals.user.id && locals.user.role !== 'admin') {
			throw error(403, 'Access denied');
		}

		await db.delete(cases).where(eq(cases.id, caseId));

		return json({ success: true });
	} catch (err) {
		console.error('Delete case error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to delete case');
	}
};
