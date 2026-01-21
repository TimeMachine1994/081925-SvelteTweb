import { db } from '$lib/server/db';
import { messages, user, documents } from '$lib/server/db/schema';
import { isNull, desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'lawyer') {
		return { uncategorizedMessages: [] };
	}

	// Fetch messages that have no caseId (uncategorized/new client inquiries)
	const uncategorizedMessages = await db
		.select({
			message: messages,
			sender: {
				id: user.id,
				username: user.username,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				role: user.role
			},
			attachment: {
				id: documents.id,
				fileName: documents.fileName,
				fileSize: documents.fileSize,
				mimeType: documents.mimeType
			}
		})
		.from(messages)
		.innerJoin(user, eq(messages.senderId, user.id))
		.leftJoin(documents, eq(messages.attachmentDocumentId, documents.id))
		.where(isNull(messages.caseId))
		.orderBy(desc(messages.createdAt))
		.limit(50);

	return {
		uncategorizedMessages
	};
};
