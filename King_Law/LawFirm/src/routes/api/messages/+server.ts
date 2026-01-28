import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { messages, user as userTable, documents } from '$lib/server/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const caseId = url.searchParams.get('caseId');
		const uncategorized = url.searchParams.get('uncategorized') === 'true';

		let conditions = [
			or(eq(messages.senderId, locals.user.id), eq(messages.recipientId, locals.user.id))
		];

		if (uncategorized) {
			conditions.push(isNull(messages.caseId));
		} else if (caseId) {
			conditions.push(eq(messages.caseId, caseId));
		}

		const messageList = await db
			.select({
				message: messages,
				sender: userTable,
				attachment: documents
			})
			.from(messages)
			.leftJoin(userTable, eq(messages.senderId, userTable.id))
			.leftJoin(documents, eq(messages.attachmentDocumentId, documents.id))
			.where(and(...conditions))
			.orderBy(messages.createdAt);

		// Debug: Log what's being returned
		console.log('📬 Messages fetched:', messageList.map(m => ({
			id: m.message.id,
			content: m.message.content,
			createdAt: m.message.createdAt,
			senderName: m.sender?.firstName
		})));

		return json({ messages: messageList });
	} catch (err) {
		console.error('Get messages error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to fetch messages');
	}
};
