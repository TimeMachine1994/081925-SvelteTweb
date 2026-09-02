/**
 * Email Audit Logs - List API
 * 
 * GET /api/admin/email-logs
 * Query params: page, limit, type, status, to, memorialId, startDate, endDate
 */

import { json, error } from '@sveltejs/kit';
import * as emailAudit from '$lib/server/db/repos/emailAudit';
import type { RequestHandler } from './$types';
import type { EmailType, EmailStatus } from '$lib/types/email-audit';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}

	// Parse query params
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
	const type = url.searchParams.get('type') as EmailType | null;
	const status = url.searchParams.get('status') as EmailStatus | null;
	const to = url.searchParams.get('to');
	const memorialId = url.searchParams.get('memorialId');
	const startDate = url.searchParams.get('startDate');
	const endDate = url.searchParams.get('endDate');

	try {
		const filters = { type, status, to, memorialId, startDate, endDate };
		const { logs: rows, hasMore } = await emailAudit.listLogs(filters, page, limit);
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

		// Get total count (separate query)
		let total = 0;
		try {
			total = await emailAudit.countLogs({ type, status, to, memorialId });
		} catch {
			// count() may not be available; estimate from hasMore
			total = (page - 1) * limit + logs.length + (hasMore ? 1 : 0);
		}

		return json({
			logs,
			pagination: {
				page,
				limit,
				total,
				hasMore
			}
		});
	} catch (err) {
		console.error('Failed to fetch email audit logs:', err);
		throw error(500, 'Failed to fetch email logs');
	}
};
