import { db } from '$lib/server/db';
import { cases, documents, invoices, messages } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	// Load client's cases
	const userCases = await db
		.select()
		.from(cases)
		.where(eq(cases.clientId, userId));

	const caseIds = userCases.map((c) => c.id);

	// Load documents
	const userDocuments = caseIds.length > 0
		? await db
				.select()
				.from(documents)
				.where(eq(documents.uploadedById, userId))
				.limit(5)
		: [];

	// Load invoices
	const userInvoices = caseIds.length > 0
		? await db
				.select()
				.from(invoices)
				.orderBy(invoices.createdAt)
		: [];

	// Load messages
	const userMessages = caseIds.length > 0
		? await db
				.select()
				.from(messages)
				.where(eq(messages.senderId, userId))
				.limit(10)
		: [];

	// Calculate stats
	const activeCases = userCases.filter((c) => c.status === 'active' || c.status === 'open').length;
	const unpaidInvoices = userInvoices.filter((i) => i.status !== 'paid');
	const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);
	const unreadMessages = userMessages.filter((m) => !m.readAt).length;

	return {
		cases: userCases,
		documents: userDocuments,
		invoices: userInvoices,
		stats: {
			activeCases,
			totalUnpaid,
			unreadMessages,
			documentsCount: userDocuments.length
		}
	};
};
