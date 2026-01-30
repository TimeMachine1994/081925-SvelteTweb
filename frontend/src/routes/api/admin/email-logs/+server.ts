import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { EmailAuditLog, EmailType, EmailStatus } from '$lib/types/email-audit';

/**
 * GET /api/admin/email-logs
 * 
 * List email audit logs with pagination and filtering
 * 
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 50, max 100)
 * - type: EmailType (optional)
 * - status: EmailStatus (optional)
 * - to: string (optional) - search by recipient email
 * - memorialId: string (optional)
 * - startDate: ISO string (optional)
 * - endDate: ISO string (optional)
 * - search: string (optional) - search recipient email
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	// Auth check - admin only
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(401, 'Unauthorized - Admin access required');
	}

	try {
		// Parse query parameters
		const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
		const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
		const type = url.searchParams.get('type') as EmailType | null;
		const status = url.searchParams.get('status') as EmailStatus | null;
		const toEmail = url.searchParams.get('to');
		const memorialId = url.searchParams.get('memorialId');
		const startDate = url.searchParams.get('startDate');
		const endDate = url.searchParams.get('endDate');
		const search = url.searchParams.get('search');

		// Build query
		let query: FirebaseFirestore.Query = adminDb.collection('email_audit_logs');

		// Apply filters
		if (type) {
			query = query.where('type', '==', type);
		}

		if (status) {
			query = query.where('status', '==', status);
		}

		if (memorialId) {
			query = query.where('memorialId', '==', memorialId);
		}

		// Date range filter
		if (startDate) {
			query = query.where('sentAt', '>=', new Date(startDate));
		}

		if (endDate) {
			query = query.where('sentAt', '<=', new Date(endDate));
		}

		// Order by sentAt descending (most recent first)
		query = query.orderBy('sentAt', 'desc');

		// Get total count for pagination (without limit)
		// Note: Firestore doesn't have a direct count, so we'll estimate
		// For accurate counts, you'd need a counter document or Cloud Function

		// Apply pagination
		const offset = (page - 1) * limit;
		if (offset > 0) {
			// Get the offset document to start after
			const offsetSnapshot = await query.limit(offset).get();
			if (offsetSnapshot.docs.length === offset) {
				const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
				query = query.startAfter(lastDoc);
			}
		}

		// Fetch logs
		const snapshot = await query.limit(limit + 1).get(); // +1 to check if there are more

		const logs: (EmailAuditLog & { id: string })[] = [];
		const docs = snapshot.docs.slice(0, limit);

		for (const doc of docs) {
			const data = doc.data();
			
			// Apply client-side search filter if needed (for 'to' email partial match)
			if (toEmail && !data.to?.toLowerCase().includes(toEmail.toLowerCase())) {
				continue;
			}
			if (search && !data.to?.toLowerCase().includes(search.toLowerCase())) {
				continue;
			}

			logs.push({
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
			});
		}

		const hasMore = snapshot.docs.length > limit;

		return json({
			logs,
			pagination: {
				page,
				limit,
				hasMore,
				// Note: total count would require separate query or counter
			}
		});
	} catch (err) {
		console.error('Error fetching email logs:', err);
		throw error(500, 'Failed to fetch email logs');
	}
};
