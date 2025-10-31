import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

// Mock Firebase Admin
vi.mock('$lib/server/firebase', () => ({
	adminAuth: {
		createUser: vi.fn(),
		setCustomUserClaims: vi.fn(),
		createCustomToken: vi.fn(),
		deleteUser: vi.fn()
	},
	adminDb: {
		collection: vi.fn(() => ({
			doc: vi.fn(() => ({
				set: vi.fn(),
				get: vi.fn(),
				update: vi.fn()
			})),
			where: vi.fn(() => ({
				get: vi.fn()
			}))
		}))
	},
	adminStorage: {
		bucket: vi.fn()
	}
}));

// Mock SvelteKit functions
vi.mock('@sveltejs/kit', () => ({
	json: vi.fn((data) => ({ body: data })),
	error: vi.fn((status, message) => {
		throw new Error(`${status}: ${message}`);
	})
}));

// Mock crypto
vi.mock('crypto', () => ({
	default: {
		randomBytes: vi.fn(() => ({
			toString: vi.fn(() => 'abc123')
		}))
	}
}));

import { adminAuth, adminDb } from '$lib/server/firebase';
import { json, error } from '@sveltejs/kit';

describe('Demo Session Creation API', () => {
	let mockRequest: Partial<RequestEvent>;

	beforeEach(() => {
		vi.clearAllMocks();

		// Setup mock request
		mockRequest = {
			locals: {
				user: {
					uid: 'admin-123',
					email: 'admin@test.com',
					role: 'admin',
					isAdmin: true,
					displayName: 'Test Admin'
				}
			},
			request: {
				json: vi.fn().mockResolvedValue({
					scenario: 'first_memorial_service',
					duration: 2
				}),
				headers: {
					get: vi.fn((header) => {
						if (header === 'x-forwarded-for') return '127.0.0.1';
						if (header === 'user-agent') return 'Test Browser';
						return null;
					})
				}
			} as any
		};
	});

	it('should create a demo session with 4 users successfully', async () => {
		// Mock Firebase operations
		const mockUserRecords = {
			admin: { uid: 'demo-admin-123', email: 'demo-admin@test.com' },
			funeral_director: { uid: 'demo-fd-123', email: 'demo-fd@test.com' },
			owner: { uid: 'demo-owner-123', email: 'demo-owner@test.com' },
			viewer: { uid: 'demo-viewer-123', email: 'demo-viewer@test.com' }
		};

		let createUserCallCount = 0;
		vi.mocked(adminAuth.createUser).mockImplementation(async (props: any) => {
			const role = props.email.split('-')[1];
			createUserCallCount++;
			return mockUserRecords[role as keyof typeof mockUserRecords] as any;
		});

		vi.mocked(adminAuth.setCustomUserClaims).mockResolvedValue();
		vi.mocked(adminAuth.createCustomToken).mockResolvedValue('mock-custom-token');

		const mockSet = vi.fn().mockResolvedValue(undefined);
		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn().mockReturnValue({
				set: mockSet
			})
		} as any);

		// Import and call the POST handler
		const { POST } = await import('../../src/routes/api/demo/session/+server');
		const result = await POST(mockRequest as RequestEvent);

		// Verify 4 users were created
		expect(createUserCallCount).toBe(4);

		// Verify custom claims were set for each user
		expect(adminAuth.setCustomUserClaims).toHaveBeenCalledTimes(4);

		// Verify custom token was generated
		expect(adminAuth.createCustomToken).toHaveBeenCalledWith(
			'demo-fd-123',
			expect.objectContaining({
				role: 'funeral_director',
				isDemo: true
			})
		);

		// Verify session document was created
		expect(mockSet).toHaveBeenCalledWith(
			expect.objectContaining({
				status: 'active',
				currentRole: 'funeral_director',
				createdBy: 'admin-123'
			})
		);

		// Verify response
		expect(json).toHaveBeenCalledWith(
			expect.objectContaining({
				success: true,
				customToken: 'mock-custom-token',
				initialRole: 'funeral_director'
			})
		);
	});

	it('should reject non-admin users', async () => {
		mockRequest.locals!.user!.role = 'owner';
		mockRequest.locals!.user!.isAdmin = false;

		const { POST } = await import('../../src/routes/api/demo/session/+server');

		await expect(POST(mockRequest as RequestEvent)).rejects.toThrow();
		expect(error).toHaveBeenCalledWith(403, expect.any(String));
	});

	it('should validate session duration limits', async () => {
		mockRequest.request!.json = vi.fn().mockResolvedValue({
			scenario: 'test',
			duration: 10 // Too long
		});

		const { POST } = await import('../../src/routes/api/demo/session/+server');

		await expect(POST(mockRequest as RequestEvent)).rejects.toThrow();
		expect(error).toHaveBeenCalledWith(
			400,
			'Session duration must be between 0.5 and 4 hours'
		);
	});

	it('should create session with correct metadata', async () => {
		vi.mocked(adminAuth.createUser).mockResolvedValue({ uid: 'test-uid' } as any);
		vi.mocked(adminAuth.setCustomUserClaims).mockResolvedValue();
		vi.mocked(adminAuth.createCustomToken).mockResolvedValue('token');

		const mockSet = vi.fn().mockResolvedValue(undefined);
		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn().mockReturnValue({ set: mockSet })
		} as any);

		const { POST } = await import('../../src/routes/api/demo/session/+server');
		await POST(mockRequest as RequestEvent);

		expect(mockSet).toHaveBeenCalledWith(
			expect.objectContaining({
				metadata: expect.objectContaining({
					ipAddress: '127.0.0.1',
					userAgent: 'Test Browser',
					entryPoint: 'landing_page',
					scenario: 'first_memorial_service'
				})
			})
		);
	});

	it('should generate unique session IDs', async () => {
		vi.mocked(adminAuth.createUser).mockResolvedValue({ uid: 'test-uid' } as any);
		vi.mocked(adminAuth.setCustomUserClaims).mockResolvedValue();
		vi.mocked(adminAuth.createCustomToken).mockResolvedValue('token');

		const mockSet = vi.fn().mockResolvedValue(undefined);
		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn().mockReturnValue({ set: mockSet })
		} as any);

		const { POST } = await import('../../src/routes/api/demo/session/+server');
		await POST(mockRequest as RequestEvent);

		const sessionData = mockSet.mock.calls[0][0];
		expect(sessionData.id).toMatch(/^demo_\d+_[a-f0-9]+$/);
	});

	it('should set correct expiration time', async () => {
		vi.mocked(adminAuth.createUser).mockResolvedValue({ uid: 'test-uid' } as any);
		vi.mocked(adminAuth.setCustomUserClaims).mockResolvedValue();
		vi.mocked(adminAuth.createCustomToken).mockResolvedValue('token');

		const mockSet = vi.fn().mockResolvedValue(undefined);
		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn().mockReturnValue({ set: mockSet })
		} as any);

		mockRequest.request!.json = vi.fn().mockResolvedValue({
			scenario: 'test',
			duration: 3 // 3 hours
		});

		const { POST } = await import('../../src/routes/api/demo/session/+server');
		await POST(mockRequest as RequestEvent);

		const sessionData = mockSet.mock.calls[0][0];
		const timeDiff = sessionData.expiresAt.getTime() - sessionData.createdAt.getTime();
		const hoursDiff = timeDiff / (1000 * 60 * 60);

		expect(hoursDiff).toBeCloseTo(3, 1);
	});
});
