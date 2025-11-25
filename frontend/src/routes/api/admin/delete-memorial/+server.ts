import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { logAuditEvent } from '$lib/server/auditLogger';

export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
	try {
		// Check authentication
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Check admin privileges
		if (locals.user.role !== 'admin') {
			return json({ error: 'Admin privileges required' }, { status: 403 });
		}

		const { memorialId } = await request.json();

		if (!memorialId) {
			return json({ error: 'Event ID is required' }, { status: 400 });
		}

		console.log('🗑️ [ADMIN API] Deleting event:', memorialId);

		// Get event data before deletion for audit log
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		if (!memorialDoc.exists) {
			return json({ error: 'Event not found' }, { status: 404 });
		}

		const memorialData = memorialDoc.data();

		// Delete the event document
		await adminDb.collection('memorials').doc(memorialId).delete();

		console.log('✅ [ADMIN API] Event deleted successfully');

		// Log the deletion
		await logAuditEvent({
			uid: locals.user.uid,
			action: 'admin_memorial_deleted',
			userEmail: locals.user.email,
			userRole: locals.user.role as 'admin' | 'owner' | 'funeral_director',
			resourceType: 'event',
			resourceId: memorialId,
			details: {
				lovedOneName: memorialData?.lovedOneName,
				creatorEmail: memorialData?.creatorEmail,
				deletedBy: locals.user.email
			},
			success: true,
			ipAddress: getClientAddress(),
			userAgent: request.headers.get('user-agent') || undefined
		});

		return json({
			success: true,
			message: 'Event deleted successfully',
			memorialId
		});
	} catch (error: any) {
		console.error('❌ [ADMIN API] Error deleting event:', error);

		// Log the error
		await logAuditEvent({
			uid: locals.user?.uid || 'unknown',
			action: 'admin_memorial_delete_error',
			userEmail: locals.user?.email || 'unknown',
			userRole: locals.user?.role as 'admin' | 'owner' | 'funeral_director' || 'admin',
			resourceType: 'event',
			resourceId: 'unknown',
			details: { error: error.message },
			success: false,
			ipAddress: getClientAddress(),
			userAgent: request.headers.get('user-agent') || undefined
		});

		return json(
			{
				error: 'Failed to delete event',
				details: error.message
			},
			{ status: 500 }
		);
	}
};
