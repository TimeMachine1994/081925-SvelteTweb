import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { logAuditEvent } from '$lib/server/auditLogger';

export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
	// Verify admin access
	if (!locals.user?.admin && locals.user?.role !== 'admin') {
		await logAuditEvent({
			uid: locals.user?.uid || 'anonymous',
			action: 'api_access_denied',
			userEmail: locals.user?.email || 'anonymous',
			userRole: (locals.user?.role as 'admin' | 'owner' | 'funeral_director') || 'admin',
			resourceType: 'funeral_director',
			resourceId: 'approve_access',
			details: { reason: 'Admin access required' },
			success: false,
			ipAddress: getClientAddress(),
			userAgent: request.headers.get('user-agent') || undefined
		});
		return json({ error: 'Admin access required' }, { status: 403 });
	}

	try {
		const { directorId } = await request.json();
		
		if (!directorId) {
			return json({ error: 'Director ID is required' }, { status: 400 });
		}

		console.log('🏥 [ADMIN API] Approving funeral director:', directorId);

		// Update funeral director status to approved
		const directorRef = adminDb.collection('funeral_directors').doc(directorId);
		const directorDoc = await directorRef.get();

		if (!directorDoc.exists) {
			return json({ error: 'Funeral director not found' }, { status: 404 });
		}

		await directorRef.update({
			status: 'approved',
			approvedAt: new Date(),
			approvedBy: locals.user.uid
		});

		// Log the approval action
		await logAuditEvent({
			uid: locals.user.uid,
			action: 'funeral_director_approved',
			userEmail: locals.user.email,
			userRole: (locals.user.role as 'admin' | 'owner' | 'funeral_director') || 'admin',
			resourceType: 'funeral_director',
			resourceId: directorId,
			details: {
				directorEmail: directorDoc.data()?.email,
				companyName: directorDoc.data()?.companyName
			},
			success: true,
			ipAddress: getClientAddress(),
			userAgent: request.headers.get('user-agent') || undefined
		});

		console.log('✅ [ADMIN API] Funeral director approved successfully');

		return json({
			success: true,
			message: 'Funeral director approved successfully'
		});

	} catch (error) {
		console.error('❌ [ADMIN API] Error approving funeral director:', error);

		// Log the error
		await logAuditEvent({
			uid: locals.user?.uid || 'unknown',
			action: 'funeral_director_approval_error',
			userEmail: locals.user?.email || 'unknown',
			userRole: (locals.user?.role as 'admin' | 'owner' | 'funeral_director') || 'admin',
			resourceType: 'funeral_director',
			resourceId: 'approval_error',
			details: { error: error instanceof Error ? error.message : 'Unknown error' },
			success: false,
			ipAddress: getClientAddress(),
			userAgent: request.headers.get('user-agent') || undefined
		});

		return json(
			{
				error: 'Failed to approve funeral director',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
