import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { messages } from '$lib/server/db/schema';
import { inArray, eq, and, isNull } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const { messageIds } = await request.json();

		if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
			throw error(400, 'Message IDs array is required');
		}

		// Mark messages as read (only if user is recipient and not already read)
		await db
			.update(messages)
			.set({ readAt: new Date() })
			.where(
				and(
					inArray(messages.id, messageIds),
					eq(messages.recipientId, locals.user.id),
					isNull(messages.readAt)
				)
			);

		return json({ success: true, marked: messageIds.length });
	} catch (err) {
		console.error('Mark read error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to mark messages as read');
	}
};
