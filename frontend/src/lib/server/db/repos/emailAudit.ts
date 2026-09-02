import type { EmailAuditLog, EmailStatus, EmailType } from '$lib/types/email-audit';
import { adminDb, stripUndefined, toIsoOrNow } from './_shared';

const COLLECTION = 'email_audit_logs';

export interface EmailLogFilters {
	type?: EmailType | null;
	status?: EmailStatus | null;
	to?: string | null;
	memorialId?: string | null;
	startDate?: string | null;
	endDate?: string | null;
}

export interface EmailLogPage {
	logs: EmailAuditLog[];
	hasMore: boolean;
}

function mapLog(id: string, d: Record<string, any>): EmailAuditLog {
	return {
		id,
		type: d.type,
		templateId: d.templateId,
		templateName: d.templateName,
		to: d.to,
		cc: d.cc,
		from: d.from,
		subject: d.subject,
		templateData: d.templateData || {},
		sentAt: toIsoOrNow(d.sentAt),
		triggeredBy: d.triggeredBy,
		triggeredByUserId: d.triggeredByUserId,
		triggeredByAdminId: d.triggeredByAdminId,
		memorialId: d.memorialId,
		userId: d.userId,
		invoiceId: d.invoiceId,
		streamId: d.streamId,
		status: d.status,
		error: d.error,
		sendgridMessageId: d.sendgridMessageId,
		environment: d.environment
	};
}

function applyFilters(q: FirebaseFirestore.Query, f: EmailLogFilters): FirebaseFirestore.Query {
	if (f.type) q = q.where('type', '==', f.type);
	if (f.status) q = q.where('status', '==', f.status);
	if (f.to) q = q.where('to', '==', f.to);
	if (f.memorialId) q = q.where('memorialId', '==', f.memorialId);
	if (f.startDate) q = q.where('sentAt', '>=', new Date(f.startDate));
	if (f.endDate) q = q.where('sentAt', '<=', new Date(f.endDate));
	return q;
}

export async function insertLog(entry: Omit<EmailAuditLog, 'id'>): Promise<string> {
	const ref = await adminDb
		.collection(COLLECTION)
		.add(stripUndefined({ ...entry, sentAt: new Date(entry.sentAt) }));
	return ref.id;
}

export async function getLog(id: string): Promise<EmailAuditLog | null> {
	const snap = await adminDb.collection(COLLECTION).doc(id).get();
	return snap.exists ? mapLog(snap.id, snap.data() || {}) : null;
}

/** Offset-paginated listing, newest first. Fetches one extra row to compute hasMore. */
export async function listLogs(
	filters: EmailLogFilters,
	page: number,
	limit: number
): Promise<EmailLogPage> {
	let q = applyFilters(adminDb.collection(COLLECTION), filters).orderBy('sentAt', 'desc');
	const offset = (page - 1) * limit;
	if (offset > 0) q = q.offset(offset);
	const snap = await q.limit(limit + 1).get();
	const hasMore = snap.docs.length > limit;
	const docs = hasMore ? snap.docs.slice(0, limit) : snap.docs;
	return { logs: docs.map((d) => mapLog(d.id, d.data())), hasMore };
}

export async function countLogs(filters: EmailLogFilters = {}): Promise<number> {
	const snap = await applyFilters(adminDb.collection(COLLECTION), filters).count().get();
	return snap.data().count;
}

export async function statusCounts(): Promise<{
	total: number;
	sent: number;
	failed: number;
	mocked: number;
}> {
	const [total, sent, failed, mocked] = await Promise.all([
		countLogs(),
		countLogs({ status: 'sent' }),
		countLogs({ status: 'failed' }),
		countLogs({ status: 'mocked' })
	]);
	return { total, sent, failed, mocked };
}
