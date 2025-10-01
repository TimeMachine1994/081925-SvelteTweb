import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET } from '../../src/routes/api/streams/[id]/status/+server.ts';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Stream Status Transitions API Tests
 * Tests the enhanced UX flow: live → ending → completed
 */

// Mock Firebase Admin
const mockDocRef = {
  get: vi.fn(),
  update: vi.fn()
};

const mockAdminDb = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => mockDocRef)
  }))
};

// Mock Cloudflare API responses
const mockCloudflareResponses = {
  connected: {
    result: {
      uid: 'test-stream-id',
      status: { current: { state: 'connected' } },
      recording: { mode: 'automatic' }
    }
  },
  disconnected: {
    result: {
      uid: 'test-stream-id', 
      status: { current: { state: 'disconnected' } },
      recording: { mode: 'automatic' }
    }
  }
};

// Mock fetch
global.fetch = vi.fn();

describe('Stream Status Transitions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Live to Ending Transition', () => {
    it('should transition from live to ending when Cloudflare disconnects', async () => {
      // Setup: Stream is currently live
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          id: 'test-stream',
          title: 'Test Stream',
          status: 'live',
          cloudflareId: 'test-cloudflare-id'
        })
      });

      // Mock Cloudflare API showing disconnected
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCloudflareResponses.disconnected)
      });

      const mockEvent = {
        params: { id: 'test-stream' },
        url: new URL('http://localhost/api/streams/test-stream/status')
      } as RequestEvent;

      const response = await GET(mockEvent);
      const result = await response.json();

      // Verify status was updated to 'ending'
      expect(mockDocRef.update).toHaveBeenCalledWith({
        status: 'ending',
        endTime: expect.any(Date),
        updatedAt: expect.any(Date),
        lastWebhookEvent: 'auto-detection',
        lastWebhookTime: expect.any(Date)
      });

      expect(result.status).toBe('ending');
    });

    it('should not transition if stream is not live', async () => {
      // Setup: Stream is ready (not live)
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          id: 'test-stream',
          status: 'ready',
          cloudflareId: 'test-cloudflare-id'
        })
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCloudflareResponses.disconnected)
      });

      const mockEvent = {
        params: { id: 'test-stream' }
      } as RequestEvent;

      await GET(mockEvent);

      // Should not update status
      expect(mockDocRef.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ending' })
      );
    });
  });

  describe('Ready to Live Transition', () => {
    it('should transition from ready to live when Cloudflare connects', async () => {
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          id: 'test-stream',
          status: 'ready',
          cloudflareId: 'test-cloudflare-id'
        })
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCloudflareResponses.connected)
      });

      const mockEvent = {
        params: { id: 'test-stream' }
      } as RequestEvent;

      const response = await GET(mockEvent);
      const result = await response.json();

      expect(mockDocRef.update).toHaveBeenCalledWith({
        status: 'live',
        actualStartTime: expect.any(Date),
        updatedAt: expect.any(Date),
        lastWebhookEvent: 'auto-detection',
        lastWebhookTime: expect.any(Date)
      });

      expect(result.status).toBe('live');
    });
  });

  describe('Error Handling', () => {
    it('should handle Cloudflare API errors gracefully', async () => {
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          id: 'test-stream',
          status: 'live',
          cloudflareId: 'test-cloudflare-id'
        })
      });

      // Mock Cloudflare API error
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500
      });

      const mockEvent = {
        params: { id: 'test-stream' }
      } as RequestEvent;

      const response = await GET(mockEvent);
      
      // Should still return basic status even if Cloudflare fails
      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent stream', async () => {
      mockDocRef.get.mockResolvedValue({
        exists: false
      });

      const mockEvent = {
        params: { id: 'non-existent' }
      } as RequestEvent;

      const response = await GET(mockEvent);
      
      expect(response.status).toBe(404);
    });
  });
});
