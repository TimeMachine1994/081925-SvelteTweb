import { adminDb } from '$lib/firebase-admin';
import type { FuneralDirectorApplication, UserManagementData, AdminDashboardStats } from '$lib/types/admin';

export class AdminService {
	/**
	 * Get all users for admin management
	 */
	static async getAllUsers(): Promise<UserManagementData[]> {
		try {
			const usersSnap = await adminDb.collection('users').get();
			const users: UserManagementData[] = [];

			for (const doc of usersSnap.docs) {
				const userData = doc.data();
				
				// Count memorials for this user
				const memorialsSnap = await adminDb
					.collection('memorials')
					.where('ownerUid', '==', doc.id)
					.get();

				users.push({
					uid: doc.id,
					email: userData.email,
					displayName: userData.displayName,
					role: userData.role || 'viewer',
					isAdmin: userData.isAdmin || false,
					suspended: userData.suspended || false,
					suspendedReason: userData.suspendedReason,
					createdAt: userData.createdAt?.toDate() || new Date(),
					lastLoginAt: userData.lastLoginAt?.toDate(),
					memorialCount: memorialsSnap.size
				});
			}

			return users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
		} catch (error) {
			console.error('Error getting all users:', error);
			throw new Error('Failed to fetch users');
		}
	}

	/**
	 * Create a new user with specified role
	 */
	static async createUser(userData: {
		email: string;
		displayName?: string;
		role: 'admin' | 'owner' | 'funeral_director' | 'family_member' | 'viewer';
		isAdmin?: boolean;
	}): Promise<void> {
		try {
			const userRef = adminDb.collection('users').doc();
			await userRef.set({
				...userData,
				createdAt: new Date(),
				suspended: false,
				isAdmin: userData.isAdmin || userData.role === 'admin'
			});
		} catch (error) {
			console.error('Error creating user:', error);
			throw new Error('Failed to create user');
		}
	}

	/**
	 * Update user role and permissions
	 */
	static async updateUser(uid: string, updates: Partial<UserManagementData>): Promise<void> {
		try {
			const userRef = adminDb.collection('users').doc(uid);
			await userRef.update({
				...updates,
				updatedAt: new Date()
			});
		} catch (error) {
			console.error('Error updating user:', error);
			throw new Error('Failed to update user');
		}
	}

	/**
	 * Suspend or activate user account
	 */
	static async suspendUser(uid: string, reason?: string): Promise<void> {
		try {
			const userRef = adminDb.collection('users').doc(uid);
			await userRef.update({
				suspended: true,
				suspendedReason: reason,
				suspendedAt: new Date()
			});
		} catch (error) {
			console.error('Error suspending user:', error);
			throw new Error('Failed to suspend user');
		}
	}

	static async activateUser(uid: string): Promise<void> {
		try {
			const userRef = adminDb.collection('users').doc(uid);
			await userRef.update({
				suspended: false,
				suspendedReason: null,
				suspendedAt: null,
				reactivatedAt: new Date()
			});
		} catch (error) {
			console.error('Error activating user:', error);
			throw new Error('Failed to activate user');
		}
	}

	/**
	 * Delete user account (soft delete)
	 */
	static async deleteUser(uid: string): Promise<void> {
		try {
			const userRef = adminDb.collection('users').doc(uid);
			await userRef.update({
				deleted: true,
				deletedAt: new Date()
			});
		} catch (error) {
			console.error('Error deleting user:', error);
			throw new Error('Failed to delete user');
		}
	}

	/**
	 * Get pending funeral director applications
	 */
	static async getPendingApplications(): Promise<FuneralDirectorApplication[]> {
		try {
			const applicationsSnap = await adminDb
				.collection('funeral_director_applications')
				.where('status', '==', 'pending_review')
				.orderBy('createdAt', 'desc')
				.get();

			return applicationsSnap.docs.map(doc => ({
				id: doc.id,
				...doc.data(),
				createdAt: doc.data().createdAt?.toDate() || new Date(),
				updatedAt: doc.data().updatedAt?.toDate() || new Date(),
				reviewedAt: doc.data().reviewedAt?.toDate()
			})) as FuneralDirectorApplication[];
		} catch (error) {
			console.error('Error getting pending applications:', error);
			throw new Error('Failed to fetch applications');
		}
	}

