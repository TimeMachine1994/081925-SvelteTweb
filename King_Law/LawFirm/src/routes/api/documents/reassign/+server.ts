import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { documents, cases } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';

// PATCH /api/documents/reassign - Move documents to a different case
export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		throw error(403, 'Only lawyers can reassign documents');
	}

	const body = await request.json();
	const { documentIds, newCaseId } = body;

	if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
		throw error(400, 'documentIds array is required');
	}

	// If newCaseId is provided, verify the case exists and belongs to this lawyer
	if (newCaseId) {
		const targetCase = await db.query.cases.findFirst({
			where: eq(cases.id, newCaseId)
		});

		if (!targetCase) {
			throw error(404, 'Target case not found');
		}

		if (targetCase.lawyerId !== locals.user.id && locals.user.role !== 'admin') {
			throw error(403, 'Cannot reassign to a case you do not own');
		}
	}

	// Update documents
	await db
		.update(documents)
		.set({ caseId: newCaseId || null })
		.where(inArray(documents.id, documentIds));

	return json({
		success: true,
		documentsUpdated: documentIds.length,
		newCaseId: newCaseId || null
	});
};
