import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, adminAuth } from '$lib/server/firebase';
import { logAuditEvent } from '$lib/server/auditLogger';

export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
	try {
		// Check authentication
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Check admin privileges
		if (!locals.user.isAdmin && locals.user.role !== 'admin') {
			return json({ error: 'Admin privileges required' }, { status: 403 });
		}

		const { userId } = await request.json();

		if (!userId) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		console.log('🗑️ [ADMIN API] Deleting user:', userId);

		// Get user data before deletion for audit log
		const userDoc = await adminDb.collection('users').doc(userId).get();
		const userData = userDoc.exists ? userDoc.data() : null;

		// Get Firebase Auth user data
		let authUserData = null;
		try {
			authUserData = await adminAuth.getUser(userId);
		} catch (error) {
			console.log('⚠️ [ADMIN API] User not found in Firebase Auth, continuing with Firestore deletion');
		}

		// Delete from Firestore
		if (userDoc.exists) {
			await adminDb.collection('users').doc(userId).delete();
			console.log('✅ [ADMIN API] User deleted from Firestore');
		}

		// Delete from Firebase Auth
		if (authUserData) {
			await adminAuth.deleteUser(userId);
			console.log('✅ [ADMIN API] User deleted from Firebase Auth');
		}

		console.log('✅ [ADMIN API] User deleted successfully');

		// Log the deletion
		await logAuditEvent({
			uid: locals.user.uid,
			action: 'admin_user_deleted',
			userEmail: locals.user.email,
			userRole: locals.user.role as 'admin' | 'owner' | 'funeral_director',
			resourceType: 'user',
			resourceId: userId,
			details: {
				deletedUserEmail: userData?.email || authUserData?.email,
				deletedUserName: userData?.displayName || authUserData?.displayName,
				deletedBy: locals.user.email
			},
			success: true,
			ipAddress: getClientAddress(),
			userAgent: request.headers.get('user-agent') || undefined
		});

		return json({
			success: true,
			message: 'User deleted successfully',
			userId
		});
	} catch (error: any) {
		console.error('❌ [ADMIN API] Error deleting user:', error);

		// Log the error
		await logAuditEvent({
			uid: locals.user?.uid || 'unknown',
			action: 'admin_user_delete_error',
			userEmail: locals.user?.email || 'unknown',
			userRole: locals.user?.role as 'admin' | 'owner' | 'funeral_director' || 'admin',
			resourceType: 'user',
			resourceId: 'unknown',
			details: { error: error.message },
			success: false,
			ipAddress: getClientAddress(),
			userAgent: request.headers.get('user-agent') || undefined
		});

		return json(
			{
				error: 'Failed to delete user',
				details: error.message
			},
			{ status: 500 }
		);
	}
};
