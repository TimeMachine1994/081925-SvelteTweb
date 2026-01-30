import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { EmailAuditLog } from '$lib/types/email-audit';

/**
 * GET /api/admin/email-logs/[id]
 * 
 * Get a single email audit log by ID
 */
export const GET: RequestHandler = async ({ locals, params }) => {
	// Auth check - admin only
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(401, 'Unauthorized - Admin access required');
	}

	const { id } = params;

	if (!id) {
		throw error(400, 'Email log ID is required');
	}

	try {
		const doc = await adminDb.collection('email_audit_logs').doc(id).get();

		if (!doc.exists) {
			throw error(404, 'Email log not found');
		}

		const data = doc.data()!;

		const log: EmailAuditLog & { id: string } = {
			id: doc.id,
			type: data.type,
			to: data.to,
			cc: data.cc,
			from: data.from,
			templateId: data.templateId,
			templateName: data.templateName,
			subject: data.subject,
			templateData: data.templateData,
			sentAt: data.sentAt?.toDate?.()?.toISOString() || data.sentAt,
			triggeredBy: data.triggeredBy,
			triggeredByUserId: data.triggeredByUserId,
			triggeredByAdminId: data.triggeredByAdminId,
			memorialId: data.memorialId,
			userId: data.userId,
			invoiceId: data.invoiceId,
			streamId: data.streamId,
			status: data.status,
			error: data.error,
			sendgridMessageId: data.sendgridMessageId,
			environment: data.environment
		};

		return json({ log });
	} catch (err: any) {
		if (err.status) throw err;
		console.error('Error fetching email log:', err);
		throw error(500, 'Failed to fetch email log');
	}
};
