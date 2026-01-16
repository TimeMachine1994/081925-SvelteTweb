import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, desc, and, or } from 'drizzle-orm';

// GET - Fetch messages for a case
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const { caseId } = params;

	// Verify user has access to this case
	const [caseData] = await db
		.select()
		.from(table.cases)
		.where(eq(table.cases.id, caseId));

	if (!caseData) {
		error(404, 'Case not found');
	}

	const hasAccess =
		caseData.clientId === locals.user.id ||
		caseData.lawyerId === locals.user.id;

	if (!hasAccess) {
		error(403, 'Access denied');
	}

	// Fetch messages with sender details
	const messages = await db
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
		.where(eq(table.messages.caseId, caseId))
		.orderBy(desc(table.messages.createdAt));

	// Mark unread messages as read if user is not the sender
	const unreadMessageIds = messages
		.filter((msg) => !msg.readAt && msg.senderId !== locals.user.id)
		.map((msg) => msg.id);

	if (unreadMessageIds.length > 0) {
		await db
			.update(table.messages)
			.set({ readAt: new Date() })
			.where(
				and(
					eq(table.messages.caseId, caseId),
					or(...unreadMessageIds.map((id) => eq(table.messages.id, id)))
				)
			);
	}

	return json({ messages });
};
