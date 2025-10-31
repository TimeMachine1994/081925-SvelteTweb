import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

// Mock Firebase Admin
vi.mock('$lib/server/firebase', () => ({
	adminAuth: {
		createCustomToken: vi.fn()
	},
	adminDb: {
		collection: vi.fn(() => ({
			doc: vi.fn(() => ({
				get: vi.fn(),
				update: vi.fn()
			}))
		}))
	}
}));

// Mock SvelteKit functions
vi.mock('@sveltejs/kit', () => ({
	json: vi.fn((data) => ({ body: data })),
	error: vi.fn((status, message) => {
		throw new Error(`${status}: ${message}`);
	})
}));

import { adminAuth, adminDb } from '$lib/server/firebase';
import { json, error } from '@sveltejs/kit';

describe('Demo Role Switching API', () => {
	let mockRequest: Partial<RequestEvent>;
	let mockSessionData: any;

	beforeEach(() => {
		vi.clearAllMocks();

		// Setup mock session data
		mockSessionData = {
			id: 'demo_123_abc',
			status: 'active',
			expiresAt: {
				toDate: () => new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
			},
			users: {
				admin: {
					uid: 'demo-admin-123',
					email: 'demo-admin@test.com',
					role: 'admin',
					displayName: 'Demo Admin'
				},
				funeral_director: {
					uid: 'demo-fd-123',
					email: 'demo-fd@test.com',
					role: 'funeral_director',
					displayName: 'Demo FD'
				},
				owner: {
					uid: 'demo-owner-123',
					email: 'demo-owner@test.com',
					role: 'owner',
					displayName: 'Demo Owner'
				},
				viewer: {
					uid: 'demo-viewer-123',
					email: 'demo-viewer@test.com',
					role: 'viewer',
					displayName: 'Demo Viewer'
				}
			},
			currentRole: 'funeral_director'
		};

		// Setup mock request (demo user authenticated)
		mockRequest = {
			locals: {
				user: {
					uid: 'demo-fd-123',
					email: 'demo-fd@test.com',
					role: 'funeral_director',
					isAdmin: false,
					displayName: 'Demo FD',
					isDemo: true,
					demoSessionId: 'demo_123_abc'
				}
			},
			request: {
				json: vi.fn().mockResolvedValue({
					targetRole: 'owner'
				})
			} as any
		};
	});

	it('should switch role successfully', async () => {
		// Mock Firestore operations
		const mockGet = vi.fn().mockResolvedValue({
			exists: true,
			data: () => mockSessionData
		});

		const mockUpdate = vi.fn().mockResolvedValue(undefined);

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn().mockReturnValue({
				get: mockGet,
				update: mockUpdate
			})
		} as any);

		vi.mocked(adminAuth.createCustomToken).mockResolvedValue('new-custom-token');

		// Import and call the POST handler
		const { POST } = await import('../../src/routes/api/demo/switch-role/+server');
		await POST(mockRequest as RequestEvent);

		// Verify session was fetched
		expect(mockGet).toHaveBeenCalled();

		// Verify custom token was created for target user
		expect(adminAuth.createCustomToken).toHaveBeenCalledWith('demo-owner-123', {
			role: 'owner',
			isDemo: true,
			demoSessionId: 'demo_123_abc'
		});

		// Verify session was updated
		expect(mockUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				currentRole: 'owner'
			})
		);

		// Verify response
		expect(json).toHaveBeenCalledWith(
			expect.objectContaining({
				success: true,
				customToken: 'new-custom-token',
				role: 'owner',
				user: mockSessionData.users.owner
			})
		);
	});

	it('should reject unauthenticated users', async () => {
		mockRequest.locals!.user = null;

		const { POST } = await import('../../src/routes/api/demo/switch-role/+server');

		await expect(POST(mockRequest as RequestEvent)).rejects.toThrow();
		expect(error).toHaveBeenCalledWith(401, 'Not authenticated');
	});

	it('should reject non-demo users', async () => {
		mockRequest.locals!.user!.isDemo = false;
		mockRequest.locals!.user!.demoSessionId = undefined;

		const { POST } = await import('../../src/routes/api/demo/switch-role/+server');

		await expect(POST(mockRequest as RequestEvent)).rejects.toThrow();
		expect(error).toHaveBeenCalledWith(
			403,
			'Not in demo mode. Only demo users can switch roles.'
		);
	});

	it('should reject invalid target roles', async () => {
		mockRequest.request!.json = vi.fn().mockResolvedValue({
			targetRole: 'invalid_role'
		});

		const mockGet = vi.fn().mockResolvedValue({
			exists: true,
			data: () => mockSessionData
		});

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn().mockReturnValue({ get: mockGet })
		} as any);

		const { POST } = await import('../../src/routes/api/demo/switch-role/+server');

		await expect(POST(mockRequest as RequestEvent)).rejects.toThrow();
		expect(error).toHaveBeenCalledWith(
			400,
			'Invalid target role. Must be one of: admin, funeral_director, owner, viewer'
		);
	});

	it('should reject switching to same role', async () => {
		mockRequest.request!.json = vi.fn().mockResolvedValue({
			targetRole: 'funeral_director' // Same as current
		});

		const mockGet = vi.fn().mockResolvedValue({
			exists: true,
			data: () => mockSessionData
		});

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn().mockReturnValue({ get: mockGet })
		} as any);

		const { POST } = await import('../../src/routes/api/demo/switch-role/+server');

		await expect(POST(mockRequest as RequestEvent)).rejects.toThrow();
		expect(error).toHaveBeenCalledWith(400, 'Already in the target role');
	});

	it('should reject switching in expired session', async () => {
		mockSessionData.expiresAt = {
			toDate: () => new Date(Date.now() - 1000) // 1 second ago (expired)
		};

		const mockGet = vi.fn().mockResolvedValue({
			exists: true,
			data: () => mockSessionData
		});

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn().mockReturnValue({ get: mockGet })
		} as any);

		const { POST } = await import('../../src/routes/api/demo/switch-role/+server');

		await expect(POST(mockRequest as RequestEvent)).rejects.toThrow();
		expect(error).toHaveBeenCalledWith(410, 'Demo session has expired. Please start a new demo.');
	});

	it('should reject switching in ended session', async () => {
		mockSessionData.status = 'ended';

		const mockGet = vi.fn().mockResolvedValue({
			exists: true,
			data: () => mockSessionData
		});

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn().mockReturnValue({ get: mockGet })
		} as any);

		const { POST } = await import('../../src/routes/api/demo/switch-role/+server');

		await expect(POST(mockRequest as RequestEvent)).rejects.toThrow();
		expect(error).toHaveBeenCalledWith(410, 'Demo session is ended. Cannot switch roles.');
	});

	it('should reject if session not found', async () => {
		const mockGet = vi.fn().mockResolvedValue({
			exists: false
		});

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn().mockReturnValue({ get: mockGet })
		} as any);

		const { POST } = await import('../../src/routes/api/demo/switch-role/+server');

		await expect(POST(mockRequest as RequestEvent)).rejects.toThrow();
		expect(error).toHaveBeenCalledWith(404, 'Demo session not found');
	});

	it('should allow switching to all 4 roles', async () => {
		const roles = ['admin', 'funeral_director', 'owner', 'viewer'];

		for (const targetRole of roles) {
			if (targetRole === 'funeral_director') continue; // Skip current role

			vi.clearAllMocks();

			mockRequest.request!.json = vi.fn().mockResolvedValue({ targetRole });

			const mockGet = vi.fn().mockResolvedValue({
				exists: true,
				data: () => mockSessionData
			});

			const mockUpdate = vi.fn().mockResolvedValue(undefined);

			vi.mocked(adminDb.collection).mockReturnValue({
				doc: vi.fn().mockReturnValue({
					get: mockGet,
					update: mockUpdate
				})
			} as any);

			vi.mocked(adminAuth.createCustomToken).mockResolvedValue('token');

			const { POST } = await import('../../src/routes/api/demo/switch-role/+server');
			await POST(mockRequest as RequestEvent);

			expect(mockUpdate).toHaveBeenCalledWith(
				expect.objectContaining({
					currentRole: targetRole
				})
			);
		}
	});
});
