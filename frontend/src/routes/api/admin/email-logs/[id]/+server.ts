/**
 * Email Audit Logs - Detail API
 * 
 * GET /api/admin/email-logs/[id]
 * Returns full email audit log entry
 */

import { json, error } from '@sveltejs/kit';
import * as emailAudit from '$lib/server/db/repos/emailAudit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}

	const { id } = params;

	try {
		const data = await emailAudit.getLog(id);

		if (!data) {
			throw error(404, 'Email log not found');
		}

		return json({
			log: {
				id: data.id,
				type: data.type,
				templateId: data.templateId || null,
				templateName: data.templateName || null,
				to: data.to,
				cc: data.cc || [],
				from: data.from,
				subject: data.subject || null,
				templateData: data.templateData || {},
				sentAt: data.sentAt,
				triggeredBy: data.triggeredBy,
				triggeredByUserId: data.triggeredByUserId || null,
				triggeredByAdminId: data.triggeredByAdminId || null,
				memorialId: data.memorialId || null,
				userId: data.userId || null,
				invoiceId: data.invoiceId || null,
				streamId: data.streamId || null,
				status: data.status,
				error: data.error || null,
				sendgridMessageId: data.sendgridMessageId || null,
				environment: data.environment || 'unknown'
			}
		});
	} catch (err: any) {
		if (err?.status === 404) throw err;
		console.error('Failed to fetch email log detail:', err);
		throw error(500, 'Failed to fetch email log');
	}
};
