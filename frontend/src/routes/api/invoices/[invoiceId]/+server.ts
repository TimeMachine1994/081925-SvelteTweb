import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getInvoice } from '$lib/server/db/repos/invoices';
import type { InvoicePublicData } from '$lib/types/invoice';

// GET - Public endpoint to fetch invoice details for checkout
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { invoiceId } = params;

		if (!invoiceId) {
			return json({ error: 'Invoice ID is required' }, { status: 400 });
		}

		const data = await getInvoice(invoiceId);

		if (!data) {
			return json({ error: 'Invoice not found' }, { status: 404 });
		}

		// Return only public-safe data
		const publicData: InvoicePublicData = {
			id: data.id,
			items: data.items,
			total: data.total,
			customerEmail: data.customerEmail,
			customerName: data.customerName,
			status: data.status,
			createdAt: data.createdAt
		};

		return json(publicData);
	} catch (error) {
		console.error('Failed to fetch invoice:', error);
		return json(
			{
				error: 'Failed to fetch invoice',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
