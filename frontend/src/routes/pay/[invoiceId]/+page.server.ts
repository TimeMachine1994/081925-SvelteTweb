import type { PageServerLoad } from './$types';
import { getInvoice } from '$lib/server/db/repos/invoices';
import type { InvoicePublicData } from '$lib/types/invoice';

export const load: PageServerLoad = async ({ params }) => {
	const { invoiceId } = params;

	if (!invoiceId) {
		return {
			invoice: null,
			error: 'Invoice ID is required'
		};
	}

	try {
		const data = await getInvoice(invoiceId);

		if (!data) {
			return {
				invoice: null,
				error: 'Invoice not found'
			};
		}

		const invoice: InvoicePublicData = {
			id: data.id,
			items: data.items,
			total: data.total,
			customerEmail: data.customerEmail,
			customerName: data.customerName,
			status: data.status,
			createdAt: data.createdAt
		};

		return {
			invoice,
			error: null
		};
	} catch (error) {
		console.error('Failed to load invoice:', error);
		return {
			invoice: null,
			error: 'Failed to load invoice'
		};
	}
};
