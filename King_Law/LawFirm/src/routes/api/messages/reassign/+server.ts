import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { messages, cases } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';

// PATCH /api/messages/reassign - Move messages to a different case
export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		throw error(403, 'Only lawyers can reassign messages');
	}

	const body = await request.json();
	const { messageIds, newCaseId } = body;

	if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
		throw error(400, 'messageIds array is required');
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

	// Update messages
	await db
		.update(messages)
		.set({ caseId: newCaseId || null })
		.where(inArray(messages.id, messageIds));

	return json({
		success: true,
		messagesUpdated: messageIds.length,
		newCaseId: newCaseId || null
	});
};
