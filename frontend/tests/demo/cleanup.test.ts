import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

// Mock Firebase Admin
vi.mock('$lib/server/firebase', () => ({
	adminAuth: {
		deleteUser: vi.fn()
	},
	adminDb: {
		collection: vi.fn(() => ({
			doc: vi.fn(() => ({
				delete: vi.fn(),
				update: vi.fn(),
				collection: vi.fn(() => ({
					where: vi.fn(() => ({
						get: vi.fn()
					}))
				}))
			})),
			where: vi.fn(() => ({
				get: vi.fn()
			}))
		}))
	},
	adminStorage: {
		bucket: vi.fn(() => ({
			file: vi.fn(() => ({
				delete: vi.fn()
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

import { adminAuth, adminDb, adminStorage } from '$lib/server/firebase';
import { json, error } from '@sveltejs/kit';

describe('Demo Cleanup API', () => {
	let mockRequest: Partial<RequestEvent>;

	beforeEach(() => {
		vi.clearAllMocks();

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
			url: {
				searchParams: {
					get: vi.fn()
				}
			} as any
		};
	});

	it('should clean up expired sessions successfully', async () => {
		const expiredSession = {
			id: 'demo_123_abc',
			status: 'active',
			users: {
				admin: { uid: 'demo-admin-123' },
				funeral_director: { uid: 'demo-fd-123' },
				owner: { uid: 'demo-owner-123' },
				viewer: { uid: 'demo-viewer-123' }
			}
		};

		// Mock expired sessions query
		const mockSessionsSnapshot = {
			empty: false,
			size: 1,
			docs: [
				{
					data: () => expiredSession,
					ref: {
						update: vi.fn().mockResolvedValue(undefined)
					}
				}
			]
		};

		// Mock memorials query
		const mockMemorialsSnapshot = {
			size: 2,
			docs: [
				{
					id: 'memorial-1',
					ref: {
						delete: vi.fn().mockResolvedValue(undefined)
					}
				},
				{
					id: 'memorial-2',
					ref: {
						delete: vi.fn().mockResolvedValue(undefined)
					}
				}
			]
		};

		// Mock streams query
		const mockStreamsSnapshot = {
			docs: [
				{
					id: 'stream-1',
					ref: {
						delete: vi.fn().mockResolvedValue(undefined)
					}
				}
			]
		};

		// Mock slideshows query
		const mockSlideshowsSnapshot = {
			docs: [
				{
					id: 'slideshow-1',
					data: () => ({
						firebaseStoragePath: 'slideshows/demo/video.webm',
						photos: [
							{ storagePath: 'slideshows/demo/photo1.jpg' },
							{ storagePath: 'slideshows/demo/photo2.jpg' }
						]
					}),
					ref: {
						delete: vi.fn().mockResolvedValue(undefined)
					}
				}
			]
		};

		// Setup mock chain
		const mockWhere = vi.fn();
		mockWhere.mockReturnValueOnce({
			get: vi.fn().mockResolvedValue(mockSessionsSnapshot)
		});
		mockWhere.mockReturnValueOnce({
			get: vi.fn().mockResolvedValue(mockMemorialsSnapshot)
		});

		const mockCollection = vi.fn();
		mockCollection.mockReturnValueOnce({
			where: mockWhere
		});

		// Mock memorial subcollections
		const mockMemorialDoc = vi.fn();
		mockMemorialDoc.mockReturnValue({
			collection: vi.fn((name) => {
				if (name === 'streams') {
					return {
						where: vi.fn(() => ({
							get: vi.fn().mockResolvedValue(mockStreamsSnapshot)
						}))
					};
				}
				if (name === 'slideshows') {
					return {
						where: vi.fn(() => ({
							get: vi.fn().mockResolvedValue(mockSlideshowsSnapshot)
						}))
					};
				}
			})
		});

		mockCollection.mockReturnValue({
			doc: mockMemorialDoc
		});

		vi.mocked(adminDb.collection).mockImplementation(mockCollection as any);

		// Mock user deletion
		const mockUserDocDelete = vi.fn().mockResolvedValue(undefined);
		vi.mocked(adminAuth.deleteUser).mockResolvedValue();

		// Mock storage deletion
		const mockStorageDelete = vi.fn().mockResolvedValue(undefined);
		vi.mocked(adminStorage.bucket).mockReturnValue({
			file: vi.fn(() => ({
				delete: mockStorageDelete
			}))
		} as any);

		const { GET } = await import('../../src/routes/api/demo/cleanup/+server');
		await GET(mockRequest as RequestEvent);

		// Verify cleanup completed
		expect(json).toHaveBeenCalledWith(
			expect.objectContaining({
				sessionsProcessed: 1,
				memorialsDeleted: 2,
				streamsDeleted: 1,
				slideshowsDeleted: 1,
				usersDeleted: 4,
				errors: []
			})
		);

		// Verify Firebase Auth users were deleted
		expect(adminAuth.deleteUser).toHaveBeenCalledTimes(4);

		// Verify storage cleanup (1 video + 2 photos)
		expect(mockStorageDelete).toHaveBeenCalledTimes(3);
	});

	it('should skip cleanup when no expired sessions', async () => {
		const mockEmptySnapshot = {
			empty: true,
			size: 0,
			docs: []
		};

		vi.mocked(adminDb.collection).mockReturnValue({
			where: vi.fn(() => ({
				get: vi.fn().mockResolvedValue(mockEmptySnapshot)
			}))
		} as any);

		const { GET } = await import('../../src/routes/api/demo/cleanup/+server');
		await GET(mockRequest as RequestEvent);

		expect(json).toHaveBeenCalledWith(
			expect.objectContaining({
				sessionsProcessed: 0,
				memorialsDeleted: 0,
				streamsDeleted: 0,
				slideshowsDeleted: 0,
				usersDeleted: 0
			})
		);
	});

	it('should require admin access or valid cron secret', async () => {
		mockRequest.locals!.user!.role = 'owner';
		mockRequest.locals!.user!.isAdmin = false;

		const { GET } = await import('../../src/routes/api/demo/cleanup/+server');

		await expect(GET(mockRequest as RequestEvent)).rejects.toThrow();
		expect(error).toHaveBeenCalledWith(
			403,
			'Unauthorized. Admin access or valid cron secret required.'
		);
	});

	it('should allow cleanup with valid cron secret', async () => {
		mockRequest.locals!.user = null;
		mockRequest.url!.searchParams.get = vi.fn((param) => {
			if (param === 'secret') return 'valid-secret';
			return null;
		});

		// Set environment variable
		process.env.DEMO_CLEANUP_SECRET = 'valid-secret';

		const mockEmptySnapshot = {
			empty: true,
			size: 0,
			docs: []
		};

		vi.mocked(adminDb.collection).mockReturnValue({
			where: vi.fn(() => ({
				get: vi.fn().mockResolvedValue(mockEmptySnapshot)
			}))
		} as any);

		const { GET } = await import('../../src/routes/api/demo/cleanup/+server');
		await GET(mockRequest as RequestEvent);

		expect(json).toHaveBeenCalled();
	});

	it('should track errors during cleanup', async () => {
		const expiredSession = {
			id: 'demo_123_abc',
			status: 'active',
			users: {
				admin: { uid: 'demo-admin-123' }
			}
		};

		const mockSessionsSnapshot = {
			empty: false,
			size: 1,
			docs: [
				{
					data: () => expiredSession,
					ref: {
						update: vi.fn().mockResolvedValue(undefined)
					}
				}
			]
		};

		const mockMemorialsSnapshot = {
			size: 1,
			docs: [
				{
					id: 'memorial-1',
					ref: {
						delete: vi.fn().mockRejectedValue(new Error('Delete failed'))
					}
				}
			]
		};

		vi.mocked(adminDb.collection).mockImplementation((name) => {
			if (name === 'demoSessions') {
				return {
					where: vi.fn(() => ({
						get: vi.fn().mockResolvedValue(mockSessionsSnapshot)
					}))
				} as any;
			}
			if (name === 'memorials') {
				return {
					where: vi.fn(() => ({
						get: vi.fn().mockResolvedValue(mockMemorialsSnapshot)
					})),
					doc: vi.fn(() => ({
						collection: vi.fn(() => ({
							where: vi.fn(() => ({
								get: vi.fn().mockResolvedValue({ docs: [] })
							}))
						}))
					}))
				} as any;
			}
			return {
				doc: vi.fn(() => ({
					delete: vi.fn()
				}))
			} as any;
		});

		vi.mocked(adminAuth.deleteUser).mockResolvedValue();

		const { GET } = await import('../../src/routes/api/demo/cleanup/+server');
		await GET(mockRequest as RequestEvent);

		const response = (json as any).mock.calls[0][0];
		expect(response.errors.length).toBeGreaterThan(0);
		expect(response.errors[0]).toContain('Failed to delete memorial');
	});

	it('should manually trigger cleanup for specific session (POST)', async () => {
		mockRequest.request = {
			json: vi.fn().mockResolvedValue({
				sessionId: 'demo_123_abc'
			})
		} as any;

		const mockUpdate = vi.fn().mockResolvedValue(undefined);
		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn(() => ({
				update: mockUpdate
			}))
		} as any);

		const { POST } = await import('../../src/routes/api/demo/cleanup/+server');
		await POST(mockRequest as RequestEvent);

		expect(mockUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				status: 'ended'
			})
		);

		expect(json).toHaveBeenCalledWith(
			expect.objectContaining({
				success: true
			})
		);
	});

	it('should reject manual cleanup for non-admin users', async () => {
		mockRequest.locals!.user!.role = 'owner';
		mockRequest.request = {
			json: vi.fn().mockResolvedValue({ sessionId: 'demo_123' })
		} as any;

		const { POST } = await import('../../src/routes/api/demo/cleanup/+server');

		await expect(POST(mockRequest as RequestEvent)).rejects.toThrow();
		expect(error).toHaveBeenCalledWith(403, 'Admin access required');
	});

	it('should calculate cleanup duration', async () => {
		const mockEmptySnapshot = {
			empty: true,
			size: 0,
			docs: []
		};

		vi.mocked(adminDb.collection).mockReturnValue({
			where: vi.fn(() => ({
				get: vi.fn().mockResolvedValue(mockEmptySnapshot)
			}))
		} as any);

		const { GET } = await import('../../src/routes/api/demo/cleanup/+server');
		await GET(mockRequest as RequestEvent);

		const response = (json as any).mock.calls[0][0];
		expect(response.duration).toBeGreaterThan(0);
		expect(typeof response.duration).toBe('number');
	});
});
