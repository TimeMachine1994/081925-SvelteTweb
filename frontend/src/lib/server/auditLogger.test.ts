import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { logAuditEvent, logMemorialAction, logUserAction, logAdminAction } from './auditLogger';

// Mock Firebase Admin
vi.mock('./firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      add: vi.fn().mockResolvedValue({ id: 'mock-doc-id' })
    }))
  }
}));

describe('Audit Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logAuditEvent', () => {
    it('should log basic audit event successfully', async () => {
      const mockEvent = {
        action: 'memorial_created' as const,
        userEmail: 'test@example.com',
        userRole: 'owner' as const,
        resourceType: 'memorial',
        resourceId: 'memorial-123',
        details: { name: 'Test Memorial' },
        ipAddress: '127.0.0.1'
      };

      await expect(logAuditEvent(mockEvent)).resolves.not.toThrow();
    });

    it('should handle missing optional fields', async () => {
      const mockEvent = {
        action: 'user_login' as const,
        userEmail: 'test@example.com',
        userRole: 'admin' as const
      };

      await expect(logAuditEvent(mockEvent)).resolves.not.toThrow();
    });

    it('should handle logging errors gracefully', async () => {
      // Mock Firebase to throw an error
      const { adminDb } = await import('./firebase-admin');
      vi.mocked(adminDb.collection).mockReturnValue({
        add: vi.fn().mockRejectedValue(new Error('Firebase error'))
      } as any);

      const mockEvent = {
        action: 'memorial_created' as const,
        userEmail: 'test@example.com',
        userRole: 'owner' as const
      };

      // Should not throw, but handle error internally
      await expect(logAuditEvent(mockEvent)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to log audit event'),
        expect.any(Error)
      );
    });
  });

  describe('logMemorialAction', () => {
    it('should log memorial creation', async () => {
      await expect(logMemorialAction(
        'memorial_created',
        'test@example.com',
        'owner',
        'memorial-123',
        { name: 'Test Memorial' }
      )).resolves.not.toThrow();
    });

    it('should log memorial updates', async () => {
      await expect(logMemorialAction(
        'memorial_updated',
        'director@example.com',
        'funeral_director',
        'memorial-123',
        { field: 'description', oldValue: 'old', newValue: 'new' }
      )).resolves.not.toThrow();
    });
  });

  describe('logUserAction', () => {
    it('should log user login', async () => {
      await expect(logUserAction(
        'user_login',
        'test@example.com',
        'admin',
        'user-123',
        { loginMethod: 'email' }
      )).resolves.not.toThrow();
    });

    it('should log role changes', async () => {
      await expect(logUserAction(
        'role_changed',
        'admin@example.com',
        'admin',
        'user-123',
        { oldRole: 'owner', newRole: 'funeral_director' }
      )).resolves.not.toThrow();
    });
  });

  describe('logAdminAction', () => {
    it('should log funeral director approval', async () => {
      await expect(logAdminAction(
        'funeral_director_approved',
        'admin@example.com',
        'user-123',
        { approvedBy: 'admin@example.com' }
      )).resolves.not.toThrow();
    });

    it('should log system configuration changes', async () => {
      await expect(logAdminAction(
        'system_config_changed',
        'admin@example.com',
        'config-key',
        { setting: 'max_memorials', oldValue: 100, newValue: 200 }
      )).resolves.not.toThrow();
    });
  });
});
