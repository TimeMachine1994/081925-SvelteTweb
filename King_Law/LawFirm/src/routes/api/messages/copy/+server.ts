import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { messages, cases } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { generateId } from '$lib/server/auth';

// POST /api/messages/copy - Copy messages to a different case
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		throw error(403, 'Only lawyers can copy messages');
	}

	const body = await request.json();
	const { messageIds, targetCaseId } = body;

	if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
		throw error(400, 'messageIds array is required');
	}

	if (!targetCaseId) {
		throw error(400, 'targetCaseId is required');
	}

	// Verify the target case exists and belongs to this lawyer
	const targetCase = await db.query.cases.findFirst({
		where: eq(cases.id, targetCaseId)
	});

	if (!targetCase) {
		throw error(404, 'Target case not found');
	}

	if (targetCase.lawyerId !== locals.user.id && locals.user.role !== 'admin') {
		throw error(403, 'Cannot copy to a case you do not own');
	}

	// Fetch original messages
	const originalMessages = await db
		.select()
		.from(messages)
		.where(inArray(messages.id, messageIds));

	if (originalMessages.length === 0) {
		throw error(404, 'No messages found to copy');
	}

	// Create copies
	const now = new Date();
	const copiedMessages = originalMessages.map(msg => ({
		id: generateId(),
		caseId: targetCaseId,
		recipientId: msg.recipientId,
		senderId: msg.senderId,
		content: msg.content,
		attachmentDocumentId: msg.attachmentDocumentId,
		createdAt: now,
		readAt: null
	}));

	await db.insert(messages).values(copiedMessages);

	return json({
		success: true,
		copiedCount: copiedMessages.length,
		targetCaseId
	}, { status: 201 });
};
