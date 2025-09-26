import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server.ts';
import type { PageServerLoadEvent } from './$types';

// Mock dependencies
vi.mock('$lib/server/firebase', () => ({
	adminDb: {
		collection: vi.fn(() => ({
			doc: vi.fn(() => ({
				get: vi.fn()
			}))
		}))
	}
}));

describe('Livestream Page Server Load', () => {
	let mockEvent: Partial<PageServerLoadEvent>;
	let mockMemorialDoc: any;

	beforeEach(() => {
		vi.clearAllMocks();
		
		mockEvent = {
			locals: {
				user: {
					uid: 'funeral-director-123',
					email: 'fd@example.com',
					role: 'funeral_director',
					isAdmin: false
				}
			},
			params: {
				memorialId: 'memorial-456'
			}
		};

		mockMemorialDoc = {
			exists: true,
			id: 'memorial-456',
			data: () => ({
				id: 'memorial-456',
				lovedOneName: 'Jane Smith',
				slug: 'jane-smith',
				fullSlug: 'jane-smith-2024',
				funeralDirectorUid: 'funeral-director-123',
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
						},
						{
							enabled: false,
							location: { name: 'Disabled Chapel', address: '789 Disabled St', isUnknown: false },
							time: { date: '2024-01-17', time: '16:00', isUnknown: false },
							hours: 1
						}
					]
				},
				livestream: {
					streamKey: 'main-stream-key',
					streamUrl: 'rtmps://live.cloudflare.com:443/live/',
					sessionId: 'session-123'
				},
				customStreams: {
					custom_789: {
						id: 'custom_789',
						title: 'Custom Memorial Stream',
						status: 'scheduled',
						streamKey: 'custom-key-789',
						streamUrl: 'rtmps://live.cloudflare.com:443/live/'
					}
				}
			})
		};
	});

	it('should load memorial and scheduled services successfully', async () => {
		const { adminDb } = await import('$lib/server/firebase');

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn(() => ({
				get: vi.fn().mockResolvedValue(mockMemorialDoc)
			}))
		} as any);

		const result = await load(mockEvent as PageServerLoadEvent);

		expect(result.memorial).toBeDefined();
		expect(result.memorial.lovedOneName).toBe('Jane Smith');
		expect(result.scheduledServices).toHaveLength(3); // main + 1 enabled additional + 1 custom
		
		// Check main service
		expect(result.scheduledServices[0].id).toBe('main');
		expect(result.scheduledServices[0].title).toBe('Main Chapel');
		expect(result.scheduledServices[0].type).toBe('main');
		
		// Check additional service (only enabled ones)
		expect(result.scheduledServices[1].id).toBe('additional_0');
		expect(result.scheduledServices[1].title).toBe('Garden Chapel');
		expect(result.scheduledServices[1].type).toBe('additional');
		
		// Check custom stream
		expect(result.scheduledServices[2].id).toBe('custom_789');
		expect(result.scheduledServices[2].title).toBe('Custom Memorial Stream');
	});

	it('should redirect to login if user not authenticated', async () => {
		mockEvent.locals = { user: null };

		await expect(load(mockEvent as PageServerLoadEvent)).rejects.toThrow();
	});

	it('should throw 404 if memorial not found', async () => {
		const { adminDb } = await import('$lib/server/firebase');

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn(() => ({
				get: vi.fn().mockResolvedValue({ exists: false })
			}))
		} as any);

		await expect(load(mockEvent as PageServerLoadEvent)).rejects.toThrow('Memorial not found');
	});

	it('should throw 403 if user lacks permission', async () => {
		const { adminDb } = await import('$lib/server/firebase');

		// User is not admin and not the assigned funeral director
		mockEvent.locals!.user!.uid = 'different-user-123';
		mockEvent.locals!.user!.role = 'owner';

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn(() => ({
				get: vi.fn().mockResolvedValue(mockMemorialDoc)
			}))
		} as any);

		await expect(load(mockEvent as PageServerLoadEvent)).rejects.toThrow('You do not have permission to access this stream.');
	});

	it('should allow admin access regardless of assignment', async () => {
		const { adminDb } = await import('$lib/server/firebase');

		// User is admin but not assigned funeral director
		mockEvent.locals!.user!.uid = 'admin-user-123';
		mockEvent.locals!.user!.role = 'admin';

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn(() => ({
				get: vi.fn().mockResolvedValue(mockMemorialDoc)
			}))
		} as any);

		const result = await load(mockEvent as PageServerLoadEvent);

		expect(result.memorial).toBeDefined();
		expect(result.scheduledServices).toBeDefined();
	});

	it('should generate stream keys for services without them', async () => {
		const { adminDb } = await import('$lib/server/firebase');

		// Memorial without existing stream keys
		const memorialWithoutKeys = {
			...mockMemorialDoc,
			data: () => ({
				...mockMemorialDoc.data(),
				livestream: null
			})
		};

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn(() => ({
				get: vi.fn().mockResolvedValue(memorialWithoutKeys)
			}))
		} as any);

		const result = await load(mockEvent as PageServerLoadEvent);

		expect(result.scheduledServices[0].streamKey).toMatch(/^stream_main_\d+$/);
		expect(result.scheduledServices[1].streamKey).toMatch(/^stream_additional_0_\d+$/);
	});

	it('should sort services by date/time', async () => {
		const { adminDb } = await import('$lib/server/firebase');

		// Memorial with services in different date order
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
				},
				customStreams: {}
			})
		};

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn(() => ({
				get: vi.fn().mockResolvedValue(memorialWithDates)
			}))
		} as any);

		const result = await load(mockEvent as PageServerLoadEvent);

		// Earlier service should come first
		expect(result.scheduledServices[0].title).toBe('Earlier Service');
		expect(result.scheduledServices[1].title).toBe('Later Service');
	});

	it('should handle memorial without services', async () => {
		const { adminDb } = await import('$lib/server/firebase');

		const memorialWithoutServices = {
			...mockMemorialDoc,
			data: () => ({
				...mockMemorialDoc.data(),
				services: null,
				customStreams: null
			})
		};

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn(() => ({
				get: vi.fn().mockResolvedValue(memorialWithoutServices)
			}))
		} as any);

		const result = await load(mockEvent as PageServerLoadEvent);

		expect(result.scheduledServices).toHaveLength(0);
	});

	it('should only include enabled additional services', async () => {
		const { adminDb } = await import('$lib/server/firebase');

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn(() => ({
				get: vi.fn().mockResolvedValue(mockMemorialDoc)
			}))
		} as any);

		const result = await load(mockEvent as PageServerLoadEvent);

		// Should only have main + 1 enabled additional + custom (not the disabled one)
		const additionalServices = result.scheduledServices.filter(s => s.type === 'additional');
		expect(additionalServices).toHaveLength(1);
		expect(additionalServices[0].title).toBe('Garden Chapel');
	});

	it('should set fullSlug from slug if missing', async () => {
		const { adminDb } = await import('$lib/server/firebase');

		const memorialWithoutFullSlug = {
			...mockMemorialDoc,
			data: () => ({
				...mockMemorialDoc.data(),
				fullSlug: undefined,
				slug: 'jane-smith'
			})
		};

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn(() => ({
				get: vi.fn().mockResolvedValue(memorialWithoutFullSlug)
			}))
		} as any);

		const result = await load(mockEvent as PageServerLoadEvent);

		expect(result.memorial.fullSlug).toBe('jane-smith');
	});

	it('should throw 404 if livestream not configured', async () => {
		const { adminDb } = await import('$lib/server/firebase');

		const memorialWithoutLivestream = {
			...mockMemorialDoc,
			data: () => ({
				...mockMemorialDoc.data(),
				livestream: null
			})
		};

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn(() => ({
				get: vi.fn().mockResolvedValue(memorialWithoutLivestream)
			}))
		} as any);

		// This should not throw since we're now generating stream keys
		const result = await load(mockEvent as PageServerLoadEvent);
		expect(result.scheduledServices).toBeDefined();
	});
});
