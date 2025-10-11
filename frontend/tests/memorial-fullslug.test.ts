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
      add: vi.fn(),
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn()
        }))
      }))
    }))
  }
}));

// Mock SvelteKit functions
vi.mock('@sveltejs/kit', () => ({
  fail: vi.fn((status, data) => ({ type: 'failure', status, data }))
}));

describe('Memorial FullSlug Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate unique slug and create accessible memorial', async () => {
    // Mock user data (no existing memorials)
    const mockUserData = {
      memorialCount: 0,
      hasPaidForMemorial: false
    };

    const mockGet = vi.fn().mockResolvedValue({
      data: () => mockUserData
    });

    // Mock empty result for slug uniqueness check
    const mockSlugCheck = vi.fn().mockResolvedValue({
      empty: true
    });

    const mockSet = vi.fn().mockResolvedValue();
    const mockAdd = vi.fn().mockResolvedValue({ id: 'test-memorial-id' });

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
          add: mockAdd,
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: mockSlugCheck
            })
          })
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

    // Verify slug uniqueness check was performed
    expect(mockSlugCheck).toHaveBeenCalled();

    // Verify memorial creation with proper structure
    expect(mockAdd).toHaveBeenCalledWith({
      lovedOneName: 'John Smith',
      slug: 'celebration-of-life-for-john-smith',
      fullSlug: 'celebration-of-life-for-john-smith',
      ownerUid: 'owner-uid',
      ownerEmail: 'owner@test.com',
      title: 'Celebration of Life for John Smith',
      description: 'A celebration of life dedicated to John Smith',
      services: {
        main: {
          location: { name: '', address: '', isUnknown: true },
          time: { date: null, time: null, isUnknown: true },
          hours: 2
        },
        additional: []
      },
      isPublic: true,
      content: '<h1>Celebration of Life for John Smith</h1><p>This page is dedicated to celebrating the life and legacy of John Smith.</p>',
      custom_html: null,
      isPaid: false,
      photos: [],
      embeds: [],
      birthDate: null,
      deathDate: null,
      imageUrl: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date)
    });

    // Verify successful result with memorial URL
    expect(result).toEqual({
      success: true,
      memorialId: 'test-memorial-id',
      memorialSlug: 'celebration-of-life-for-john-smith',
      memorialUrl: '/celebration-of-life-for-john-smith',
      message: 'Celebration of Life for John Smith created successfully! You can view it at /celebration-of-life-for-john-smith'
    });
  });

  it('should handle duplicate slugs by adding counter', async () => {
    // Mock user data
    const mockUserData = {
      memorialCount: 0,
      hasPaidForMemorial: false
    };

    const mockGet = vi.fn().mockResolvedValue({
      data: () => mockUserData
    });

    // Mock slug check - first slug exists, second is unique
    const mockSlugCheck = vi.fn()
      .mockResolvedValueOnce({ empty: false }) // First slug exists
      .mockResolvedValueOnce({ empty: true });  // Second slug is unique

    const mockSet = vi.fn().mockResolvedValue();
    const mockAdd = vi.fn().mockResolvedValue({ id: 'test-memorial-id-2' });

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
          add: mockAdd,
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: mockSlugCheck
            })
          })
        } as any;
      }
      return {} as any;
    });

    const formData = new FormData();
    formData.append('lovedOneName', 'Jane Doe');

    const mockRequest = {
      formData: () => Promise.resolve(formData)
    };

    const mockLocals = {
      user: {
        uid: 'owner-uid-2',
        email: 'owner2@test.com',
        role: 'owner'
      }
    };

    const result = await actions.createMemorial({ 
      request: mockRequest, 
      locals: mockLocals 
    } as any);

    // Verify slug uniqueness check was performed twice
    expect(mockSlugCheck).toHaveBeenCalledTimes(2);

    // Verify memorial was created with unique slug
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'celebration-of-life-for-jane-doe-1',
        fullSlug: 'celebration-of-life-for-jane-doe-1'
      })
    );

    // Verify result contains unique URL
    expect(result).toEqual(
      expect.objectContaining({
        memorialSlug: 'celebration-of-life-for-jane-doe-1',
        memorialUrl: '/celebration-of-life-for-jane-doe-1'
      })
    );
  });
});
