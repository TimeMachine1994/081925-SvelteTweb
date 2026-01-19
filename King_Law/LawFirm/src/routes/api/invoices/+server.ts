import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { invoices, cases } from '$lib/server/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { generateId } from '$lib/server/auth';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const caseId = url.searchParams.get('caseId');

		let userInvoices;
		if (caseId) {
			// Get invoices for specific case
			const [caseData] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);

			if (!caseData) {
				throw error(404, 'Case not found');
			}

			// Verify user has access to this case
			if (
				locals.user.role !== 'admin' &&
				caseData.clientId !== locals.user.id &&
				caseData.lawyerId !== locals.user.id
			) {
				throw error(403, 'Access denied');
			}

			userInvoices = await db.select().from(invoices).where(eq(invoices.caseId, caseId));
		} else if (locals.user.role === 'client') {
			// Get all invoices for client's cases
			const clientCases = await db
				.select()
				.from(cases)
				.where(eq(cases.clientId, locals.user.id));

			const caseIds = clientCases.map((c) => c.id);

			if (caseIds.length > 0) {
				userInvoices = await db
					.select()
					.from(invoices)
					.where(or(...caseIds.map((id) => eq(invoices.caseId, id))));
			} else {
				userInvoices = [];
			}
		} else {
			// Get all invoices for lawyer's cases
			const lawyerCases = await db
				.select()
				.from(cases)
				.where(eq(cases.lawyerId, locals.user.id));

			const caseIds = lawyerCases.map((c) => c.id);

			if (caseIds.length > 0) {
				userInvoices = await db
					.select()
					.from(invoices)
					.where(or(...caseIds.map((id) => eq(invoices.caseId, id))));
			} else {
				userInvoices = [];
			}
		}

		return json({ invoices: userInvoices });
	} catch (err) {
		console.error('Get invoices error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to fetch invoices');
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (locals.user.role === 'client') {
		throw error(403, 'Only lawyers can create invoices');
	}

	try {
		const { caseId, description, amount, dueDate } = await request.json();

		if (!caseId || !description || !amount || !dueDate) {
			throw error(400, 'caseId, description, amount, and dueDate are required');
		}

		// Verify case exists and lawyer has access
		const [caseData] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);

		if (!caseData) {
			throw error(404, 'Case not found');
		}

		if (locals.user.role !== 'admin' && caseData.lawyerId !== locals.user.id) {
			throw error(403, 'You can only create invoices for your own cases');
		}

		const invoiceId = generateId();
		const [newInvoice] = await db
			.insert(invoices)
			.values({
				id: invoiceId,
				caseId,
				description,
				amount: parseInt(amount),
				dueDate: Math.floor(new Date(dueDate).getTime() / 1000),
				status: 'unpaid',
				paidAmount: 0
			})
			.returning();

		return json({ success: true, invoice: newInvoice });
	} catch (err) {
		console.error('Create invoice error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to create invoice');
	}
};
