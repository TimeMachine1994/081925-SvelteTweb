import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { invoices, cases, user } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { generateId } from '$lib/server/auth';

// GET /api/invoices - Get invoices (optionally filter by caseId)
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const caseId = url.searchParams.get('caseId');

	if (locals.user.role === 'lawyer' || locals.user.role === 'admin') {
		// Lawyer sees all their invoices
		const whereClause = caseId
			? and(eq(cases.lawyerId, locals.user.id), eq(invoices.caseId, caseId))
			: eq(cases.lawyerId, locals.user.id);

		const results = await db
			.select({
				invoice: invoices,
				case: {
					id: cases.id,
					title: cases.title,
					clientId: cases.clientId
				},
				client: {
					id: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email
				}
			})
			.from(invoices)
			.innerJoin(cases, eq(invoices.caseId, cases.id))
			.innerJoin(user, eq(cases.clientId, user.id))
			.where(whereClause);
		return json({
			invoices: results.map((r) => ({
				...r.invoice,
				case: r.case,
				client: r.client
			}))
		});
	} else {
		// Client sees only their invoices
		let query = db
			.select({
				invoice: invoices,
				case: {
					id: cases.id,
					title: cases.title
				}
			})
			.from(invoices)
			.innerJoin(cases, eq(invoices.caseId, cases.id))
			.where(eq(cases.clientId, locals.user.id));

		const results = await query;
		return json({
			invoices: results.map((r) => ({
				...r.invoice,
				case: r.case
			}))
		});
	}
};

// POST /api/invoices - Create a new invoice (lawyers only)
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		throw error(403, 'Only lawyers can create invoices');
	}

	const body = await request.json();
	const { caseId, amount, description, dueDate } = body;

	if (!caseId || !amount || !description || !dueDate) {
		throw error(400, 'caseId, amount, description, and dueDate are required');
	}

	// Verify case exists and belongs to this lawyer
	const caseRecord = await db.query.cases.findFirst({
		where: and(eq(cases.id, caseId), eq(cases.lawyerId, locals.user.id))
	});

	if (!caseRecord) {
		throw error(404, 'Case not found or access denied');
	}

	const invoiceId = generateId();
	const now = new Date();

	await db.insert(invoices).values({
		id: invoiceId,
		caseId,
		amount: Math.round(amount * 100), // Convert dollars to cents
		description: description.trim(),
		status: 'unpaid',
		dueDate: new Date(dueDate),
		paidAmount: 0,
		createdAt: now
	});

	const newInvoice = {
		id: invoiceId,
		caseId,
		amount: Math.round(amount * 100),
		description: description.trim(),
		status: 'unpaid',
		dueDate: new Date(dueDate),
		paidAmount: 0,
		createdAt: now
	};

	return json({ invoice: newInvoice }, { status: 201 });
};
