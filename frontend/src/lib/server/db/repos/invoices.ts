import type { Invoice, InvoiceItem, InvoiceKind } from '$lib/types/invoice';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, stripUndefined, toIso, toIsoOrNow } from './_shared';

const COLLECTION = 'invoices';

export interface CreateInvoiceInput {
	id: string;
	items: InvoiceItem[];
	total: number;
	customerEmail: string;
	customerName?: string;
	createdBy: string;
	memorialId?: string;
	kind?: InvoiceKind;
	note?: string;
}

function mapInvoice(id: string, d: Record<string, any>): Invoice {
	return {
		id: d.id ?? id,
		items: d.items,
		total: d.total,
		customerEmail: d.customerEmail,
		customerName: d.customerName,
		status: d.status,
		kind: d.kind,
		note: d.note,
		createdAt: toIsoOrNow(d.createdAt),
		paidAt: toIso(d.paidAt) ?? undefined,
		createdBy: d.createdBy,
		memorialId: d.memorialId,
		stripeSessionId: d.stripeSessionId,
		paymentIntentId: d.paymentIntentId,
		expiresAt: toIso(d.expiresAt) ?? undefined,
		cancelledAt: toIso(d.cancelledAt) ?? undefined,
		cancelledBy: d.cancelledBy,
		lastSentAt: toIso(d.lastSentAt) ?? undefined
	};
}

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
	const snap = await adminDb.collection(COLLECTION).doc(invoiceId).get();
	if (!snap.exists) return null;
	const data = snap.data();
	if (!data) return null;
	return mapInvoice(snap.id, data);
}

/** Creates a pending invoice. The document id is the caller-supplied `input.id`. */
export async function createInvoice(input: CreateInvoiceInput): Promise<void> {
	await adminDb
		.collection(COLLECTION)
		.doc(input.id)
		.set(
			stripUndefined({
				id: input.id,
				items: input.items,
				total: input.total,
				customerEmail: input.customerEmail,
				customerName: input.customerName,
				status: 'pending',
				kind: input.kind ?? 'additional',
				note: input.note,
				createdAt: Timestamp.now(),
				createdBy: input.createdBy,
				memorialId: input.memorialId
			})
		);
}

export async function setStripeSession(invoiceId: string, stripeSessionId: string): Promise<void> {
	await adminDb.collection(COLLECTION).doc(invoiceId).update({
		stripeSessionId,
		lastModified: Timestamp.now()
	});
}

export async function markPaid(
	invoiceId: string,
	payment: { paymentIntentId?: string | null; stripeSessionId?: string }
): Promise<void> {
	const update: Record<string, unknown> = {
		status: 'paid',
		paidAt: Timestamp.now(),
		paymentIntentId: payment.paymentIntentId
	};
	if (payment.stripeSessionId !== undefined) update.stripeSessionId = payment.stripeSessionId;
	await adminDb.collection(COLLECTION).doc(invoiceId).update(update);
}

/** All invoices for a memorial, newest first (sorted in JS — no composite index). */
export async function listByMemorial(memorialId: string): Promise<Invoice[]> {
	const snap = await adminDb.collection(COLLECTION).where('memorialId', '==', memorialId).get();
	return snap.docs
		.map((d) => mapInvoice(d.id, d.data()))
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Voids a pending invoice. Returns false (no write) if it isn't pending, so a
 * paid invoice can never be cancelled out from under a customer.
 */
export async function cancelInvoice(invoiceId: string, cancelledBy: string): Promise<boolean> {
	const ref = adminDb.collection(COLLECTION).doc(invoiceId);
	return adminDb.runTransaction(async (tx) => {
		const snap = await tx.get(ref);
		if (!snap.exists || snap.data()?.status !== 'pending') return false;
		tx.update(ref, {
			status: 'cancelled',
			cancelledAt: Timestamp.now(),
			cancelledBy,
			lastModified: Timestamp.now()
		});
		return true;
	});
}

/** Records that the invoice email was (re)sent, optionally to a new address. */
export async function touchSent(invoiceId: string, customerEmail?: string): Promise<void> {
	await adminDb
		.collection(COLLECTION)
		.doc(invoiceId)
		.update(stripUndefined({ lastSentAt: Timestamp.now(), customerEmail }));
}

/** Admin listing, newest first. Returns raw fields with ISO (or null) timestamps. */
export async function listInvoices(opts: {
	status?: string | null;
	limit: number;
}): Promise<Record<string, any>[]> {
	let query = adminDb.collection(COLLECTION).orderBy('createdAt', 'desc').limit(opts.limit);
	if (opts.status) {
		query = query.where('status', '==', opts.status);
	}
	const snapshot = await query.get();
	return snapshot.docs.map((doc) => {
		const data = doc.data();
		return {
			...data,
			createdAt: toIso(data.createdAt),
			paidAt: toIso(data.paidAt)
		};
	});
}
