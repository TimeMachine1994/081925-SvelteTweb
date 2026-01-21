import { json, error, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { messages, documents, cases, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const POST = async ({ request, locals }: RequestEvent) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		throw error(403, 'Only lawyers can assign messages to cases');
	}

	try {
		const body = await request.json();
		const { messageId, caseId, createNewCase, caseTitle, caseDescription } = body;

		if (!messageId) {
			throw error(400, 'messageId is required');
		}

		if (!caseId && !createNewCase) {
			throw error(400, 'Either caseId or createNewCase is required');
		}

		if (createNewCase && !caseTitle) {
			throw error(400, 'caseTitle is required when creating a new case');
		}

		// Get the message with sender info
		const [messageData] = await db
			.select({
				message: messages,
				sender: user
			})
			.from(messages)
			.innerJoin(user, eq(messages.senderId, user.id))
			.where(eq(messages.id, messageId))
			.limit(1);

		if (!messageData) {
			throw error(404, 'Message not found');
		}

		let targetCaseId = caseId;

		// Create new case if requested
		if (createNewCase) {
			const newCaseId = nanoid();
			await db.insert(cases).values({
				id: newCaseId,
				title: caseTitle,
				description: caseDescription || null,
				clientId: messageData.sender.id,
				lawyerId: locals.user.id,
				status: 'open'
			});
			targetCaseId = newCaseId;
		} else {
			// Verify the case exists and belongs to this lawyer
			const [existingCase] = await db
				.select()
				.from(cases)
				.where(eq(cases.id, caseId))
				.limit(1);

			if (!existingCase) {
				throw error(404, 'Case not found');
			}

			if (existingCase.lawyerId !== locals.user.id && locals.user.role !== 'admin') {
				throw error(403, 'You do not have access to this case');
			}

			// Update the case's clientId if it's different
			if (existingCase.clientId !== messageData.sender.id) {
				await db
					.update(cases)
					.set({ clientId: messageData.sender.id })
					.where(eq(cases.id, caseId));
			}
		}

		// Update the message's caseId
		await db
			.update(messages)
			.set({ caseId: targetCaseId })
			.where(eq(messages.id, messageId));

		// If the message has an attachment, update the document's caseId too
		if (messageData.message.attachmentDocumentId) {
			await db
				.update(documents)
				.set({ caseId: targetCaseId })
				.where(eq(documents.id, messageData.message.attachmentDocumentId));
		}

		// Get the updated case info
		const [updatedCase] = await db
			.select()
			.from(cases)
			.where(eq(cases.id, targetCaseId))
			.limit(1);

		return json({
			success: true,
			message: 'Message assigned to case successfully',
			case: updatedCase,
			messageId,
			clientLinked: messageData.sender.id
		});
	} catch (err) {
		console.error('Assign message error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to assign message to case');
	}
};
