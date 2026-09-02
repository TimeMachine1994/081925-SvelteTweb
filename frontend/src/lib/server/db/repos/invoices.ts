import type { Invoice, InvoiceItem } from '$lib/types/invoice';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, toIso, toIsoOrNow } from './_shared';

const COLLECTION = 'invoices';

export interface CreateInvoiceInput {
	id: string;
	items: InvoiceItem[];
	total: number;
	customerEmail: string;
	customerName?: string;
	createdBy: string;
	memorialId?: string;
}

function mapInvoice(id: string, d: Record<string, any>): Invoice {
	return {
		id: d.id ?? id,
		items: d.items,
		total: d.total,
		customerEmail: d.customerEmail,
		customerName: d.customerName,
		status: d.status,
		createdAt: toIsoOrNow(d.createdAt),
		paidAt: toIso(d.paidAt) ?? undefined,
		createdBy: d.createdBy,
		memorialId: d.memorialId,
		stripeSessionId: d.stripeSessionId,
		paymentIntentId: d.paymentIntentId,
		expiresAt: toIso(d.expiresAt) ?? undefined
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
	await adminDb.collection(COLLECTION).doc(input.id).set({
		id: input.id,
		items: input.items,
		total: input.total,
		customerEmail: input.customerEmail,
		customerName: input.customerName,
		status: 'pending',
		createdAt: Timestamp.now(),
		createdBy: input.createdBy,
		memorialId: input.memorialId
	});
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
