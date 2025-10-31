import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

// Mock Firebase Admin
vi.mock('$lib/server/firebase', () => ({
	adminDb: {
		collection: vi.fn(() => ({
			doc: vi.fn(() => ({
				get: vi.fn()
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

import { adminDb } from '$lib/server/firebase';
import { json, error } from '@sveltejs/kit';

describe('Demo Session Status API', () => {
	let mockRequest: Partial<RequestEvent>;

	beforeEach(() => {
		vi.clearAllMocks();

		mockRequest = {
			params: {
				id: 'demo_123_abc'
			}
		};
	});

	it('should return session status for active session', async () => {
		const now = Date.now();
		const expiresAt = new Date(now + 60 * 60 * 1000); // 1 hour from now

		const mockSessionData = {
			id: 'demo_123_abc',
			status: 'active',
			currentRole: 'funeral_director',
			createdAt: {
				toDate: () => new Date(now)
			},
			expiresAt: {
				toDate: () => expiresAt
			},
			users: {
				admin: { uid: 'admin-123', email: 'admin@test.com', role: 'admin' }
			},
			metadata: {
				scenario: 'first_memorial_service'
			}
		};

		const mockGet = vi.fn().mockResolvedValue({
			exists: true,
			data: () => mockSessionData
		});

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn().mockReturnValue({ get: mockGet })
		} as any);

		const { GET } = await import('../../src/routes/api/demo/session/[id]/+server');
		await GET(mockRequest as RequestEvent);

		expect(json).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 'demo_123_abc',
				status: 'active',
				isExpired: false,
				timeRemaining: expect.any(Number),
				currentRole: 'funeral_director',
				users: mockSessionData.users
			})
		);

		// Verify timeRemaining is approximately 1 hour (3600 seconds)
		const response = (json as any).mock.calls[0][0];
		expect(response.timeRemaining).toBeGreaterThan(3500);
		expect(response.timeRemaining).toBeLessThan(3700);
	});

	it('should detect expired session', async () => {
		const now = Date.now();
		const expiresAt = new Date(now - 10000); // 10 seconds ago (expired)

		const mockSessionData = {
			id: 'demo_123_abc',
			status: 'active',
			currentRole: 'owner',
			createdAt: {
				toDate: () => new Date(now - 2 * 60 * 60 * 1000)
			},
			expiresAt: {
				toDate: () => expiresAt
			},
			users: {},
			metadata: {}
		};

		const mockGet = vi.fn().mockResolvedValue({
			exists: true,
			data: () => mockSessionData
		});

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn().mockReturnValue({ get: mockGet })
		} as any);

		const { GET } = await import('../../src/routes/api/demo/session/[id]/+server');
		await GET(mockRequest as RequestEvent);

		expect(json).toHaveBeenCalledWith(
			expect.objectContaining({
				status: 'expired', // Changed from 'active'
				isExpired: true,
				timeRemaining: 0
			})
		);
	});

	it('should return 404 for non-existent session', async () => {
		const mockGet = vi.fn().mockResolvedValue({
			exists: false
		});

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn().mockReturnValue({ get: mockGet })
		} as any);

		const { GET } = await import('../../src/routes/api/demo/session/[id]/+server');

		await expect(GET(mockRequest as RequestEvent)).rejects.toThrow();
		expect(error).toHaveBeenCalledWith(404, 'Demo session not found');
	});

	it('should return 400 if session ID missing', async () => {
		mockRequest.params = { id: undefined as any };

		const { GET } = await import('../../src/routes/api/demo/session/[id]/+server');

		await expect(GET(mockRequest as RequestEvent)).rejects.toThrow();
		expect(error).toHaveBeenCalledWith(400, 'Session ID required');
	});

	it('should calculate time remaining correctly', async () => {
		const testCases = [
			{ remainingMs: 5 * 60 * 1000, expectedSeconds: 300 }, // 5 minutes
			{ remainingMs: 30 * 60 * 1000, expectedSeconds: 1800 }, // 30 minutes
			{ remainingMs: 2 * 60 * 60 * 1000, expectedSeconds: 7200 } // 2 hours
		];

		for (const testCase of testCases) {
			vi.clearAllMocks();

			const now = Date.now();
			const expiresAt = new Date(now + testCase.remainingMs);

			const mockSessionData = {
				id: 'demo_123_abc',
				status: 'active',
				currentRole: 'viewer',
				createdAt: { toDate: () => new Date(now) },
				expiresAt: { toDate: () => expiresAt },
				users: {},
				metadata: {}
			};

			const mockGet = vi.fn().mockResolvedValue({
				exists: true,
				data: () => mockSessionData
			});

			vi.mocked(adminDb.collection).mockReturnValue({
				doc: vi.fn().mockReturnValue({ get: mockGet })
			} as any);

			const { GET } = await import('../../src/routes/api/demo/session/[id]/+server');
			await GET(mockRequest as RequestEvent);

			const response = (json as any).mock.calls[0][0];
			expect(response.timeRemaining).toBeCloseTo(testCase.expectedSeconds, -1);
		}
	});

	it('should include all session data in response', async () => {
		const now = Date.now();

		const mockSessionData = {
			id: 'demo_123_abc',
			status: 'active',
			currentRole: 'admin',
			createdAt: {
				toDate: () => new Date(now)
			},
			expiresAt: {
				toDate: () => new Date(now + 60 * 60 * 1000)
			},
			users: {
				admin: { uid: 'admin-123', email: 'admin@test.com', role: 'admin' },
				owner: { uid: 'owner-123', email: 'owner@test.com', role: 'owner' }
			},
			metadata: {
				scenario: 'test_scenario',
				ipAddress: '127.0.0.1',
				entryPoint: 'landing_page'
			}
		};

		const mockGet = vi.fn().mockResolvedValue({
			exists: true,
			data: () => mockSessionData
		});

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn().mockReturnValue({ get: mockGet })
		} as any);

		const { GET } = await import('../../src/routes/api/demo/session/[id]/+server');
		await GET(mockRequest as RequestEvent);

		const response = (json as any).mock.calls[0][0];

		expect(response).toHaveProperty('id', 'demo_123_abc');
		expect(response).toHaveProperty('status');
		expect(response).toHaveProperty('isExpired');
		expect(response).toHaveProperty('timeRemaining');
		expect(response).toHaveProperty('currentRole', 'admin');
		expect(response).toHaveProperty('users');
		expect(response).toHaveProperty('metadata');
		expect(response).toHaveProperty('createdAt');
		expect(response).toHaveProperty('expiresAt');
	});
});
