import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { cases } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	if (!locals.user || locals.user.role === 'client') {
		throw error(403, 'Only lawyers can update cases');
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
	if (!locals.user || locals.user.role === 'client') {
		throw error(403, 'Only lawyers can delete cases');
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
