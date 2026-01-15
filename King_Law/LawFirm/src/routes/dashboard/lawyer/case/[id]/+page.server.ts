import { redirect, error } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		redirect(302, '/dashboard/client');
	}

	const caseId = params.id;

	// Fetch the case with client info
	const caseResult = await db
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
		.where(and(
			eq(table.cases.id, caseId),
			eq(table.cases.lawyerId, locals.user.id)
		));

	if (caseResult.length === 0) {
		throw error(404, 'Case not found');
	}

	const caseData = { ...caseResult[0].case, client: caseResult[0].client };

	// Fetch documents for this case
	const documents = await db
		.select({
			document: table.documents,
			uploader: {
				firstName: table.user.firstName,
				lastName: table.user.lastName
			}
		})
		.from(table.documents)
		.innerJoin(table.user, eq(table.documents.uploadedById, table.user.id))
		.where(eq(table.documents.caseId, caseId));

	// Fetch invoices for this case
	const invoices = await db
		.select()
		.from(table.invoices)
		.where(eq(table.invoices.caseId, caseId));

	// Fetch messages for this case
	const messages = await db
		.select({
			message: table.messages,
			sender: {
				firstName: table.user.firstName,
				lastName: table.user.lastName,
				role: table.user.role
			}
		})
		.from(table.messages)
		.innerJoin(table.user, eq(table.messages.senderId, table.user.id))
		.where(eq(table.messages.caseId, caseId))
		.orderBy(table.messages.createdAt);

	// Get all cases for this lawyer (for move/copy dropdown)
	const allCases = await db
		.select({
			id: table.cases.id,
			title: table.cases.title
		})
		.from(table.cases)
		.where(eq(table.cases.lawyerId, locals.user.id));

	return {
		user: locals.user,
		case: caseData,
		documents: documents.map(d => ({ ...d.document, uploader: d.uploader })),
		invoices,
		messages: messages.map(m => ({ ...m.message, sender: m.sender })),
		allCases
	};
};
