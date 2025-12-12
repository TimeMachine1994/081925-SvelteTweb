import { describe, it, expect, beforeEach, vi } from 'vitest';
import { verifyEventAccess, hasPhotoUploadPermission } from './eventAccess';
import type { User } from 'firebase/auth';

describe('Event Access Verification', () => {
	const mockUser: Partial<User> = {
		uid: 'test-user-123',
		email: 'test@example.com'
	};

	const mockMemorial = {
		id: 'event-123',
		ownerUid: 'test-user-123', // V1: Updated field name
		funeralDirectorUid: 'fd-789' // V1: Updated field name
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	// Mock checkInvitationStatus function
	vi.mock('./eventAccess', async () => {
		const actual = await vi.importActual('./eventAccess');
		return {
			...actual,
			checkInvitationStatus: vi.fn()
		};
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('verifyEventAccess', () => {
		it('should allow owner access', async () => {
			const userWithOwnerRole = {
				...mockUser,
				customClaims: { role: 'owner' }
			};

			const result = await verifyEventAccess(
				userWithOwnerRole as User,
				mockMemorial.id,
				mockMemorial
			);

			expect(result.hasAccess).toBe(true);
			expect(result.accessLevel).toBe('admin');
		});

		it('should allow funeral director access', async () => {
			const userWithFDRole = {
				...mockUser,
				customClaims: { role: 'funeral_director' }
			};

			// Mock event where user is funeral director
			const fdMemorial = {
				...mockMemorial,
				funeralDirectorUid: mockUser.uid
			};

			const result = await verifyEventAccess(userWithFDRole as User, fdMemorial.id, fdMemorial);

			expect(result.hasAccess).toBe(true);
			expect(result.accessLevel).toBe('admin');
		});

		it('should allow admin access to any event', async () => {
			const adminUser = {
				...mockUser,
				uid: 'different-user-456', // Different UID to test admin override
				customClaims: { role: 'admin', admin: true }
			};

			// Mock the event with V1 field structure
			const v1Memorial = {
				...mockMemorial,
				ownerUid: 'test-user-123',
				funeralDirectorUid: 'fd-789'
			};

			const result = await verifyEventAccess(adminUser as User, v1Memorial.id, v1Memorial);

			expect(result.hasAccess).toBe(true);
			expect(result.accessLevel).toBe('admin');
		});

		it('should deny access for users without valid roles', async () => {
			const unauthorizedUser = {
				...mockUser,
				uid: 'different-user-456',
				customClaims: { role: 'unknown' }
			};

			const result = await verifyEventAccess(
				unauthorizedUser as User,
				mockMemorial.id,
				mockMemorial
			);

			expect(result.hasAccess).toBe(false);
			expect(result.reason).toContain('No access permission');
		});
	});

	describe('hasPhotoUploadPermission - V1 (Photo uploads disabled)', () => {
		it('should deny photo upload for all roles in V1', () => {
			expect(hasPhotoUploadPermission('owner', true)).toBe(false);
			expect(hasPhotoUploadPermission('admin', true)).toBe(false);
			expect(hasPhotoUploadPermission('funeral_director', true)).toBe(false);
		});

		it('should deny photo upload for unknown roles', () => {
			const result = hasPhotoUploadPermission('unknown_role' as any, false);
			expect(result).toBe(false);
		});
	});
});
