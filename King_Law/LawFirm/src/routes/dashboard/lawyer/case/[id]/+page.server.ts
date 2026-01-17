import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { cases, documents, invoices, messages, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '$lib/server/auth';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user || (locals.user.role !== 'lawyer' && locals.user.role !== 'admin')) {
		throw redirect(303, '/login');
	}

	const caseId = params.id;

	const [caseData] = await db
		.select({
			case: cases,
			client: user
		})
		.from(cases)
		.innerJoin(user, eq(cases.clientId, user.id))
		.where(eq(cases.id, caseId))
		.limit(1);

	if (!caseData) {
		throw error(404, 'Case not found');
	}

	if (caseData.case.lawyerId !== locals.user.id && locals.user.role !== 'admin') {
		throw error(403, 'Access denied');
	}

	const caseDocuments = await db
		.select()
		.from(documents)
		.where(eq(documents.caseId, caseId));

	const caseInvoices = await db
		.select()
		.from(invoices)
		.where(eq(invoices.caseId, caseId));

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
		client: caseData.client,
		documents: caseDocuments,
		invoices: caseInvoices,
		messages: caseMessages
	};
};

export const actions: Actions = {
	updateStatus: async ({ request, params, locals }) => {
		if (!locals.user || (locals.user.role !== 'lawyer' && locals.user.role !== 'admin')) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const status = data.get('status')?.toString() as 'active' | 'pending' | 'closed';

		if (!status || !['active', 'pending', 'closed'].includes(status)) {
			return fail(400, { error: 'Invalid status' });
		}

		await db
			.update(cases)
			.set({ status, updatedAt: new Date() })
			.where(eq(cases.id, params.id));

		return { success: true };
	},

	createInvoice: async ({ request, params, locals }) => {
		if (!locals.user || (locals.user.role !== 'lawyer' && locals.user.role !== 'admin')) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const description = data.get('description')?.toString();
		const amount = parseFloat(data.get('amount')?.toString() || '0');
		const dueDate = data.get('dueDate')?.toString();

		if (!description || !amount || !dueDate) {
			return fail(400, { error: 'All fields are required' });
		}

		await db.insert(invoices).values({
			id: generateId(),
			caseId: params.id,
			description,
			amount: Math.round(amount * 100),
			dueDate: new Date(dueDate),
			status: 'unpaid',
			paidAmount: 0,
			createdAt: new Date()
		});

		return { success: true };
	}
};
