import { db } from '$lib/server/db';
import { cases, documents, invoices, messages, user } from '$lib/server/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const lawyerId = locals.user!.id;

	// Load all lawyer's cases with client info
	const lawyerCases = await db
		.select({
			case: cases,
			client: user
		})
		.from(cases)
		.innerJoin(user, eq(cases.clientId, user.id))
		.where(eq(cases.lawyerId, lawyerId));

	// Load all documents
	const allDocuments = await db
		.select()
		.from(documents)
		.limit(10);

	// Load all invoices
	const allInvoices = await db
		.select()
		.from(invoices)
		.limit(10);

	// Load uncategorized messages (messages without a case)
	const uncategorizedMessages = await db
		.select({
			message: messages,
			sender: user
		})
		.from(messages)
		.innerJoin(user, eq(messages.senderId, user.id))
		.where(isNull(messages.caseId))
		.limit(20);

	// Calculate stats
	const totalCases = lawyerCases.length;
	const activeCases = lawyerCases.filter((c) => c.case.status === 'active').length;
	const totalDocuments = allDocuments.length;
	const paidInvoices = allInvoices.filter((i) => i.status === 'paid');
	const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

	// Group uncategorized messages by client
	const messagesByClient = uncategorizedMessages.reduce((acc, { message, sender }) => {
		const clientId = message.senderId;
		if (!acc[clientId]) {
			acc[clientId] = {
				client: sender,
				messages: []
			};
		}
		acc[clientId].messages.push(message);
		return acc;
	}, {} as Record<string, { client: any; messages: any[] }>);

	return {
		cases: lawyerCases,
		documents: allDocuments,
		invoices: allInvoices,
		uncategorizedThreads: Object.values(messagesByClient),
		stats: {
			totalCases,
			activeCases,
			totalDocuments,
			totalRevenue
		}
	};
};
