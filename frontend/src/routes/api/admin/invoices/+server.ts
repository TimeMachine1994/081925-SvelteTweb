import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createInvoice, listInvoices, touchSent } from '$lib/server/db/repos/invoices';
import { getMemorial } from '$lib/server/db/repos/memorials';
import { nanoid } from 'nanoid';
import type { CreateInvoiceRequest, InvoiceItem } from '$lib/types/invoice';
import { EMAIL_RE, paymentUrlFor, requireInvoicePermission } from '$lib/server/invoiceAdmin';
import { logAdminAction, extractUserContext } from '$lib/server/auditLogger';

const MAX_ITEMS = 50;

export const POST: RequestHandler = async (event) => {
	const { request, locals } = event;
	const auth = requireInvoicePermission(locals, 'create');
	if ('response' in auth) return auth.response;

	try {
		const body: CreateInvoiceRequest = await request.json();
		const { items, customerEmail, customerName, memorialId, sendEmail, note } = body;
		const kind = body.kind === 'booking' ? 'booking' : 'additional';

		if (!Array.isArray(items) || items.length === 0) {
			return json({ error: 'At least one item is required' }, { status: 400 });
		}
		if (items.length > MAX_ITEMS) {
			return json({ error: `At most ${MAX_ITEMS} items per invoice` }, { status: 400 });
		}
		for (const item of items) {
			if (
				!item ||
				typeof item.name !== 'string' ||
				!item.name.trim() ||
				!Number.isInteger(item.quantity) ||
				item.quantity < 1 ||
				typeof item.price !== 'number' ||
				!Number.isFinite(item.price) ||
				Math.round(item.price) <= 0
			) {
				return json(
					{ error: 'Each item needs a description, a whole-number quantity, and a price above $0' },
					{ status: 400 }
				);
			}
		}

		if (!customerEmail) {
			return json({ error: 'Customer email is required' }, { status: 400 });
		}
		if (!EMAIL_RE.test(customerEmail.trim())) {
			return json({ error: 'Invalid email format' }, { status: 400 });
		}

		let memorialName: string | undefined;
		if (memorialId) {
			const memorial = await getMemorial(memorialId);
			if (!memorial) return json({ error: 'Memorial not found' }, { status: 404 });
			memorialName = (memorial.lovedOneName as string) || undefined;
		}

		const invoiceId = `inv_${nanoid(12)}`;

		const invoiceItems: InvoiceItem[] = items.map((item) => {
			const price = Math.round(item.price); // cents
			return {
				name: item.name.trim(),
				quantity: item.quantity,
				price,
				total: price * item.quantity
			};
		});
		const total = invoiceItems.reduce((sum, item) => sum + item.total, 0);

		const invoice = {
			id: invoiceId,
			items: invoiceItems,
			total,
			customerEmail: customerEmail.toLowerCase().trim(),
			customerName: customerName?.trim() || undefined,
			createdBy: auth.user.uid,
			memorialId: memorialId || undefined,
			kind,
			note: note?.trim() || undefined
		} as const;

		await createInvoice(invoice);

		console.log(
			`✅ Invoice created: ${invoiceId} (${kind}) for ${invoice.customerEmail} - $${(total / 100).toFixed(2)}`
		);

		const paymentUrl = paymentUrlFor(invoiceId, request);

		let emailSent = false;
		if (sendEmail) {
			try {
				const { sendInvoiceEmail } = await import('$lib/server/email');
				await sendInvoiceEmail({
					customerEmail: invoice.customerEmail,
					customerName: invoice.customerName,
					invoiceId,
					items: invoiceItems,
					total,
					paymentUrl,
					memorialName
				});
				await touchSent(invoiceId);
				emailSent = true;
				console.log(`📧 Invoice email sent to ${invoice.customerEmail}`);
			} catch (emailError) {
				console.error('Failed to send invoice email:', emailError);
				// Don't fail the request if email fails
			}
		}

		await logAdminAction(extractUserContext(event), 'system_config_changed', invoiceId, {
			operation: 'create_invoice',
			memorialId: memorialId || null,
			kind,
			total,
			emailSent
		});

		return json({ invoiceId, paymentUrl, total, emailSent });
	} catch (error) {
		console.error('Failed to create invoice:', error);
		return json(
			{
				error: 'Failed to create invoice',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

// GET - List all invoices for admin
export const GET: RequestHandler = async ({ locals, url }) => {
	const auth = requireInvoicePermission(locals, 'read');
	if ('response' in auth) return auth.response;

	try {
		const status = url.searchParams.get('status');
		const limit = Math.min(200, parseInt(url.searchParams.get('limit') || '50') || 50);

		const invoices = await listInvoices({ status, limit });

		return json({ invoices });
	} catch (error) {
		console.error('Failed to list invoices:', error);
		return json({ error: 'Failed to list invoices' }, { status: 500 });
	}
};
