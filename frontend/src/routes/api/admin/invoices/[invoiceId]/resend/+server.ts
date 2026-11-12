import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getInvoice, touchSent } from '$lib/server/db/repos/invoices';
import { getMemorial } from '$lib/server/db/repos/memorials';
import { EMAIL_RE, paymentUrlFor, requireInvoicePermission } from '$lib/server/invoiceAdmin';
import { logAdminAction, extractUserContext } from '$lib/server/auditLogger';

/** Re-sends a pending invoice's email. Body: `{ email?: string }` to change the recipient. */
export const POST: RequestHandler = async (event) => {
	const { request, locals, params } = event;
	const auth = requireInvoicePermission(locals, 'update');
	if ('response' in auth) return auth.response;

	const invoice = await getInvoice(params.invoiceId);
	if (!invoice) return json({ error: 'Invoice not found' }, { status: 404 });
	if (invoice.status !== 'pending') {
		return json({ error: `Invoice is ${invoice.status}` }, { status: 409 });
	}

	const body = await request.json().catch(() => ({}));
	const requested = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
	if (requested && !EMAIL_RE.test(requested)) {
		return json({ error: 'Invalid email format' }, { status: 400 });
	}
	const recipient = requested || invoice.customerEmail;

	const memorial = invoice.memorialId ? await getMemorial(invoice.memorialId) : null;

	try {
		const { sendInvoiceEmail } = await import('$lib/server/email');
		await sendInvoiceEmail({
			customerEmail: recipient,
			customerName: invoice.customerName,
			invoiceId: invoice.id,
			items: invoice.items,
			total: invoice.total,
			paymentUrl: paymentUrlFor(invoice.id, request),
			memorialName: (memorial?.lovedOneName as string) || undefined
		});
	} catch (err) {
		console.error('Failed to resend invoice email:', err);
		return json({ error: 'Failed to send email' }, { status: 502 });
	}

	await touchSent(invoice.id, recipient !== invoice.customerEmail ? recipient : undefined);
	await logAdminAction(extractUserContext(event), 'system_config_changed', invoice.id, {
		operation: 'resend_invoice',
		memorialId: invoice.memorialId || null,
		recipient
	});

	return json({ success: true, recipient });
};
