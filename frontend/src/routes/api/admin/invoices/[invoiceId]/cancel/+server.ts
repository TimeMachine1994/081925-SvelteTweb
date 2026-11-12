import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { cancelInvoice, getInvoice } from '$lib/server/db/repos/invoices';
import { requireInvoicePermission } from '$lib/server/invoiceAdmin';
import { logAdminAction, extractUserContext } from '$lib/server/auditLogger';

/** Voids a pending invoice so its pay link stops working. Paid invoices can't be voided. */
export const POST: RequestHandler = async (event) => {
	const { locals, params } = event;
	const auth = requireInvoicePermission(locals, 'update');
	if ('response' in auth) return auth.response;

	const invoice = await getInvoice(params.invoiceId);
	if (!invoice) return json({ error: 'Invoice not found' }, { status: 404 });

	const cancelled = await cancelInvoice(invoice.id, auth.user.email || auth.user.uid);
	if (!cancelled) {
		return json(
			{ error: `Only pending invoices can be voided (this one is ${invoice.status})` },
			{ status: 409 }
		);
	}

	await logAdminAction(extractUserContext(event), 'system_config_changed', invoice.id, {
		operation: 'cancel_invoice',
		memorialId: invoice.memorialId || null,
		total: invoice.total
	});

	return json({ success: true });
};
