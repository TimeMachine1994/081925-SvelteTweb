import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Admin API endpoint to reject a funeral director application
 * Updates status to 'rejected' and removes permissions
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	console.log('🚫 [ADMIN API] Funeral director rejection request received');
	
	try {
		// Verify admin authentication
		if (!locals.user) {
			console.log('❌ [ADMIN API] No authenticated user');
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Verify admin privileges
		if (!locals.user.admin && locals.user.role !== 'admin') {
			console.log('❌ [ADMIN API] User is not admin:', {
				uid: locals.user.uid,
				admin: locals.user.admin,
				role: locals.user.role
			});
			return json({ error: 'Admin privileges required' }, { status: 403 });
		}

		console.log('✅ [ADMIN API] Admin verification passed for:', locals.user.email);

		const { directorId } = await request.json();
		
		if (!directorId) {
			console.log('❌ [ADMIN API] Missing directorId in request');
			return json({ error: 'Director ID is required' }, { status: 400 });
		}

		console.log('🔍 [ADMIN API] Processing rejection for director ID:', directorId);

		// Get the funeral director document
		const directorRef = adminDb.collection('funeral_directors').doc(directorId);
		const directorDoc = await directorRef.get();

		if (!directorDoc.exists) {
			console.log('❌ [ADMIN API] Funeral director not found:', directorId);
			return json({ error: 'Funeral director not found' }, { status: 404 });
		}

		const directorData = directorDoc.data();
		console.log('📋 [ADMIN API] Current director status:', directorData?.status);

		// Update funeral director status to rejected
		const updateData = {
			status: 'rejected',
			verificationStatus: 'rejected',
			permissions: {
				canCreateMemorials: false,
				canManageMemorials: false,
				canLivestream: false,
				maxMemorials: 0
			},
			streamingConfig: {
				...directorData?.streamingConfig,
				streamingEnabled: false,
				maxConcurrentStreams: 0
			},
			rejectedAt: Timestamp.now(),
			rejectedBy: locals.user.uid,
			updatedAt: Timestamp.now()
		};

		console.log('💾 [ADMIN API] Updating director with rejection data:', {
			directorId,
			newStatus: updateData.status
		});

		await directorRef.update(updateData);

		// Update user's Firebase Auth custom claims to remove funeral director privileges
		const auth = getAuth();
		try {
			const userRecord = await auth.getUser(directorId);
			const currentClaims = userRecord.customClaims || {};
			
			console.log('🔐 [ADMIN API] Updating Firebase Auth claims for:', directorId);
			
			await auth.setCustomUserClaims(directorId, {
				...currentClaims,
				role: 'owner', // Revert to basic owner role
				approved: false,
				canCreateMemorials: false,
				canLivestream: false
			});

			console.log('✅ [ADMIN API] Firebase Auth claims updated successfully');
		} catch (authError) {
			console.error('⚠️ [ADMIN API] Failed to update Firebase Auth claims:', authError);
			// Continue with success since the main rejection was completed
		}

		// Log the rejection action for audit trail
		console.log('📝 [ADMIN API] Logging rejection action to audit trail');
		
		try {
			await adminDb.collection('admin_actions').add({
				action: 'reject_funeral_director',
				targetId: directorId,
				targetType: 'funeral_director',
				performedBy: locals.user.uid,
				performedByEmail: locals.user.email,
				timestamp: Timestamp.now(),
				details: {
					companyName: directorData?.companyName,
					contactPerson: directorData?.contactPerson,
					licenseNumber: directorData?.licenseNumber
				}
			});
			console.log('✅ [ADMIN API] Audit log created successfully');
		} catch (auditError) {
			console.error('⚠️ [ADMIN API] Failed to create audit log:', auditError);
			// Continue with success since the main rejection was completed
		}

		console.log('🚫 [ADMIN API] Funeral director rejection completed successfully');

		return json({
			success: true,
			message: 'Funeral director application rejected',
			directorId,
			rejectedAt: updateData.rejectedAt.toDate().toISOString()
		});

	} catch (error) {
		console.error('💥 [ADMIN API] Error rejecting funeral director:', {
			error: error.message,
			stack: error.stack,
			user: locals.user?.email
		});
		
		return json({ 
			error: 'Internal server error occurred while rejecting funeral director' 
		}, { status: 500 });
	}
};
