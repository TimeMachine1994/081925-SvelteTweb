import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Admin API endpoint to approve a funeral director application
 * Updates status to 'approved' and grants necessary permissions
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	console.log('🏥 [ADMIN API] Funeral director approval request received');
	
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

		console.log('🔍 [ADMIN API] Processing approval for director ID:', directorId);

		// Get the funeral director document
		const directorRef = adminDb.collection('funeral_directors').doc(directorId);
		const directorDoc = await directorRef.get();

		if (!directorDoc.exists) {
			console.log('❌ [ADMIN API] Funeral director not found:', directorId);
			return json({ error: 'Funeral director not found' }, { status: 404 });
		}

		const directorData = directorDoc.data();
		console.log('📋 [ADMIN API] Current director status:', directorData?.status);

		// Update funeral director status and permissions
		const updateData = {
			status: 'approved',
			verificationStatus: 'verified',
			permissions: {
				canCreateMemorials: true,
				canManageMemorials: true,
				canLivestream: true,
				maxMemorials: 50 // Default limit for approved directors
			},
			streamingConfig: {
				...directorData?.streamingConfig,
				streamingEnabled: true,
				maxConcurrentStreams: 3
			},
			approvedAt: Timestamp.now(),
			approvedBy: locals.user.uid,
			updatedAt: Timestamp.now()
		};

		console.log('💾 [ADMIN API] Updating director with approval data:', {
			directorId,
			newStatus: updateData.status,
			permissions: updateData.permissions
		});

		await directorRef.update(updateData);

		// Update user's Firebase Auth custom claims to include approved funeral_director role
		const auth = getAuth();
		try {
			const userRecord = await auth.getUser(directorId);
			const currentClaims = userRecord.customClaims || {};
			
			console.log('🔐 [ADMIN API] Updating Firebase Auth claims for:', directorId);
			
			await auth.setCustomUserClaims(directorId, {
				...currentClaims,
				role: 'funeral_director',
				approved: true,
				canCreateMemorials: true,
				canLivestream: true
			});

			console.log('✅ [ADMIN API] Firebase Auth claims updated successfully');
		} catch (authError) {
			console.error('⚠️ [ADMIN API] Failed to update Firebase Auth claims:', authError);
			// Continue with success since the main approval was completed
		}

		// Log the approval action for audit trail
		console.log('📝 [ADMIN API] Logging approval action to audit trail');
		
		try {
			await adminDb.collection('admin_actions').add({
				action: 'approve_funeral_director',
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
			// Continue with success since the main approval was completed
		}

		console.log('🎉 [ADMIN API] Funeral director approval completed successfully');

		return json({
			success: true,
			message: 'Funeral director approved successfully',
			directorId,
			approvedAt: updateData.approvedAt.toDate().toISOString()
		});

	} catch (error) {
		console.error('💥 [ADMIN API] Error approving funeral director:', {
			error: error.message,
			stack: error.stack,
			user: locals.user?.email
		});
		
		return json({ 
			error: 'Internal server error occurred while approving funeral director' 
		}, { status: 500 });
	}
};
