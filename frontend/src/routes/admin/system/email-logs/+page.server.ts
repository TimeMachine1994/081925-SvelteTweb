/**
 * Email Audit Logs - Admin Page Server Load
 * 
 * Loads email logs with filters and computes inline stats.
 */

import * as emailAudit from '$lib/server/db/repos/emailAudit';
import { requireAdmin } from '$lib/server/adminGuard';
import type { EmailType, EmailStatus } from '$lib/types/email-audit';

export const load = async ({ locals, url }: any) => {
	requireAdmin(locals, { resource: 'audit_log', action: 'read' });

	// Parse query params
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
	const type = url.searchParams.get('type') as EmailType | null;
	const status = url.searchParams.get('status') as EmailStatus | null;
	const to = url.searchParams.get('to') as string | null;
	const memorialId = url.searchParams.get('memorialId') as string | null;
	const startDate = url.searchParams.get('startDate') as string | null;
	const endDate = url.searchParams.get('endDate') as string | null;

	try {
		const { logs: rows, hasMore } = await emailAudit.listLogs(
			{ type, status, to, memorialId, startDate, endDate },
			page,
			limit
		);
		const logs = rows.map((l) => ({
			id: l.id,
			type: l.type,
			to: l.to,
			templateName: l.templateName || null,
			subject: l.subject || null,
			sentAt: l.sentAt,
			status: l.status,
			memorialId: l.memorialId || null,
			error: l.error || null
		}));

		// Compute stats (unfiltered counts)
		let stats = { total: 0, sent: 0, failed: 0, mocked: 0 };
		try {
			stats = await emailAudit.statusCounts();
		} catch {
			// count() aggregation may not be available — fall back to log length
			stats.total = logs.length;
		}

		return {
			logs,
			stats,
			pagination: {
				page,
				limit,
				total: stats.total,
				hasMore
			},
			filters: {
				type: type || '',
				status: status || '',
				to: to || '',
				memorialId: memorialId || '',
				startDate: startDate || '',
				endDate: endDate || ''
			}
		};
	} catch (err) {
		console.error('Failed to load email audit logs:', err);
		return {
			logs: [],
			stats: { total: 0, sent: 0, failed: 0, mocked: 0 },
			pagination: { page: 1, limit: 50, total: 0, hasMore: false },
			filters: { type: '', status: '', to: '', memorialId: '', startDate: '', endDate: '' }
		};
	}
};
