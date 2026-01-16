import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, desc, and, or } from 'drizzle-orm';

// POST - Send new message
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const { caseId, content, attachmentDocumentId } = await request.json();

	if (!caseId || !content) {
		error(400, 'Case ID and content are required');
	}

	// Verify user has access to this case
	const [caseData] = await db
		.select()
		.from(table.cases)
		.where(eq(table.cases.id, caseId));

	if (!caseData) {
		error(404, 'Case not found');
	}

	// Check if user is client or lawyer on this case
	const hasAccess =
		caseData.clientId === locals.user.id ||
		caseData.lawyerId === locals.user.id;

	if (!hasAccess) {
		error(403, 'Access denied');
	}

	// Create message
	const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(7);
	
	await db.insert(table.messages).values({
		id: messageId,
		caseId: caseId,
		senderId: locals.user.id,
		content: content,
		attachmentDocumentId: attachmentDocumentId || null,
		createdAt: new Date(),
		readAt: null
	});

	// Fetch the created message with sender details
	const [message] = await db
		.select({
			id: table.messages.id,
			caseId: table.messages.caseId,
			senderId: table.messages.senderId,
			content: table.messages.content,
			attachmentDocumentId: table.messages.attachmentDocumentId,
			createdAt: table.messages.createdAt,
			readAt: table.messages.readAt,
			senderName: table.user.firstName,
			senderLastName: table.user.lastName,
			senderRole: table.user.role
		})
		.from(table.messages)
		.innerJoin(table.user, eq(table.messages.senderId, table.user.id))
		.where(eq(table.messages.id, messageId));

	return json({ message }, { status: 201 });
};
