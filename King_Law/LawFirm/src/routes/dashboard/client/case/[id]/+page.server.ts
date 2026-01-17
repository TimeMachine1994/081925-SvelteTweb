import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { cases, documents, invoices, messages, user } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const caseId = params.id;

	// Get case with lawyer info
	const [caseData] = await db
		.select({
			case: cases,
			lawyer: user
		})
		.from(cases)
		.innerJoin(user, eq(cases.lawyerId, user.id))
		.where(and(eq(cases.id, caseId), eq(cases.clientId, locals.user.id)))
		.limit(1);

	if (!caseData) {
		throw error(404, 'Case not found or access denied');
	}

	// Get case documents
	const caseDocuments = await db
		.select()
		.from(documents)
		.where(eq(documents.caseId, caseId));

	// Get case invoices
	const caseInvoices = await db
		.select()
		.from(invoices)
		.where(eq(invoices.caseId, caseId));

	// Get case messages
	const caseMessages = await db
		.select({
			message: messages,
			sender: user
		})
		.from(messages)
		.innerJoin(user, eq(messages.senderId, user.id))
		.where(eq(messages.caseId, caseId));

	return {
		case: caseData.case,
		lawyer: caseData.lawyer,
		documents: caseDocuments,
		invoices: caseInvoices,
		messages: caseMessages
	};
};
