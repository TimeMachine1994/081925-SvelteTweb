import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminAuth, adminDb } from '$lib/server/firebase';
import { actions } from '../src/routes/register/+page.server';

// Mock Firebase Admin
vi.mock('$lib/server/firebase', () => ({
	adminAuth: {
		createUser: vi.fn(),
		setCustomUserClaims: vi.fn(),
		createCustomToken: vi.fn()
	},
	adminDb: {
		collection: vi.fn(() => ({
			doc: vi.fn(() => ({
				set: vi.fn()
			}))
		}))
	}
}));

// Mock SvelteKit functions
vi.mock('@sveltejs/kit', () => ({
	fail: vi.fn((status, data) => ({ type: 'failure', status, data })),
	redirect: vi.fn(),
	isRedirect: vi.fn(() => false)
}));

describe('Owner Registration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should register an owner successfully', async () => {
		// Mock successful Firebase operations
		const mockUserRecord = {
			uid: 'test-owner-uid',
			email: 'owner@test.com'
		};

		vi.mocked(adminAuth.createUser).mockResolvedValue(mockUserRecord as any);
		vi.mocked(adminAuth.setCustomUserClaims).mockResolvedValue();
		vi.mocked(adminAuth.createCustomToken).mockResolvedValue('mock-custom-token');

		const mockSet = vi.fn().mockResolvedValue();
		vi.mocked(adminDb.collection).mockReturnValue({
			doc: vi.fn().mockReturnValue({
				set: mockSet
			})
		} as any);

		// Create mock request
		const formData = new FormData();
		formData.append('name', 'John Doe');
		formData.append('email', 'owner@test.com');
		formData.append('password', 'password123');

		const mockRequest = {
			formData: () => Promise.resolve(formData)
		};

		// Test the registerOwner action
		const result = await actions.registerOwner({ request: mockRequest } as any);

		// Verify Firebase operations
		expect(adminAuth.createUser).toHaveBeenCalledWith({
			email: 'owner@test.com',
			password: 'password123',
			displayName: 'John Doe'
		});

		expect(adminAuth.setCustomUserClaims).toHaveBeenCalledWith('test-owner-uid', {
			role: 'owner',
			isOwner: true
		});

		expect(mockSet).toHaveBeenCalledWith({
			email: 'owner@test.com',
			displayName: 'John Doe',
			role: 'owner',
			isOwner: true,
			hasPaidForMemorial: false,
			memorialCount: 0,
			createdAt: expect.any(String),
			updatedAt: expect.any(String)
		});

		expect(adminAuth.createCustomToken).toHaveBeenCalledWith('test-owner-uid');

		// Verify successful result
		expect(result).toEqual({
			success: true,
			customToken: 'mock-custom-token'
		});
	});

	it('should fail when required fields are missing', async () => {
		const { fail } = await import('@sveltejs/kit');

		const formData = new FormData();
		formData.append('name', '');
		formData.append('email', 'owner@test.com');
		formData.append('password', '');

		const mockRequest = {
			formData: () => Promise.resolve(formData)
		};

		const result = await actions.registerOwner({ request: mockRequest } as any);

		expect(fail).toHaveBeenCalledWith(400, {
			message: 'Name, email and password are required'
		});
	});

	it('should handle Firebase errors gracefully', async () => {
		const { fail } = await import('@sveltejs/kit');

		vi.mocked(adminAuth.createUser).mockRejectedValue(new Error('Firebase error'));

		const formData = new FormData();
		formData.append('name', 'John Doe');
		formData.append('email', 'owner@test.com');
		formData.append('password', 'password123');

		const mockRequest = {
			formData: () => Promise.resolve(formData)
		};

		const result = await actions.registerOwner({ request: mockRequest } as any);

		expect(fail).toHaveBeenCalledWith(400, {
			message: 'Firebase error'
		});
	});
});
