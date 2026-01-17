import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { messages } from '$lib/server/db/schema';
import { generateId } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const { caseId, recipientId, content } = await request.json();

		if (!content || !content.trim()) {
			throw error(400, 'Message content is required');
		}

		const [message] = await db
			.insert(messages)
			.values({
				id: generateId(),
				caseId: caseId || null,
				senderId: locals.user.id,
				recipientId: recipientId || null,
				content: content.trim(),
				createdAt: new Date()
			})
			.returning();

		return json({ success: true, message });
	} catch (err) {
		console.error('Message send error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to send message');
	}
};
