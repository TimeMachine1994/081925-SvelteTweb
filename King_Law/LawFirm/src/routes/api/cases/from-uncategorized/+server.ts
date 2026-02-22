import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { cases, messages, documents, user } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { generateId } from '$lib/server/auth';

// POST /api/cases/from-uncategorized - Create case from uncategorized messages/documents
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		throw error(403, 'Only lawyers can create cases');
	}

	const body = await request.json();
	const { clientId, title, description, messageIds, documentIds } = body;

	if (!clientId || !title) {
		throw error(400, 'clientId and title are required');
	}

	// Verify client exists
	const client = await db.query.user.findFirst({
		where: and(eq(user.id, clientId), eq(user.role, 'client'))
	});

	if (!client) {
		throw error(404, 'Client not found');
	}

	const caseId = generateId();
	const now = new Date();

	// Create the case
	await db.insert(cases).values({
		id: caseId,
		clientId,
		lawyerId: locals.user.id,
		title: title.trim(),
		description: description?.trim() || null,
		status: 'active',
		createdAt: now,
		updatedAt: now
	});

	let messagesUpdated = 0;
	let documentsUpdated = 0;

	// Move messages to new case
	if (messageIds && messageIds.length > 0) {
		const result = await db
			.update(messages)
			.set({ caseId })
			.where(inArray(messages.id, messageIds));
		messagesUpdated = messageIds.length;
	}

	// Move documents to new case
	if (documentIds && documentIds.length > 0) {
		await db
			.update(documents)
			.set({ caseId })
			.where(inArray(documents.id, documentIds));
		documentsUpdated = documentIds.length;
	}

	return json({
		case: {
			id: caseId,
			clientId,
			lawyerId: locals.user.id,
			title: title.trim(),
			description: description?.trim() || null,
			status: 'active',
			createdAt: now,
			updatedAt: now
		},
		messagesUpdated,
		documentsUpdated
	}, { status: 201 });
};
