export interface AdminUser {
	uid: string;
	email: string;
	role: 'admin';
	isAdmin: true;
	createdAt: Date;
	lastLoginAt?: Date;
}

export interface FuneralDirectorApplication {
	id: string;
	userId: string;
	userEmail: string;
	businessName: string;
	licenseNumber: string;
	phoneNumber: string;
	address: string;
	status: 'pending_review' | 'approved' | 'rejected';
	adminNotes?: string;
	reviewedBy?: string;
	reviewedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface UserManagementData {
	uid: string;
	email: string;
	displayName?: string;
	role: 'admin' | 'owner' | 'funeral_director' | 'family_member' | 'viewer';
	isAdmin: boolean;
	suspended: boolean;
	suspendedReason?: string;
	createdAt: Date;
	lastLoginAt?: Date;
	memorialCount?: number;
}

export interface AdminDashboardStats {
	totalUsers: number;
	totalMemorials: number;
	pendingApplications: number;
	activeStreams: number;
	newUsersThisWeek: number;
	newMemorialsThisWeek: number;
}

export interface AdminAction {
	id: string;
	adminId: string;
	action: 'user_created' | 'user_suspended' | 'user_deleted' | 'role_changed' | 'application_approved' | 'application_rejected';
	targetType: 'user' | 'memorial' | 'application';
	targetId: string;
	details: Record<string, any>;
	timestamp: Date;
	ipAddress?: string;
}
