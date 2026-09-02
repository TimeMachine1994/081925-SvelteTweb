import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getInvoice, setStripeSession } from '$lib/server/db/repos/invoices';
import { stripe } from '$lib/server/stripe';

// POST - Create Stripe checkout session for invoice payment
export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { invoiceId } = params;

		if (!invoiceId) {
			return json({ error: 'Invoice ID is required' }, { status: 400 });
		}

		const invoice = await getInvoice(invoiceId);

		if (!invoice) {
			return json({ error: 'Invoice not found' }, { status: 404 });
		}

		// Check if already paid
		if (invoice.status === 'paid') {
			return json({ error: 'Invoice has already been paid' }, { status: 400 });
		}

		// Check if expired or cancelled
		if (invoice.status === 'expired' || invoice.status === 'cancelled') {
			return json({ error: `Invoice is ${invoice.status}` }, { status: 400 });
		}

		const origin = request.headers.get('origin') || 'https://tributestream.com';

		// Create Stripe Checkout Session
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: invoice.items.map((item: any) => ({
				price_data: {
					currency: 'usd',
					product_data: {
						name: item.name
					},
					unit_amount: item.price // Already in cents
				},
				quantity: item.quantity
			})),
			mode: 'payment',
			success_url: `${origin}/pay/${invoiceId}/receipt?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${origin}/pay/${invoiceId}?cancelled=true`,
			customer_email: invoice.customerEmail,
			metadata: {
				type: 'invoice',
				invoiceId: invoiceId,
				customerEmail: invoice.customerEmail
			}
		});

		// Update invoice with checkout session ID
		await setStripeSession(invoiceId, session.id);

		console.log(`💳 Checkout session created for invoice ${invoiceId}: ${session.id}`);

		return json({
			url: session.url
		});
	} catch (error) {
		console.error('Failed to create checkout session:', error);
		return json(
			{
				error: 'Failed to create checkout session',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
