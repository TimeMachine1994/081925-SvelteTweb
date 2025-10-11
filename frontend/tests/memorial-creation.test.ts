import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminDb } from '$lib/server/firebase';
import { actions } from '../src/routes/profile/+page.server';

// Mock Firebase Admin
vi.mock('$lib/server/firebase', () => ({
	adminDb: {
		collection: vi.fn(() => ({
			doc: vi.fn(() => ({
				get: vi.fn(),
				set: vi.fn()
			})),
			add: vi.fn()
		}))
	}
}));

// Mock SvelteKit functions
vi.mock('@sveltejs/kit', () => ({
	fail: vi.fn((status, data) => ({ type: 'failure', status, data }))
}));

describe('Memorial Creation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should create memorial for owner successfully', async () => {
		// Mock user data (no existing memorials, no payment)
		const mockUserData = {
			memorialCount: 0,
			hasPaidForMemorial: false
		};

		const mockGet = vi.fn().mockResolvedValue({
			data: () => mockUserData
		});

		const mockSet = vi.fn().mockResolvedValue();
		const mockAdd = vi.fn().mockResolvedValue({ id: 'new-memorial-id' });

		vi.mocked(adminDb.collection).mockImplementation((collectionName) => {
			if (collectionName === 'users') {
				return {
					doc: vi.fn().mockReturnValue({
						get: mockGet,
						set: mockSet
					})
				} as any;
			} else if (collectionName === 'memorials') {
				return {
					add: mockAdd
				} as any;
			}
			return {} as any;
		});

		// Create mock request
		const formData = new FormData();
		formData.append('lovedOneName', 'John Smith');

		const mockRequest = {
			formData: () => Promise.resolve(formData)
		};

		const mockLocals = {
			user: {
				uid: 'owner-uid',
				email: 'owner@test.com',
				role: 'owner'
			}
		};

		// Test the createMemorial action
		const result = await actions.createMemorial({
			request: mockRequest,
			locals: mockLocals
		} as any);

		// Verify memorial creation
		expect(mockAdd).toHaveBeenCalledWith({
			lovedOneName: 'John Smith',
			slug: 'celebration-of-life-for-john-smith',
			fullSlug: 'celebration-of-life-for-john-smith',
			ownerUid: 'owner-uid',
			ownerEmail: 'owner@test.com',
			services: {
				main: {
					location: { name: '', address: '', isUnknown: true },
					time: { date: null, time: null, isUnknown: true },
					hours: 2
				},
				additional: []
			},
			isPublic: false,
			content: '',
			custom_html: null,
			isPaid: false,
			createdAt: expect.any(Date),
			updatedAt: expect.any(Date)
		});

		// Verify user memorial count update
		expect(mockSet).toHaveBeenCalledWith(
			{
				memorialCount: 1,
				updatedAt: expect.any(String)
			},
			{ merge: true }
		);

		// Verify successful result
		expect(result).toEqual({
			success: true,
			memorialId: 'new-memorial-id',
			message: 'Memorial created successfully! Please complete setup and payment.'
		});
	});

	it('should prevent memorial creation if user has unpaid memorial', async () => {
		const { fail } = await import('@sveltejs/kit');

		// Mock user data (has existing memorial, no payment)
		const mockUserData = {
			memorialCount: 1,
			hasPaidForMemorial: false
		};

		const mockGet = vi.fn().mockResolvedValue({
			data: () => mockUserData
		});

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn().mockReturnValue({
				get: mockGet
			})
		} as any);

		const formData = new FormData();
		formData.append('lovedOneName', 'Jane Smith');

		const mockRequest = {
			formData: () => Promise.resolve(formData)
		};

		const mockLocals = {
			user: {
				uid: 'owner-uid',
				email: 'owner@test.com',
				role: 'owner'
			}
		};

		const result = await actions.createMemorial({
			request: mockRequest,
			locals: mockLocals
		} as any);

		expect(fail).toHaveBeenCalledWith(400, {
			message: 'You must complete payment for your existing memorial before creating a new one.'
		});
	});

	it('should reject non-owner users', async () => {
		const { fail } = await import('@sveltejs/kit');

		const formData = new FormData();
		formData.append('lovedOneName', 'Test Name');

		const mockRequest = {
			formData: () => Promise.resolve(formData)
		};

		const mockLocals = {
			user: {
				uid: 'viewer-uid',
				email: 'viewer@test.com',
				role: 'viewer'
			}
		};

		const result = await actions.createMemorial({
			request: mockRequest,
			locals: mockLocals
		} as any);

		expect(fail).toHaveBeenCalledWith(401, {
			message: 'Only owners can create memorials'
		});
	});

	it('should require loved one name', async () => {
		const { fail } = await import('@sveltejs/kit');

		const formData = new FormData();
		formData.append('lovedOneName', '');

		const mockRequest = {
			formData: () => Promise.resolve(formData)
		};

		const mockLocals = {
			user: {
				uid: 'owner-uid',
				email: 'owner@test.com',
				role: 'owner'
			}
		};

		// Mock user data check
		const mockGet = vi.fn().mockResolvedValue({
			data: () => ({ memorialCount: 0, hasPaidForMemorial: false })
		});

		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn().mockReturnValue({
				get: mockGet
			})
		} as any);

		const result = await actions.createMemorial({
			request: mockRequest,
			locals: mockLocals
		} as any);

		expect(fail).toHaveBeenCalledWith(400, {
			message: "Loved one's name is required"
		});
	});
});
