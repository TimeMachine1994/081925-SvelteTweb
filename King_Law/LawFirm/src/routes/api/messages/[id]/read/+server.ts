import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { messages, cases } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// PATCH /api/messages/[id]/read - Mark a message as read
export const PATCH: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const messageId = params.id;

	// Get the message
	const message = await db.query.messages.findFirst({
		where: eq(messages.id, messageId)
	});

	if (!message) {
		throw error(404, 'Message not found');
	}

	// Get the case to verify access
	const caseRecord = await db.query.cases.findFirst({
		where: eq(cases.id, message.caseId)
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

	// Don't mark your own messages as read (they're always "read" by you)
	if (message.senderId === locals.user.id) {
		return json({ success: true, message: 'Own message - no action needed' });
	}

	// Mark as read
	await db
		.update(messages)
		.set({ readAt: new Date() })
		.where(eq(messages.id, messageId));

	return json({ success: true });
};
