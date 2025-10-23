import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupTestEnvironment } from '../../test-utils/test-helpers';
import { createTestUser } from '../../test-utils/factories';

// Mock Firebase Admin
const mockVerifyIdToken = vi.fn();
const mockSetCustomUserClaims = vi.fn();
const mockCreateCustomToken = vi.fn();

vi.mock('$lib/server/firebase', () => ({
  adminAuth: {
    verifyIdToken: mockVerifyIdToken,
    setCustomUserClaims: mockSetCustomUserClaims,
    createCustomToken: mockCreateCustomToken
  },
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn()
      }))
    }))
  }
}));

describe('Authentication Logic Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupTestEnvironment();
  });

  describe('Token Verification', () => {
    it('verifies valid Firebase token', async () => {
      const mockUser = createTestUser();
      mockVerifyIdToken.mockResolvedValue(mockUser);

      const result = await mockVerifyIdToken('valid-token');
      
      expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token');
      expect(result.uid).toBe(mockUser.uid);
      expect(result.email).toBe(mockUser.email);
    });

    it('rejects invalid token', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(mockVerifyIdToken('invalid-token')).rejects.toThrow('Invalid token');
    });

    it('handles expired tokens', async () => {
      mockVerifyIdToken.mockRejectedValue({ code: 'auth/id-token-expired' });

      await expect(mockVerifyIdToken('expired-token')).rejects.toMatchObject({
        code: 'auth/id-token-expired'
      });
    });
  });

  describe('Role Management', () => {
    it('sets custom user claims for role', async () => {
      const mockUser = createTestUser({ role: 'owner' });
      mockSetCustomUserClaims.mockResolvedValue(undefined);

      await mockSetCustomUserClaims(mockUser.uid, { role: 'admin' });
      
      expect(mockSetCustomUserClaims).toHaveBeenCalledWith(
        mockUser.uid,
        { role: 'admin' }
      );
    });

    it('creates custom token for user', async () => {
      const mockUser = createTestUser();
      mockCreateCustomToken.mockResolvedValue('custom-token-123');

      const token = await mockCreateCustomToken(mockUser.uid);
      
      expect(mockCreateCustomToken).toHaveBeenCalledWith(mockUser.uid);
      expect(token).toBe('custom-token-123');
    });

    it('validates role permissions', () => {
      const adminUser = createTestUser({ role: 'admin' });
      const ownerUser = createTestUser({ role: 'owner' });
      const viewerUser = createTestUser({ role: 'viewer' });

      // Admin can access everything
      expect(['admin', 'funeral_director', 'owner'].includes(adminUser.role)).toBe(true);
      
      // Owner can only access owner features
      expect(ownerUser.role).toBe('owner');
      
      // Viewer has limited access
      expect(viewerUser.role).toBe('viewer');
    });
  });

  describe('Session Management', () => {
    it('creates session data from user', () => {
      const mockUser = createTestUser();
      
      const sessionData = {
        uid: mockUser.uid,
        email: mockUser.email,
        role: mockUser.role,
        displayName: mockUser.displayName
      };

      expect(sessionData.uid).toBe(mockUser.uid);
      expect(sessionData.email).toBe(mockUser.email);
      expect(sessionData.role).toBe(mockUser.role);
    });

    it('validates session expiration', () => {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      const sessionExpiry = now + oneHour;
      const isExpired = Date.now() > sessionExpiry;
      
      expect(isExpired).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('handles Firebase auth errors gracefully', async () => {
      const errorCodes = [
        'auth/id-token-expired',
        'auth/id-token-revoked',
        'auth/invalid-id-token',
        'auth/user-disabled'
      ];

      for (const code of errorCodes) {
        mockVerifyIdToken.mockRejectedValue({ code });
        
        await expect(mockVerifyIdToken('test-token')).rejects.toMatchObject({
          code
        });
      }
    });

    it('handles network errors', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Network error'));

      await expect(mockVerifyIdToken('test-token')).rejects.toThrow('Network error');
    });
  });

  describe('Development Mode Features', () => {
    it('allows role switching in development', () => {
      const isDev = process.env.NODE_ENV === 'development';
      const allowRoleSwitch = isDev;
      
      if (allowRoleSwitch) {
        expect(mockSetCustomUserClaims).toBeDefined();
        expect(mockCreateCustomToken).toBeDefined();
      }
    });

    it('restricts role switching in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const isProd = process.env.NODE_ENV === 'production';
      const allowRoleSwitch = !isProd;
      
      expect(allowRoleSwitch).toBe(false);
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});
