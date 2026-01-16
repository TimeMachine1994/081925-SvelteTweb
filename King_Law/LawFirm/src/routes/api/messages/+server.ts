import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
<<<<<<< HEAD
import * as table from '$lib/server/db/schema';
import { eq, desc, and, or } from 'drizzle-orm';

// POST - Send new message
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const { caseId, content, attachmentDocumentId } = await request.json();

	if (!caseId || !content) {
		error(400, 'Case ID and content are required');
	}

	// Verify user has access to this case
	const [caseData] = await db
		.select()
		.from(table.cases)
		.where(eq(table.cases.id, caseId));

	if (!caseData) {
		error(404, 'Case not found');
	}

	// Check if user is client or lawyer on this case
	const hasAccess =
		caseData.clientId === locals.user.id ||
		caseData.lawyerId === locals.user.id;

	if (!hasAccess) {
		error(403, 'Access denied');
	}

	// Create message
	const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(7);
	
	await db.insert(table.messages).values({
		id: messageId,
		caseId: caseId,
		senderId: locals.user.id,
		content: content,
		attachmentDocumentId: attachmentDocumentId || null,
		createdAt: new Date(),
		readAt: null
	});

	// Fetch the created message with sender details
	const [message] = await db
		.select({
			id: table.messages.id,
			caseId: table.messages.caseId,
			senderId: table.messages.senderId,
			content: table.messages.content,
			attachmentDocumentId: table.messages.attachmentDocumentId,
			createdAt: table.messages.createdAt,
			readAt: table.messages.readAt,
			senderName: table.user.firstName,
			senderLastName: table.user.lastName,
			senderRole: table.user.role
		})
		.from(table.messages)
		.innerJoin(table.user, eq(table.messages.senderId, table.user.id))
		.where(eq(table.messages.id, messageId));

	return json({ message }, { status: 201 });
=======
import { messages, cases, user, documents } from '$lib/server/db/schema';
import { eq, and, desc, or, isNull } from 'drizzle-orm';
import { generateId } from '$lib/server/auth';

// GET /api/messages?caseId={id} or ?uncategorized=true&clientId={id} - Get messages
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const caseId = url.searchParams.get('caseId');
	const uncategorized = url.searchParams.get('uncategorized') === 'true';
	const clientId = url.searchParams.get('clientId');

	// Handle uncategorized messages (lawyer viewing client's uncategorized messages)
	if (uncategorized) {
		if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
			throw error(403, 'Only lawyers can view uncategorized messages');
		}

		let whereClause;
		if (clientId) {
			// Get uncategorized messages from specific client
			whereClause = and(
				isNull(messages.caseId),
				or(
					eq(messages.senderId, clientId),
					eq(messages.recipientId, clientId)
				)
			);
		} else {
			// Get all uncategorized messages for this lawyer
			whereClause = and(
				isNull(messages.caseId),
				eq(messages.recipientId, locals.user.id)
			);
		}

		const uncatMessages = await db
			.select({
				id: messages.id,
				caseId: messages.caseId,
				senderId: messages.senderId,
				recipientId: messages.recipientId,
				content: messages.content,
				attachmentDocumentId: messages.attachmentDocumentId,
				createdAt: messages.createdAt,
				readAt: messages.readAt,
				senderFirstName: user.firstName,
				senderLastName: user.lastName,
				senderRole: user.role
			})
			.from(messages)
			.leftJoin(user, eq(messages.senderId, user.id))
			.where(whereClause)
			.orderBy(messages.createdAt);

		return json({ messages: uncatMessages });
	}

	// Handle case-based messages
	if (!caseId) {
		throw error(400, 'caseId is required (or use uncategorized=true)');
	}

	// Verify user has access to this case
	const caseRecord = await db.query.cases.findFirst({
		where: eq(cases.id, caseId)
	});

	if (!caseRecord) {
		throw error(404, 'Case not found');
	}

	// Check if user is the client or lawyer for this case
	const isClient = caseRecord.clientId === locals.user.id;
	const isLawyer = caseRecord.lawyerId === locals.user.id;
	const isAdmin = locals.user.role === 'admin';

	if (!isClient && !isLawyer && !isAdmin) {
		throw error(403, 'Access denied to this case');
	}

	// Get messages for this case with sender info and attachment details
	const caseMessages = await db
		.select({
			id: messages.id,
			caseId: messages.caseId,
			senderId: messages.senderId,
			content: messages.content,
			attachmentDocumentId: messages.attachmentDocumentId,
			createdAt: messages.createdAt,
			readAt: messages.readAt,
			senderFirstName: user.firstName,
			senderLastName: user.lastName,
			senderRole: user.role,
			attachmentFileName: documents.fileName,
			attachmentFileSize: documents.fileSize
		})
		.from(messages)
		.leftJoin(user, eq(messages.senderId, user.id))
		.leftJoin(documents, eq(messages.attachmentDocumentId, documents.id))
		.where(eq(messages.caseId, caseId))
		.orderBy(messages.createdAt);

	return json({ messages: caseMessages });
};

// POST /api/messages - Send a new message (with or without case)
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { caseId, recipientId, content, attachmentDocumentId } = body;

	if (!content) {
		throw error(400, 'content is required');
	}

	let targetCaseId = caseId || null;
	let targetRecipientId = recipientId || null;

	// If caseId provided, verify access
	if (caseId) {
		const caseRecord = await db.query.cases.findFirst({
			where: eq(cases.id, caseId)
		});

		if (!caseRecord) {
			throw error(404, 'Case not found');
		}

		const isClient = caseRecord.clientId === locals.user.id;
		const isLawyer = caseRecord.lawyerId === locals.user.id;
		const isAdmin = locals.user.role === 'admin';

		if (!isClient && !isLawyer && !isAdmin) {
			throw error(403, 'Access denied to this case');
		}

		// Set recipient based on sender role
		if (isClient) {
			targetRecipientId = caseRecord.lawyerId;
		} else {
			targetRecipientId = caseRecord.clientId;
		}
	} else {
		// Uncategorized message - must have recipientId
		if (!recipientId && locals.user.role === 'client') {
			throw error(400, 'recipientId required for uncategorized messages');
		}
	}

	const messageId = generateId();
	const now = new Date();

	await db.insert(messages).values({
		id: messageId,
		caseId: targetCaseId,
		recipientId: targetRecipientId,
		senderId: locals.user.id,
		content: content.trim(),
		attachmentDocumentId: attachmentDocumentId || null,
		createdAt: now,
		readAt: null
	});

	// Return the created message with sender info
	const newMessage = {
		id: messageId,
		caseId: targetCaseId,
		recipientId: targetRecipientId,
		senderId: locals.user.id,
		content: content.trim(),
		attachmentDocumentId: attachmentDocumentId || null,
		createdAt: now,
		readAt: null,
		senderFirstName: locals.user.firstName,
		senderLastName: locals.user.lastName,
		senderRole: locals.user.role
	};

	return json({ message: newMessage }, { status: 201 });
>>>>>>> 12d6d5035b4dfe72b47c33d55eb1be392370c567
};
