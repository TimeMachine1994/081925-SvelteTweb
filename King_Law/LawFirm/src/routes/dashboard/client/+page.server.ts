import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	if (locals.user.role !== 'client') {
		redirect(302, '/dashboard/lawyer');
	}

	// Fetch client's cases with lawyer info
	const cases = await db
		.select({
			case: table.cases,
			lawyer: {
				id: table.user.id,
				firstName: table.user.firstName,
				lastName: table.user.lastName,
				email: table.user.email,
				phoneNumber: table.user.phoneNumber
			}
		})
		.from(table.cases)
		.innerJoin(table.user, eq(table.cases.lawyerId, table.user.id))
		.where(eq(table.cases.clientId, locals.user.id));

	// Get a default lawyer for clients without cases (first available lawyer)
	let defaultLawyer = null;
	if (cases.length === 0) {
		const lawyers = await db
			.select({
				id: table.user.id,
				firstName: table.user.firstName,
				lastName: table.user.lastName
			})
			.from(table.user)
			.where(eq(table.user.role, 'lawyer'))
			.limit(1);
		defaultLawyer = lawyers[0] || null;
	}

	// Fetch documents for all cases
	const caseIds = cases.map(c => c.case.id);
	const documents = caseIds.length > 0
		? await db
				.select()
				.from(table.documents)
				.where(eq(table.documents.caseId, caseIds[0]))
		: [];

	// Fetch invoices for all cases
	const invoices = caseIds.length > 0
		? await db
				.select()
				.from(table.invoices)
				.where(eq(table.invoices.caseId, caseIds[0]))
		: [];

	// Fetch recent messages with full sender details
	const messages = caseIds.length > 0
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
				.where(eq(table.messages.caseId, caseIds[0]))
				.orderBy(table.messages.createdAt)
		: [];

	return {
		user: locals.user,
		cases: cases.map(c => ({ ...c.case, lawyer: c.lawyer })),
		documents,
		invoices,
<<<<<<< HEAD
		messages,
		activeCaseId: caseIds[0] || null
=======
		messages: messages.map(m => ({ ...m.message, sender: m.sender })),
		defaultLawyer
>>>>>>> 12d6d5035b4dfe72b47c33d55eb1be392370c567
	};
};
