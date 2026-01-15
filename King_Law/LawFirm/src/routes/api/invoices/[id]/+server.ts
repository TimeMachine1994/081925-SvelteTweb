import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { invoices, cases } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/invoices/[id] - Get single invoice
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const invoice = await db
		.select({
			invoice: invoices,
			case: {
				id: cases.id,
				title: cases.title,
				clientId: cases.clientId,
				lawyerId: cases.lawyerId
			}
		})
		.from(invoices)
		.innerJoin(cases, eq(invoices.caseId, cases.id))
		.where(eq(invoices.id, params.id))
		.limit(1);

	if (invoice.length === 0) {
		throw error(404, 'Invoice not found');
	}

	const record = invoice[0];

	// Check access
	const isClient = record.case.clientId === locals.user.id;
	const isLawyer = record.case.lawyerId === locals.user.id;
	const isAdmin = locals.user.role === 'admin';

	if (!isClient && !isLawyer && !isAdmin) {
		throw error(403, 'Access denied');
	}

	return json({ invoice: { ...record.invoice, case: record.case } });
};

// PATCH /api/invoices/[id] - Update invoice (status, amount, etc.)
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { status, paidAmount, description, amount, dueDate } = body;

	// Get invoice with case info
	const invoice = await db
		.select({
			invoice: invoices,
			case: cases
		})
		.from(invoices)
		.innerJoin(cases, eq(invoices.caseId, cases.id))
		.where(eq(invoices.id, params.id))
		.limit(1);

	if (invoice.length === 0) {
		throw error(404, 'Invoice not found');
	}

	const record = invoice[0];
	const isLawyer = record.case.lawyerId === locals.user.id;
	const isAdmin = locals.user.role === 'admin';

	if (!isLawyer && !isAdmin) {
		throw error(403, 'Only lawyers can update invoices');
	}

	const updates: {
		status?: 'unpaid' | 'partial' | 'paid';
		paidAt?: Date;
		paidAmount?: number;
		description?: string;
		amount?: number;
		dueDate?: Date;
	} = {};

	if (status !== undefined) {
		updates.status = status;
		if (status === 'paid') {
			updates.paidAt = new Date();
			updates.paidAmount = record.invoice.amount;
		}
	}
	if (paidAmount !== undefined) {
		const paidAmountCents = Math.round(paidAmount * 100);
		updates.paidAmount = paidAmountCents;
		// Auto-update status based on payment
		if (paidAmountCents >= record.invoice.amount) {
			updates.status = 'paid';
			updates.paidAt = new Date();
		} else if (paidAmountCents > 0) {
			updates.status = 'partial';
		}
	}
	if (description !== undefined) {
		updates.description = description.trim();
	}
	if (amount !== undefined) {
		updates.amount = Math.round(amount * 100);
	}
	if (dueDate !== undefined) {
		updates.dueDate = new Date(dueDate);
	}

	if (Object.keys(updates).length === 0) {
		throw error(400, 'No updates provided');
	}

	await db.update(invoices).set(updates).where(eq(invoices.id, params.id));

	return json({ success: true, updates });
};

// DELETE /api/invoices/[id] - Delete invoice
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	// Get invoice with case info
	const invoice = await db
		.select({
			invoice: invoices,
			case: cases
		})
		.from(invoices)
		.innerJoin(cases, eq(invoices.caseId, cases.id))
		.where(eq(invoices.id, params.id))
		.limit(1);

	if (invoice.length === 0) {
		throw error(404, 'Invoice not found');
	}

	const record = invoice[0];
	const isLawyer = record.case.lawyerId === locals.user.id;
	const isAdmin = locals.user.role === 'admin';

	if (!isLawyer && !isAdmin) {
		throw error(403, 'Only lawyers can delete invoices');
	}

	await db.delete(invoices).where(eq(invoices.id, params.id));

	return json({ success: true });
};
