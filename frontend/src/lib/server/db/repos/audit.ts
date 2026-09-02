import { adminDb, toIsoOrNow } from './_shared';

/**
 * Audit logging currently spans several Firestore collections written by
 * different generations of code. This repo owns all of them so the Turso
 * implementation can merge them into one `audit_logs` table with a `source`.
 */
export type AuditSource = 'audit_logs' | 'admin_audit_logs' | 'admin_actions' | 'auditLogs';

/** Row shape consumed by /admin/system/audit-logs. */
export interface AuditLogRow {
	id: string;
	timestamp: string;
	action: string;
	adminId: string;
	adminEmail: string;
	resourceType: string;
	resourceId: string;
	status: string;
	details: Record<string, unknown> | null;
	source: AuditSource;
}

export interface AuditQueryFilters {
	action?: string | null;
	userEmail?: string | null;
	resourceType?: string | null;
	dateFrom?: string | null;
	dateTo?: string | null;
	limit?: number;
}

/** Writes a general audit event (from auditLogger.logAuditEvent). */
export async function insertAuditEvent(event: Record<string, unknown>): Promise<void> {
	await adminDb.collection('audit_logs').add(event);
}

/** Writes an admin action record (from AdminService.logAdminAction and ad-hoc call sites). */
export async function insertAdminAudit(entry: Record<string, unknown>): Promise<string> {
	const ref = adminDb.collection('admin_audit_logs').doc();
	await ref.set({ timestamp: new Date(), ...entry });
	return ref.id;
}

/** Writes to the basic `admin_actions` log used by a few older endpoints. */
export async function insertAdminAction(entry: Record<string, unknown>): Promise<void> {
	await adminDb.collection('admin_actions').add(entry);
}

function mapAdminAudit(id: string, data: Record<string, any>): AuditLogRow {
	return {
		id,
		timestamp: toIsoOrNow(data.timestamp),
		action: data.action || 'unknown',
		adminId: data.adminId || 'system',
		adminEmail: data.adminEmail || 'system',
		resourceType: data.resourceType || data.targetType || 'unknown',
		resourceId: data.resourceId || data.targetId || '-',
		status: data.status || 'success',
		details: data.details || data.metadata || null,
		source: 'admin_audit_logs'
	};
}

function mapGeneralAudit(id: string, data: Record<string, any>): AuditLogRow {
	return {
		id,
		timestamp: toIsoOrNow(data.createdAt ?? data.timestamp),
		action: data.action || 'unknown',
		adminId: data.userId || data.uid || 'system',
		adminEmail: data.userEmail || 'system',
		resourceType: data.resourceType || 'unknown',
		resourceId: data.resourceId || '-',
		status: data.success === false ? 'failure' : 'success',
		details: data.details || data.metadata || null,
		source: 'audit_logs'
	};
}

/** Merged, sorted listing across admin + general logs for the admin UI. */
export async function listRecent(opts: {
	limit: number;
	sortBy: string;
	sortDir: 'asc' | 'desc';
}): Promise<AuditLogRow[]> {
	const [adminSnap, generalSnap] = await Promise.all([
		adminDb
			.collection('admin_audit_logs')
			.orderBy(opts.sortBy, opts.sortDir)
			.limit(opts.limit)
			.get(),
		adminDb
			.collection('audit_logs')
			.orderBy(opts.sortBy === 'timestamp' ? 'createdAt' : opts.sortBy, opts.sortDir)
			.limit(opts.limit)
			.get()
	]);
	const rows = [
		...adminSnap.docs.map((d) => mapAdminAudit(d.id, d.data())),
		...generalSnap.docs.map((d) => mapGeneralAudit(d.id, d.data()))
	].sort((a, b) => {
		const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
		return opts.sortDir === 'desc' ? diff : -diff;
	});
	return rows.slice(0, opts.limit);
}

/** Filtered raw query over `audit_logs` (from /api/admin/audit-logs). */
export async function queryAuditEvents(
	f: AuditQueryFilters
): Promise<Array<Record<string, unknown> & { id: string }>> {
	let q: FirebaseFirestore.Query = adminDb.collection('audit_logs').orderBy('timestamp', 'desc');
	if (f.action) q = q.where('action', '==', f.action);
	if (f.userEmail) q = q.where('userEmail', '==', f.userEmail);
	if (f.resourceType) q = q.where('resourceType', '==', f.resourceType);
	if (f.dateFrom) {
		const from = new Date(f.dateFrom);
		from.setHours(0, 0, 0, 0);
		q = q.where('timestamp', '>=', from);
	}
	if (f.dateTo) {
		const to = new Date(f.dateTo);
		to.setHours(23, 59, 59, 999);
		q = q.where('timestamp', '<=', to);
	}
	const snap = await q.limit(Math.min(f.limit ?? 50, 1000)).get();
	return snap.docs.map((d) => {
		const data = d.data();
		return { id: d.id, ...data, timestamp: toIsoOrNow(data.timestamp) };
	});
}
