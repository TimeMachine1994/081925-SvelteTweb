import { json, error, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { messages as messageTable } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';

export const POST = async ({ request, locals }: RequestEvent) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		throw error(403, 'Only lawyers can link messages to cases');
	}

	try {
		const { caseId, messageIds } = await request.json();

		if (!caseId || !Array.isArray(messageIds) || messageIds.length === 0) {
			throw error(400, 'caseId and messageIds are required');
		}

		// Update all messages to link to the case
		await db
			.update(messageTable)
			.set({ caseId })
			.where(inArray(messageTable.id, messageIds));

		return json({ 
			success: true, 
			message: `${messageIds.length} messages linked to case` 
		});
	} catch (err) {
		console.error('Link messages error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to link messages to case');
	}
};
