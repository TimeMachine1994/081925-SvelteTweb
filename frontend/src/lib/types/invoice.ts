export interface InvoiceItem {
	name: string;
	quantity: number;
	price: number; // Unit price in cents
	total: number; // quantity * price in cents
}

/**
 * - `booking`: the main package invoice for a memorial (created from
 *   Schedule & Billing). Paying it marks the memorial paid.
 * - `additional`: add-on / custom charges. Does not change the memorial's paid flag.
 * Legacy invoices with no `kind` are treated as `booking`.
 */
export type InvoiceKind = 'booking' | 'additional';

export interface Invoice {
	id: string;
	items: InvoiceItem[];
	total: number; // Total in cents
	customerEmail: string;
	customerName?: string;
	status: 'pending' | 'paid' | 'expired' | 'cancelled';
	kind?: InvoiceKind;
	note?: string; // Internal admin note
	createdAt: string; // ISO string
	paidAt?: string; // ISO string
	createdBy: string; // Admin UID who created it
	memorialId?: string; // Optional link to memorial
	stripeSessionId?: string;
	paymentIntentId?: string;
	expiresAt?: string; // Optional expiration date (ISO string)
	cancelledAt?: string;
	cancelledBy?: string;
	lastSentAt?: string;
}

export interface CreateInvoiceRequest {
	items: Omit<InvoiceItem, 'total'>[];
	customerEmail: string;
	customerName?: string;
	memorialId?: string;
	sendEmail?: boolean; // Whether to send invoice email
	kind?: InvoiceKind;
	note?: string;
}

export interface CreateInvoiceResponse {
	invoiceId: string;
	paymentUrl: string;
}

export interface InvoicePublicData {
	id: string;
	items: InvoiceItem[];
	total: number;
	customerEmail: string;
	customerName?: string;
	status: Invoice['status'];
	createdAt: string; // ISO string for public
}

export function invoiceKind(invoice: Pick<Invoice, 'kind'>): InvoiceKind {
	return invoice.kind ?? 'booking';
}
