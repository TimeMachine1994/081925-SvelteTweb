import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { cases, documents, invoices, messages } from '$lib/server/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'lawyer') {
		throw error(403, 'Unauthorized');
	}

	try {
		const lawyerId = locals.user.id;

		// Get all cases for this lawyer
		const lawyerCases = await db
			.select()
			.from(cases)
			.where(eq(cases.lawyerId, lawyerId));

		// Get all invoices for this lawyer's cases
		// This is a bit expensive if we don't join, but for stats it's okay for now
		// Better optimization would be raw SQL count queries, but staying with drizzle for consistency
		const allInvoices = await db
			.select({
				id: invoices.id,
				amount: invoices.amount,
				paidAmount: invoices.paidAmount,
				status: invoices.status
			})
			.from(invoices)
			.innerJoin(cases, eq(invoices.caseId, cases.id))
			.where(eq(cases.lawyerId, lawyerId));

		// Get all documents (count)
		// We could filter by case, but the original loader just grabbed *all* documents. 
		// Let's filter by lawyer's cases to be safe/correct
		const allDocuments = await db
			.select({ id: documents.id })
			.from(documents)
			.innerJoin(cases, eq(documents.caseId, cases.id))
			.where(eq(cases.lawyerId, lawyerId));

		// Calculate stats
		const totalCases = lawyerCases.length;
		const activeCases = lawyerCases.filter((c) => c.status === 'active').length;
		const totalDocuments = allDocuments.length;
		const paidInvoices = allInvoices.filter((i) => i.status === 'paid');
		const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

		// Get uncategorized messages count
		const uncategorizedCount = await db
			.select({ id: messages.id })
			.from(messages)
			.where(and(
				eq(messages.recipientId, lawyerId),
				isNull(messages.caseId)
			));

		return json({
			stats: {
				totalCases,
				activeCases,
				totalDocuments,
				totalRevenue,
				uncategorizedMessages: uncategorizedCount.length
			}
		});
	} catch (err) {
		console.error('Get stats error:', err);
		throw error(500, 'Failed to fetch dashboard stats');
	}
};
