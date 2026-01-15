import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { messages, cases } from '$lib/server/db/schema';
import { eq, and, isNull, ne, or, inArray, sql } from 'drizzle-orm';

// GET /api/messages/unread - Get unread message count for current user
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const userId = locals.user.id;
	const userRole = locals.user.role;

	// Get all cases the user has access to
	let userCases;
	if (userRole === 'client') {
		userCases = await db
			.select({ id: cases.id })
			.from(cases)
			.where(eq(cases.clientId, userId));
	} else if (userRole === 'lawyer') {
		userCases = await db
			.select({ id: cases.id })
			.from(cases)
			.where(eq(cases.lawyerId, userId));
	} else {
		// Admin sees all cases
		userCases = await db.select({ id: cases.id }).from(cases);
	}

	if (userCases.length === 0) {
		return json({ unreadCount: 0, unreadByCaseId: {} });
	}

	const caseIds = userCases.map((c) => c.id);

	// Count unread messages (messages not sent by current user and not read)
	const unreadMessages = await db
		.select({
			caseId: messages.caseId,
			count: sql<number>`count(*)`.as('count')
		})
		.from(messages)
		.where(
			and(
				inArray(messages.caseId, caseIds),
				ne(messages.senderId, userId),
				isNull(messages.readAt)
			)
		)
		.groupBy(messages.caseId);

	// Build response
	const unreadByCaseId: Record<string, number> = {};
	let totalUnread = 0;

	for (const row of unreadMessages) {
		unreadByCaseId[row.caseId] = row.count;
		totalUnread += row.count;
	}

	return json({
		unreadCount: totalUnread,
		unreadByCaseId
	});
};
