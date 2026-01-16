import { redirect } from '@sveltejs/kit';
import { eq, isNull, and, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		redirect(302, '/dashboard/client');
	}

	// Fetch lawyer's cases with client information
	const cases = await db
		.select({
			case: table.cases,
			client: {
				id: table.user.id,
				firstName: table.user.firstName,
				lastName: table.user.lastName,
				email: table.user.email,
				phoneNumber: table.user.phoneNumber
			}
		})
		.from(table.cases)
		.innerJoin(table.user, eq(table.cases.clientId, table.user.id))
		.where(eq(table.cases.lawyerId, locals.user.id));

	// Get unique clients from cases
	const clientMap = new Map();
	cases.forEach(c => {
		if (!clientMap.has(c.client.id)) {
			clientMap.set(c.client.id, {
				...c.client,
				caseCount: 1
			});
		} else {
			clientMap.get(c.client.id).caseCount++;
		}
	});
	const clients = Array.from(clientMap.values());

	// Fetch uncategorized messages (messages with no case, sent to this lawyer)
	const uncategorizedMessages = await db
		.select({
			message: table.messages,
			sender: {
				id: table.user.id,
				firstName: table.user.firstName,
				lastName: table.user.lastName,
				email: table.user.email
			}
		})
		.from(table.messages)
		.innerJoin(table.user, eq(table.messages.senderId, table.user.id))
		.where(and(
			isNull(table.messages.caseId),
			eq(table.messages.recipientId, locals.user.id)
		))
		.orderBy(table.messages.createdAt);

	// Group uncategorized messages by sender
	const uncategorizedByClient = new Map();
	uncategorizedMessages.forEach(m => {
		const senderId = m.sender.id;
		if (!uncategorizedByClient.has(senderId)) {
			uncategorizedByClient.set(senderId, {
				client: m.sender,
				messages: [],
				unreadCount: 0
			});
		}
		uncategorizedByClient.get(senderId).messages.push(m.message);
		if (!m.message.readAt) {
			uncategorizedByClient.get(senderId).unreadCount++;
		}
	});
	const uncategorizedThreads = Array.from(uncategorizedByClient.values());

	// Fetch all documents
	const caseIds = cases.map(c => c.case.id);
	const documents = caseIds.length > 0
		? await db
				.select({
					document: table.documents,
					case: {
						id: table.cases.id,
						title: table.cases.title
					}
				})
				.from(table.documents)
				.innerJoin(table.cases, eq(table.documents.caseId, table.cases.id))
				.where(eq(table.cases.lawyerId, locals.user.id))
		: [];

	// Fetch all invoices
	const invoices = caseIds.length > 0
		? await db
				.select({
					invoice: table.invoices,
					case: {
						id: table.cases.id,
						title: table.cases.title
					}
				})
				.from(table.invoices)
				.innerJoin(table.cases, eq(table.invoices.caseId, table.cases.id))
				.where(eq(table.cases.lawyerId, locals.user.id))
		: [];

	// Fetch recent messages with full details for MessagePanel
	const activeCaseId = caseIds.length > 0 ? caseIds[0] : null;
	const messages = activeCaseId
		? await db
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
				.where(eq(table.messages.caseId, activeCaseId))
				.orderBy(table.messages.createdAt)
		: [];

	return {
		user: locals.user,
		cases: cases.map(c => ({ ...c.case, client: c.client })),
		clients,
		documents: documents.map(d => ({ ...d.document, case: d.case })),
		invoices: invoices.map(i => ({ ...i.invoice, case: i.case })),
		messages: messages.map(m => ({ ...m.message, sender: m.sender, case: m.case })),
		uncategorizedThreads
	};
};
