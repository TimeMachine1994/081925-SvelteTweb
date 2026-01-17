import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { messages } from '$lib/server/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Get unread count per case
		const unreadCounts = await db
			.select({
				caseId: messages.caseId,
				count: sql<number>`count(*)`
			})
			.from(messages)
			.where(
				and(
					eq(messages.recipientId, locals.user.id),
					isNull(messages.readAt)
				)
			)
			.groupBy(messages.caseId);

		// Calculate total
		const total = unreadCounts.reduce((sum, item) => sum + item.count, 0);

		// Format by case
		const byCaseId: Record<string, number> = {};
		unreadCounts.forEach((item) => {
			if (item.caseId) {
				byCaseId[item.caseId] = item.count;
			}
		});

		return json({
			total,
			byCaseId,
			uncategorized: unreadCounts.find((item) => item.caseId === null)?.count || 0
		});
	} catch (err) {
		console.error('Unread count error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to get unread count');
	}
};
