import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { messages, user } from '$lib/server/db/schema';
import { eq, and, or, gt } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const caseId = url.searchParams.get('caseId');
		const since = url.searchParams.get('since');

		if (!since) {
			throw error(400, 'since parameter is required (ISO timestamp)');
		}

		const sinceDate = new Date(since);
		if (isNaN(sinceDate.getTime())) {
			throw error(400, 'Invalid since timestamp');
		}

		// Build query conditions
		const conditions = [
			gt(messages.createdAt, sinceDate),
			or(
				eq(messages.senderId, locals.user.id),
				eq(messages.recipientId, locals.user.id)
			)
		];

		if (caseId) {
			conditions.push(eq(messages.caseId, caseId));
		}

		// Fetch new messages with sender info
		const newMessages = await db
			.select({
				message: messages,
				sender: {
					id: user.id,
					username: user.username,
					firstName: user.firstName,
					lastName: user.lastName,
					role: user.role
				}
			})
			.from(messages)
			.leftJoin(user, eq(messages.senderId, user.id))
			.where(and(...conditions))
			.orderBy(messages.createdAt);

		return json({
			messages: newMessages,
			count: newMessages.length
		});
	} catch (err) {
		console.error('Message poll error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to poll messages');
	}
};
