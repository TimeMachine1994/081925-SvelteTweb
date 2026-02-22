// @ts-nocheck
import { redirect, error } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load = async ({ locals, params }: Parameters<PageServerLoad>[0]) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		redirect(302, '/dashboard/client');
	}

	const clientId = params.id;

	// Fetch the client
	const client = await db.query.user.findFirst({
		where: and(
			eq(table.user.id, clientId),
			eq(table.user.role, 'client')
		)
	});

	if (!client) {
		throw error(404, 'Client not found');
	}

	// Fetch all cases for this client that belong to this lawyer
	const cases = await db
		.select()
		.from(table.cases)
		.where(and(
			eq(table.cases.clientId, clientId),
			eq(table.cases.lawyerId, locals.user.id)
		));

	// Fetch documents for all cases
	const caseIds = cases.map(c => c.id);
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
				.where(eq(table.cases.clientId, clientId))
		: [];

	// Fetch invoices for all cases
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
				.where(eq(table.cases.clientId, clientId))
		: [];

	// Calculate totals
	const totalInvoiced = invoices.reduce((sum, i) => sum + i.invoice.amount, 0);
	const totalPaid = invoices.reduce((sum, i) => sum + i.invoice.paidAmount, 0);

	return {
		user: locals.user,
		client: {
			id: client.id,
			firstName: client.firstName,
			lastName: client.lastName,
			email: client.email,
			phoneNumber: client.phoneNumber,
			createdAt: client.createdAt
		},
		cases,
		documents: documents.map(d => ({ ...d.document, case: d.case })),
		invoices: invoices.map(i => ({ ...i.invoice, case: i.case })),
		stats: {
			totalCases: cases.length,
			activeCases: cases.filter(c => c.status === 'active').length,
			totalDocuments: documents.length,
			totalInvoiced,
			totalPaid,
			outstanding: totalInvoiced - totalPaid
		}
	};
};
