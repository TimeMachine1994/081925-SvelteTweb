import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
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

	// Fetch recent messages
	const messages = caseIds.length > 0
		? await db
				.select({
					message: table.messages,
					sender: {
						firstName: table.user.firstName,
						lastName: table.user.lastName
					},
					case: {
						id: table.cases.id,
						title: table.cases.title
					}
				})
				.from(table.messages)
				.innerJoin(table.user, eq(table.messages.senderId, table.user.id))
				.innerJoin(table.cases, eq(table.messages.caseId, table.cases.id))
				.where(eq(table.cases.lawyerId, locals.user.id))
				.limit(10)
		: [];

	return {
		user: locals.user,
		cases: cases.map(c => ({ ...c.case, client: c.client })),
		documents: documents.map(d => ({ ...d.document, case: d.case })),
		invoices: invoices.map(i => ({ ...i.invoice, case: i.case })),
		messages: messages.map(m => ({ ...m.message, sender: m.sender, case: m.case }))
	};
};