	/**
	 * Approve funeral director application
	 */
	static async approveApplication(applicationId: string, adminId: string): Promise<void> {
		try {
			const applicationRef = adminDb.collection('funeral_director_applications').doc(applicationId);
			const applicationDoc = await applicationRef.get();
			
			if (!applicationDoc.exists) {
				throw new Error('Application not found');
			}

			const applicationData = applicationDoc.data() as FuneralDirectorApplication;

			// Update application status
			await applicationRef.update({
				status: 'approved',
				reviewedBy: adminId,
				reviewedAt: new Date(),
				updatedAt: new Date()
			});

			// Update user role to funeral_director
			const userRef = adminDb.collection('users').doc(applicationData.userId);
			await userRef.update({
				role: 'funeral_director',
				approvedAt: new Date(),
				updatedAt: new Date()
			});

		} catch (error) {
			console.error('Error approving application:', error);
			throw new Error('Failed to approve application');
		}
	}

	/**
	 * Reject funeral director application
	 */
	static async rejectApplication(applicationId: string, adminId: string, reason?: string): Promise<void> {
		try {
			const applicationRef = adminDb.collection('funeral_director_applications').doc(applicationId);
			await applicationRef.update({
				status: 'rejected',
				reviewedBy: adminId,
				reviewedAt: new Date(),
				adminNotes: reason,
				updatedAt: new Date()
			});
		} catch (error) {
			console.error('Error rejecting application:', error);
			throw new Error('Failed to reject application');
		}
	}

	/**
	 * Get admin dashboard statistics
	 */
	static async getDashboardStats(): Promise<AdminDashboardStats> {
		try {
			const now = new Date();
			const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

			// Get total counts
			const [usersSnap, memorialsSnap, applicationsSnap] = await Promise.all([
				adminDb.collection('users').where('deleted', '!=', true).get(),
				adminDb.collection('memorials').get(),
				adminDb.collection('funeral_director_applications').where('status', '==', 'pending_review').get()
			]);

			// Get new users this week
			const newUsersSnap = await adminDb
				.collection('users')
				.where('createdAt', '>=', oneWeekAgo)
				.where('deleted', '!=', true)
				.get();

			// Get new memorials this week
			const newMemorialsSnap = await adminDb
				.collection('memorials')
				.where('createdAt', '>=', oneWeekAgo)
				.get();

			// Count active streams (simplified - in production would check actual stream status)
			const activeStreamsSnap = await adminDb
				.collection('memorials')
				.where('livestreamActive', '==', true)
				.get();

			return {
				totalUsers: usersSnap.size,
				totalMemorials: memorialsSnap.size,
				pendingApplications: applicationsSnap.size,
				activeStreams: activeStreamsSnap.size,
				newUsersThisWeek: newUsersSnap.size,
				newMemorialsThisWeek: newMemorialsSnap.size
			};
		} catch (error) {
			console.error('Error getting dashboard stats:', error);
			throw new Error('Failed to fetch dashboard statistics');
		}
	}

	/**
	 * Log admin action for audit trail
	 */
	static async logAdminAction(adminId: string, action: string, targetType: string, targetId: string, details: Record<string, any>): Promise<void> {
		try {
			const auditRef = adminDb.collection('admin_audit_logs').doc();
			await auditRef.set({
				adminId,
				action,
				targetType,
				targetId,
				details,
				timestamp: new Date()
			});
		} catch (error) {
			console.error('Error logging admin action:', error);
			// Don't throw error for logging failures
		}
	}
}
