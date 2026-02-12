import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { invoices, cases, user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const [invoice] = await db
			.select()
			.from(invoices)
			.where(eq(invoices.id, params.id))
			.limit(1);

		if (!invoice) {
			throw error(404, 'Invoice not found');
		}

		// Get associated case
		const [caseData] = await db
			.select()
			.from(cases)
			.where(eq(cases.id, invoice.caseId))
			.limit(1);

		if (!caseData) {
			throw error(404, 'Associated case not found');
		}

		// Verify user has access
		if (
			locals.user.role !== 'admin' &&
			locals.user.role !== 'lawyer' &&
			caseData.clientId !== locals.user.id
		) {
			throw error(403, 'Access denied');
		}

		// Get client info
		let clientInfo = null;
		if (caseData.clientId) {
			const [client] = await db
				.select({
					firstName: userTable.firstName,
					lastName: userTable.lastName,
					email: userTable.email
				})
				.from(userTable)
				.where(eq(userTable.id, caseData.clientId))
				.limit(1);
			clientInfo = client || null;
		}

		return json({
			invoice,
			case: { id: caseData.id, title: caseData.title },
			client: clientInfo
		});
	} catch (err) {
		console.error('Get invoice error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to fetch invoice');
	}
};
