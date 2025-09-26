import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './+server.ts';
import type { RequestEvent } from '@sveltejs/kit';

// Mock dependencies
vi.mock('$lib/server/firebase', () => ({
	adminDb: {
		collection: vi.fn(() => ({
			doc: vi.fn(() => ({
				get: vi.fn(),
				update: vi.fn()
			}))
		}))
	}
}));

vi.mock('$lib/server/memorialMiddleware', () => ({
	requireViewAccess: vi.fn(),
	requireEditAccess: vi.fn()
}));

describe('Scheduled Services API', () => {
	let mockRequestEvent: Partial<RequestEvent>;
	let mockMemorialDoc: any;

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
				memorialId: 'memorial-123'
			}
		};

		mockMemorialDoc = {
			exists: true,
			id: 'memorial-123',
			data: () => ({
				id: 'memorial-123',
				lovedOneName: 'John Doe',
				services: {
					main: {
						location: { name: 'Main Chapel', address: '123 Main St', isUnknown: false },
						time: { date: '2024-01-15', time: '10:00', isUnknown: false },
						hours: 2
					},
					additional: [
						{
							enabled: true,
							location: { name: 'Garden Chapel', address: '456 Garden Ave', isUnknown: false },
							time: { date: '2024-01-16', time: '14:00', isUnknown: false },
							hours: 1.5
						}
					]
				},
				customStreams: {
					custom_123: {
						id: 'custom_123',
						title: 'Custom Stream',
						status: 'scheduled',
						streamKey: 'custom-key-123'
					}
				}
			})
		};
	});

	describe('GET /api/memorials/[memorialId]/scheduled-services', () => {
		it('should return scheduled services from memorial data', async () => {
			const { adminDb } = await import('$lib/server/firebase');
			const { requireViewAccess } = await import('$lib/server/memorialMiddleware');

			// Setup mocks
			vi.mocked(requireViewAccess).mockResolvedValue({
				hasAccess: true,
				accessLevel: 'view'
			});
			
			vi.mocked(adminDb.collection).mockReturnValue({
				doc: vi.fn(() => ({
					get: vi.fn().mockResolvedValue(mockMemorialDoc)
				}))
			} as any);

			const response = await GET(mockRequestEvent as RequestEvent);
			const result = await response.json();

			expect(result.success).toBe(true);
			expect(result.services).toHaveLength(3); // main + additional + custom
			expect(result.services[0].title).toBe('Main Chapel');
			expect(result.services[1].title).toBe('Garden Chapel');
			expect(result.services[2].title).toBe('Custom Stream');
		});

		it('should require authentication', async () => {
			mockRequestEvent.locals = { user: null };

			await expect(GET(mockRequestEvent as RequestEvent)).rejects.toThrow('Authentication required');
		});

		it('should verify memorial access', async () => {
			const { requireViewAccess } = await import('$lib/server/memorialMiddleware');
			vi.mocked(requireViewAccess).mockRejectedValue(new Error('Access denied'));

			await expect(GET(mockRequestEvent as RequestEvent)).rejects.toThrow('Access denied');
		});

		it('should handle memorial not found', async () => {
			const { adminDb } = await import('$lib/server/firebase');
			const { requireViewAccess } = await import('$lib/server/memorialMiddleware');

			vi.mocked(requireViewAccess).mockResolvedValue({
				hasAccess: true,
				accessLevel: 'view'
			});

			vi.mocked(adminDb.collection).mockReturnValue({
				doc: vi.fn(() => ({
					get: vi.fn().mockResolvedValue({ exists: false })
				}))
			} as any);

			await expect(GET(mockRequestEvent as RequestEvent)).rejects.toThrow('Memorial not found');
		});

		it('should sort services by date', async () => {
			const { adminDb } = await import('$lib/server/firebase');
			const { requireViewAccess } = await import('$lib/server/memorialMiddleware');

			// Setup memorial with services in different order
			const memorialWithDates = {
				...mockMemorialDoc,
				data: () => ({
					...mockMemorialDoc.data(),
					services: {
						main: {
							location: { name: 'Later Service', address: '123 Main St', isUnknown: false },
							time: { date: '2024-01-20', time: '10:00', isUnknown: false },
							hours: 2
						},
						additional: [
							{
								enabled: true,
								location: { name: 'Earlier Service', address: '456 Garden Ave', isUnknown: false },
								time: { date: '2024-01-10', time: '14:00', isUnknown: false },
								hours: 1.5
							}
						]
					}
				})
			};

			vi.mocked(requireViewAccess).mockResolvedValue({
				hasAccess: true,
				accessLevel: 'view'
			});

			vi.mocked(adminDb.collection).mockReturnValue({
				doc: vi.fn(() => ({
					get: vi.fn().mockResolvedValue(memorialWithDates)
				}))
			} as any);

			const response = await GET(mockRequestEvent as RequestEvent);
			const result = await response.json();

			expect(result.services[0].title).toBe('Earlier Service'); // Should be first due to earlier date
			expect(result.services[1].title).toBe('Later Service');
		});
	});

	describe('POST /api/memorials/[memorialId]/scheduled-services', () => {
		beforeEach(() => {
			mockRequestEvent.request = {
				json: vi.fn().mockResolvedValue({
					title: 'New Custom Stream',
					scheduleType: 'scheduled',
					scheduledTime: '2024-01-25T15:00'
				})
			} as any;
		});

		it('should create a new scheduled service', async () => {
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

			const response = await POST(mockRequestEvent as RequestEvent);
			const result = await response.json();

			expect(result.success).toBe(true);
			expect(result.service).toBeDefined();
			expect(result.service.title).toBe('New Custom Stream');
			expect(result.service.status).toBe('scheduled');
			expect(mockUpdate).toHaveBeenCalled();
		});

		it('should create live stream for "now" schedule type', async () => {
			const { adminDb } = await import('$lib/server/firebase');
			const { requireEditAccess } = await import('$lib/server/memorialMiddleware');

			mockRequestEvent.request = {
				json: vi.fn().mockResolvedValue({
					title: 'Live Now Stream',
					scheduleType: 'now'
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

			const response = await POST(mockRequestEvent as RequestEvent);
			const result = await response.json();

			expect(result.success).toBe(true);
			expect(result.service.status).toBe('live');
			expect(result.service.time.isUnknown).toBe(true);
		});

		it('should require authentication', async () => {
			mockRequestEvent.locals = undefined;

			await expect(POST(mockRequestEvent as RequestEvent)).rejects.toThrow('Authentication required');
		});

		it('should require edit access', async () => {
			const { requireEditAccess } = await import('$lib/server/memorialMiddleware');
			vi.mocked(requireEditAccess).mockRejectedValue(new Error('Access denied'));

			await expect(POST(mockRequestEvent as RequestEvent)).rejects.toThrow('Access denied');
		});

		it('should require stream title', async () => {
			const { requireEditAccess } = await import('$lib/server/memorialMiddleware');

			mockRequestEvent.request = {
				json: vi.fn().mockResolvedValue({
					title: '',
					scheduleType: 'now'
				})
			} as any;

			vi.mocked(requireEditAccess).mockResolvedValue({
				hasAccess: true,
				accessLevel: 'edit'
			});

			await expect(POST(mockRequestEvent as RequestEvent)).rejects.toThrow('Stream title is required');
		});

		it('should generate unique stream credentials', async () => {
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

			const response = await POST(mockRequestEvent as RequestEvent);
			const result = await response.json();

			expect(result.service.streamKey).toMatch(/^stream_custom_\d+$/);
			expect(result.service.streamUrl).toBe('rtmps://live.cloudflare.com:443/live/');
		});
	});
});
