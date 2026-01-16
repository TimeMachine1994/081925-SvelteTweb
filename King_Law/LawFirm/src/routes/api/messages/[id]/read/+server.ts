import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// PATCH - Mark message as read
export const PATCH: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const { id } = params;

	// Fetch message
	const [message] = await db
		.select()
		.from(table.messages)
		.where(eq(table.messages.id, id));

	if (!message) {
		error(404, 'Message not found');
	}

	// Verify user has access to the case
	const [caseData] = await db
		.select()
		.from(table.cases)
		.where(eq(table.cases.id, message.caseId));

	if (!caseData) {
		error(404, 'Case not found');
	}

	const hasAccess =
		caseData.clientId === locals.user.id ||
		caseData.lawyerId === locals.user.id;

	if (!hasAccess) {
		error(403, 'Access denied');
	}

	// Don't allow sender to mark their own message as read
	if (message.senderId === locals.user.id) {
		error(400, 'Cannot mark own message as read');
	}

	// Update read timestamp
	await db
		.update(table.messages)
		.set({ readAt: new Date() })
		.where(eq(table.messages.id, id));

	return json({ success: true });
};
