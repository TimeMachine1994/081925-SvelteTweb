import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT, DELETE } from './+server.ts';
import type { RequestEvent } from '@sveltejs/kit';

// Mock dependencies
vi.mock('$lib/server/firebase', () => ({
	adminDb: {
		collection: vi.fn(() => ({
			doc: vi.fn(() => ({
				update: vi.fn()
			}))
		}))
	}
}));

vi.mock('$lib/server/memorialMiddleware', () => ({
	requireEditAccess: vi.fn()
}));

vi.mock('firebase-admin/firestore', () => ({
	FieldValue: {
		delete: vi.fn(() => 'FIELD_DELETE_SENTINEL')
	}
}));

describe('Service Management API', () => {
	let mockRequestEvent: Partial<RequestEvent>;

	beforeEach(() => {
		vi.clearAllMocks();
		
		mockRequestEvent = {
			locals: {
				user: {
					uid: 'test-user-123',
					email: 'test@example.com',
					role: 'funeral_director',
					isAdmin: false
				}
			},
			params: {
				memorialId: 'memorial-123',
				serviceId: 'service-456'
			}
		};
	});

	describe('PUT /api/memorials/[memorialId]/scheduled-services/[serviceId]', () => {
		beforeEach(() => {
			mockRequestEvent.request = {
				json: vi.fn().mockResolvedValue({
					status: 'live',
					sessionId: 'session-789'
				})
			} as any;
		});

		it('should update service status', async () => {
			const { adminDb } = await import('$lib/server/firebase');
			const { requireEditAccess } = await import('$lib/server/memorialMiddleware');

			vi.mocked(requireEditAccess).mockResolvedValue({
				hasAccess: true,
				accessLevel: 'edit'
			});

			const mockUpdate = vi.fn().mockResolvedValue(undefined);
			vi.mocked(adminDb.collection).mockReturnValue({
				doc: vi.fn(() => ({
					update: mockUpdate
				}))
			} as any);

			const response = await PUT(mockRequestEvent as RequestEvent);
			const result = await response.json();

			expect(result.success).toBe(true);
			expect(result.message).toBe('Service updated successfully');
			expect(mockUpdate).toHaveBeenCalledWith({
				'customStreams.service-456.status': 'live',
				'customStreams.service-456.sessionId': 'session-789',
				updatedAt: expect.any(Date)
			});
		});

		it('should update only status if sessionId not provided', async () => {
			const { adminDb } = await import('$lib/server/firebase');
			const { requireEditAccess } = await import('$lib/server/memorialMiddleware');

			mockRequestEvent.request = {
				json: vi.fn().mockResolvedValue({
					status: 'completed'
				})
			} as any;

			vi.mocked(requireEditAccess).mockResolvedValue({
				hasAccess: true,
				accessLevel: 'edit'
			});

			const mockUpdate = vi.fn().mockResolvedValue(undefined);
			vi.mocked(adminDb.collection).mockReturnValue({
				doc: vi.fn(() => ({
					update: mockUpdate
				}))
			} as any);

			const response = await PUT(mockRequestEvent as RequestEvent);
			const result = await response.json();

			expect(result.success).toBe(true);
			expect(mockUpdate).toHaveBeenCalledWith({
				'customStreams.service-456.status': 'completed',
				updatedAt: expect.any(Date)
			});
		});

		it('should require authentication', async () => {
			mockRequestEvent.locals = undefined;

			await expect(PUT(mockRequestEvent as RequestEvent)).rejects.toThrow('Authentication required');
		});

		it('should require edit access', async () => {
			const { requireEditAccess } = await import('$lib/server/memorialMiddleware');
			vi.mocked(requireEditAccess).mockRejectedValue(new Error('Access denied'));

			await expect(PUT(mockRequestEvent as RequestEvent)).rejects.toThrow('Access denied');
		});

		it('should handle database errors', async () => {
			const { adminDb } = await import('$lib/server/firebase');
			const { requireEditAccess } = await import('$lib/server/memorialMiddleware');

			vi.mocked(requireEditAccess).mockResolvedValue({
				hasAccess: true,
				accessLevel: 'edit'
			});

			const mockUpdate = vi.fn().mockRejectedValue(new Error('Database error'));
			vi.mocked(adminDb.collection).mockReturnValue({
				doc: vi.fn(() => ({
					update: mockUpdate
				}))
			} as any);

			await expect(PUT(mockRequestEvent as RequestEvent)).rejects.toThrow('Failed to update scheduled service');
		});
	});

	describe('DELETE /api/memorials/[memorialId]/scheduled-services/[serviceId]', () => {
		it('should delete service', async () => {
			const { adminDb } = await import('$lib/server/firebase');
			const { requireEditAccess } = await import('$lib/server/memorialMiddleware');
			const { FieldValue } = await import('firebase-admin/firestore');

			vi.mocked(requireEditAccess).mockResolvedValue({
				hasAccess: true,
				accessLevel: 'edit'
			});

			const mockUpdate = vi.fn().mockResolvedValue(undefined);
			vi.mocked(adminDb.collection).mockReturnValue({
				doc: vi.fn(() => ({
					update: mockUpdate
				}))
			} as any);

			const response = await DELETE(mockRequestEvent as RequestEvent);
			const result = await response.json();

			expect(result.success).toBe(true);
			expect(result.message).toBe('Service deleted successfully');
			expect(mockUpdate).toHaveBeenCalledWith({
				'customStreams.service-456': 'FIELD_DELETE_SENTINEL',
				updatedAt: expect.any(Date)
			});
		});

		it('should require authentication', async () => {
			mockRequestEvent.locals = undefined;

			await expect(DELETE(mockRequestEvent as RequestEvent)).rejects.toThrow('Authentication required');
		});

		it('should require edit access', async () => {
			const { requireEditAccess } = await import('$lib/server/memorialMiddleware');
			vi.mocked(requireEditAccess).mockRejectedValue(new Error('Access denied'));

			await expect(DELETE(mockRequestEvent as RequestEvent)).rejects.toThrow('Access denied');
		});

		it('should handle database errors', async () => {
			const { adminDb } = await import('$lib/server/firebase');
			const { requireEditAccess } = await import('$lib/server/memorialMiddleware');

			vi.mocked(requireEditAccess).mockResolvedValue({
				hasAccess: true,
				accessLevel: 'edit'
			});

			const mockUpdate = vi.fn().mockRejectedValue(new Error('Database error'));
			vi.mocked(adminDb.collection).mockReturnValue({
				doc: vi.fn(() => ({
					update: mockUpdate
				}))
			} as any);

			await expect(DELETE(mockRequestEvent as RequestEvent)).rejects.toThrow('Failed to delete scheduled service');
		});
	});
});
