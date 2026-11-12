import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { markPaid } from '$lib/server/db/repos/invoices';
import { getMemorial, updateMemorialFields } from '$lib/server/db/repos/memorials';
import { setUser } from '$lib/server/db/repos/users';
import { invoiceKind, type Invoice } from '$lib/types/invoice';

/**
 * Single place that records an invoice payment. Used by both the Stripe
 * webhook and the post-checkout receipt page (whichever lands first).
 *
 * Booking invoices (the main package; legacy invoices with no `kind` count as
 * booking) also mark the linked memorial paid, mirroring the calculator
 * checkout handler in /api/webhooks/stripe. Add-on/custom invoices only update
 * the invoice itself.
 */
export async function applyInvoicePaid(
	invoice: Invoice,
	payment: { paymentIntentId?: string | null; stripeSessionId?: string }
): Promise<void> {
	if (invoice.status === 'paid') return;

	await markPaid(invoice.id, payment);

	if (invoiceKind(invoice) !== 'booking' || !invoice.memorialId) return;

	const now = Timestamp.now();
	await updateMemorialFields(invoice.memorialId, {
		isPaid: true,
		paidAt: now,
		'calculatorConfig.status': 'paid',
		'calculatorConfig.paidAt': now,
		'calculatorConfig.lastModified': now,
		paymentHistory: FieldValue.arrayUnion({
			source: 'invoice',
			invoiceId: invoice.id,
			checkoutSessionId: payment.stripeSessionId ?? null,
			paymentIntentId: payment.paymentIntentId ?? null,
			status: 'succeeded',
			amount: invoice.total / 100,
			paidAt: now
		})
	});

	// Same as the calculator checkout: lets the owner create additional memorials.
	const memorial = await getMemorial(invoice.memorialId);
	const ownerUid = memorial?.ownerUid as string | undefined;
	if (ownerUid) {
		await setUser(ownerUid, { hasPaidForMemorial: true, lastPaymentDate: now }, true);
	}
	console.log(
		`✅ [INVOICE] Booking invoice ${invoice.id} paid — memorial ${invoice.memorialId} marked paid`
	);
}
