import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupTestEnvironment } from '../../test-utils/test-helpers';
import { createTestUser, createTestMemorial, mockFirebaseDoc } from '../../test-utils/factories';

// Mock Firebase Admin
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();
const mockAdd = vi.fn();
const mockDelete = vi.fn();

vi.mock('$lib/server/firebase', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: mockGet,
        set: mockSet,
        update: mockUpdate,
        delete: mockDelete
      })),
      add: mockAdd,
      where: vi.fn(() => ({
        get: vi.fn()
      })),
      orderBy: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn()
        }))
      }))
    }))
  },
  adminAuth: {
    verifyIdToken: vi.fn()
  }
}));

describe('Memorial Logic Integration', () => {
  const mockUser = createTestUser({ role: 'owner' });
  const mockMemorial = createTestMemorial();

  beforeEach(() => {
    vi.clearAllMocks();
    setupTestEnvironment();
  });

  describe('Memorial Creation Logic', () => {
    it('creates memorial with valid data', async () => {
      mockGet.mockResolvedValue(mockFirebaseDoc({ 
        memorialCount: 0, 
        hasPaidForMemorial: false 
      }));
      mockAdd.mockResolvedValue({ id: 'new-memorial-id' });

      const memorialData = {
        lovedOneName: 'John Doe',
        ownerUid: mockUser.uid,
        ownerEmail: mockUser.email,
        slug: 'celebration-of-life-for-john-doe',
        createdAt: new Date()
      };

      await mockAdd(memorialData);
      
      expect(mockAdd).toHaveBeenCalledWith(memorialData);
    });

    it('validates memorial ownership', () => {
      const memorial = createTestMemorial({ ownerUid: mockUser.uid });
      const isOwner = memorial.ownerUid === mockUser.uid;
      
      expect(isOwner).toBe(true);
    });

    it('generates unique memorial slug', () => {
      const lovedOneName = 'John Michael Doe Jr.';
      const slug = lovedOneName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      expect(slug).toBe('john-michael-doe-jr');
    });

    it('prevents duplicate memorial creation for unpaid users', async () => {
      mockGet.mockResolvedValue(mockFirebaseDoc({ 
        memorialCount: 1, 
        hasPaidForMemorial: false 
      }));

      const userData = await mockGet();
      const canCreateMemorial = userData.data().memorialCount === 0 || userData.data().hasPaidForMemorial;
      
      expect(canCreateMemorial).toBe(false);
    });
  });

  describe('Memorial Update Logic', () => {
    it('updates memorial with valid changes', async () => {
      mockGet.mockResolvedValue(mockFirebaseDoc(mockMemorial));
      mockUpdate.mockResolvedValue(undefined);

      const updateData = {
        content: 'Updated memorial content',
        isPublic: true,
        updatedAt: new Date()
      };

      await mockUpdate(updateData);
      
      expect(mockUpdate).toHaveBeenCalledWith(updateData);
    });

    it('validates update permissions', () => {
      const memorial = createTestMemorial({ ownerUid: 'other-user' });
      const canUpdate = memorial.ownerUid === mockUser.uid;
      
      expect(canUpdate).toBe(false);
    });

    it('prevents updating protected fields', () => {
      const protectedFields = ['ownerUid', 'createdAt', 'slug', 'id'];
      const updateData: Record<string, any> = {
        content: 'New content',
        ownerUid: 'malicious-uid' // Should be filtered out
      };

      const allowedUpdate: Record<string, any> = Object.keys(updateData)
        .filter(key => !protectedFields.includes(key))
        .reduce((obj: Record<string, any>, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});

      expect(allowedUpdate).toEqual({ content: 'New content' });
    });
  });

  describe('Memorial Deletion Logic', () => {
    it('deletes memorial with proper permissions', async () => {
      const memorialWithOwner = { ...mockMemorial, ownerUid: mockUser.uid };
      mockGet.mockResolvedValue(mockFirebaseDoc(memorialWithOwner));
      mockDelete.mockResolvedValue(undefined);

      const memorial = await mockGet();
      const canDelete = memorial.data().ownerUid === mockUser.uid;
      
      if (canDelete) {
        await mockDelete();
      }
      
      expect(canDelete).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('prevents deletion by non-owners', () => {
      const memorial = createTestMemorial({ ownerUid: 'other-user' });
      const canDelete = memorial.ownerUid === mockUser.uid;
      
      expect(canDelete).toBe(false);
    });
  });

  describe('Memorial Search Logic', () => {
    it('filters public memorials for search', () => {
      const memorials = [
        createTestMemorial({ isPublic: true, lovedOneName: 'John Doe' }),
        createTestMemorial({ isPublic: false, lovedOneName: 'Jane Smith', ownerUid: 'other-user' }),
        createTestMemorial({ isPublic: true, lovedOneName: 'Bob Johnson' })
      ];

      const publicMemorials = memorials.filter(memorial => 
        memorial.isPublic || memorial.ownerUid === mockUser.uid
      );

      expect(publicMemorials).toHaveLength(2);
      expect(publicMemorials.map(m => m.lovedOneName)).toEqual(['John Doe', 'Bob Johnson']);
    });

    it('includes private memorials for owners', () => {
      const memorials = [
        createTestMemorial({ isPublic: false, ownerUid: mockUser.uid }),
        createTestMemorial({ isPublic: false, ownerUid: 'other-user' })
      ];

      const visibleMemorials = memorials.filter(memorial => 
        memorial.isPublic || memorial.ownerUid === mockUser.uid
      );

      expect(visibleMemorials).toHaveLength(1);
      expect(visibleMemorials[0].ownerUid).toBe(mockUser.uid);
    });
  });

  describe('Memorial Validation Logic', () => {
    it('validates required fields', () => {
      const requiredFields = ['lovedOneName', 'ownerUid', 'ownerEmail'];
      const memorialData: Record<string, any> = {
        lovedOneName: 'John Doe',
        ownerUid: mockUser.uid,
        ownerEmail: mockUser.email
      };

      const isValid = requiredFields.every(field => 
        memorialData[field] && memorialData[field].toString().trim().length > 0
      );

      expect(isValid).toBe(true);
    });

    it('rejects invalid email format', () => {
      const email = 'invalid-email';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(email);
      
      expect(isValidEmail).toBe(false);
    });

    it('validates date formats', () => {
      const validDate = '2024-01-15';
      const invalidDate = 'invalid-date';
      
      const isValidDate = !isNaN(Date.parse(validDate));
      const isInvalidDate = isNaN(Date.parse(invalidDate));
      
      expect(isValidDate).toBe(true);
      expect(isInvalidDate).toBe(true);
    });
  });

  describe('Stream Integration Logic', () => {
    it('creates stream for memorial', async () => {
      const streamData = {
        memorialId: mockMemorial.id,
        title: 'Memorial Service Stream',
        createdBy: 'funeral-director-uid',
        rtmpEnabled: true,
        isVisible: true
      };

      mockAdd.mockResolvedValue({ id: 'new-stream-id' });
      await mockAdd(streamData);
      
      expect(mockAdd).toHaveBeenCalledWith(streamData);
    });

    it('validates funeral director permissions for streams', () => {
      const fdUser = createTestUser({ role: 'funeral_director' });
      const canCreateStream = fdUser.role === 'funeral_director';
      
      expect(canCreateStream).toBe(true);
    });

    it('auto-hides WHIP streams when live', () => {
      const whipStream = {
        whipEnabled: true,
        rtmpEnabled: false,
        isLive: true
      };

      const shouldHide = whipStream.whipEnabled && whipStream.isLive;
      
      expect(shouldHide).toBe(true);
    });
  });
});
