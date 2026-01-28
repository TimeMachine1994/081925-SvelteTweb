import { json, error, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { messages, documents, cases } from '$lib/server/db/schema';
import { like, or, eq, inArray } from 'drizzle-orm';

export const POST = async ({ request, locals }: RequestEvent) => {
	// Security: Only allow cleanup of test data (prefix-based)
	// This is safe because it only deletes items with E2E_TEST_ prefix

	// Security: Require admin or lawyer authentication
	if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'lawyer')) {
		throw error(401, 'Admin or lawyer authentication required');
	}

	try {
		const { prefix, userId } = await request.json();

		const deletedCounts = {
			messages: 0,
			documents: 0,
			cases: 0
		};

		// Cleanup by prefix (e.g., "E2E_TEST_")
		if (prefix) {
			// Get messages with prefix in content
			const messagesToDelete = await db
				.select({ id: messages.id })
				.from(messages)
				.where(like(messages.content, `${prefix}%`));

			if (messagesToDelete.length > 0) {
				await db
					.delete(messages)
					.where(inArray(messages.id, messagesToDelete.map((m) => m.id)));
				deletedCounts.messages = messagesToDelete.length;
			}

			// Get cases with prefix in title
			const casesToDelete = await db
				.select({ id: cases.id })
				.from(cases)
				.where(like(cases.title, `${prefix}%`));

			if (casesToDelete.length > 0) {
				// First delete related messages
				for (const c of casesToDelete) {
					await db.delete(messages).where(eq(messages.caseId, c.id));
				}
				// Then delete cases
				await db.delete(cases).where(inArray(cases.id, casesToDelete.map((c) => c.id)));
				deletedCounts.cases = casesToDelete.length;
			}

			// Get documents with prefix in fileName
			const docsToDelete = await db
				.select({ id: documents.id })
				.from(documents)
				.where(like(documents.fileName, `${prefix}%`));

			if (docsToDelete.length > 0) {
				await db
					.delete(documents)
					.where(inArray(documents.id, docsToDelete.map((d) => d.id)));
				deletedCounts.documents = docsToDelete.length;
			}
		}

		// Cleanup by user ID
		if (userId) {
			// Delete all messages from/to this user
			const userMessages = await db
				.select({ id: messages.id })
				.from(messages)
				.where(or(eq(messages.senderId, userId), eq(messages.recipientId, userId)));

			if (userMessages.length > 0) {
				await db
					.delete(messages)
					.where(inArray(messages.id, userMessages.map((m) => m.id)));
				deletedCounts.messages += userMessages.length;
			}

			// Delete all cases for this user (as client)
			const userCases = await db
				.select({ id: cases.id })
				.from(cases)
				.where(eq(cases.clientId, userId));

			if (userCases.length > 0) {
				await db.delete(cases).where(inArray(cases.id, userCases.map((c) => c.id)));
				deletedCounts.cases += userCases.length;
			}
		}

		return json({
			success: true,
			deleted: deletedCounts,
			message: 'Test data cleaned up successfully'
		});
	} catch (err) {
		console.error('Test cleanup error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to cleanup test data');
	}
};
