import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { messages, cases } from '$lib/server/db/schema';
import { eq, and, isNull, ne } from 'drizzle-orm';
import { broadcastMessageRead } from '$lib/server/websocket';

// POST /api/messages/mark-read - Mark all messages in a case as read
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { caseId } = body;

	if (!caseId) {
		throw error(400, 'caseId is required');
	}

	// Get the case to verify access
	const caseRecord = await db.query.cases.findFirst({
		where: eq(cases.id, caseId)
	});

	if (!caseRecord) {
		throw error(404, 'Case not found');
	}

	// Check if user has access to this case
	const isClient = caseRecord.clientId === locals.user.id;
	const isLawyer = caseRecord.lawyerId === locals.user.id;
	const isAdmin = locals.user.role === 'admin';

	if (!isClient && !isLawyer && !isAdmin) {
		throw error(403, 'Access denied');
	}

	// Get unread messages before marking as read (to notify senders)
	const unreadMessages = await db
		.select({ id: messages.id, senderId: messages.senderId })
		.from(messages)
		.where(
			and(
				eq(messages.caseId, caseId),
				ne(messages.senderId, locals.user.id),
				isNull(messages.readAt)
			)
		);

	// Mark all unread messages (not sent by current user) as read
	await db
		.update(messages)
		.set({ readAt: new Date() })
		.where(
			and(
				eq(messages.caseId, caseId),
				ne(messages.senderId, locals.user.id),
				isNull(messages.readAt)
			)
		);

	// Broadcast read receipts to message senders
	const uniqueSenders = new Set(unreadMessages.map(m => m.senderId));
	unreadMessages.forEach(msg => {
		broadcastMessageRead(msg.senderId, msg.id);
	});

	return json({ success: true });
};
