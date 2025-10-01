import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../../src/routes/api/webhooks/cloudflare/recording/+server.ts';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Recording Webhook Tests
 * Tests the ending → completed transition when recording is ready
 */

// Mock Firebase Admin
const mockStreamDoc = {
  exists: true,
  id: 'test-stream-id',
  ref: {
    update: vi.fn()
  },
  data: () => ({
    id: 'test-stream-id',
    title: 'Test Stream',
    status: 'ending',
    memorialId: 'test-memorial'
  })
};

const mockAdminDb = {
  collection: vi.fn(() => ({
    where: vi.fn(() => ({
      get: vi.fn(() => ({
        docs: [mockStreamDoc]
      }))
    }))
  }))
};

// Mock FieldValue
const mockFieldValue = {
  arrayUnion: vi.fn((value) => value)
};

describe('Recording Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Ending to Completed Transition', () => {
    it('should transition stream from ending to completed when recording is ready', async () => {
      const webhookPayload = {
        uid: 'cloudflare-video-id',
        playback: {
          hls: 'https://cloudflare.com/video.m3u8',
          dash: 'https://cloudflare.com/video.mpd'
        },
        recording: {
          duration: 1800, // 30 minutes
          size: 1024000
        }
      };

      const mockRequest = {
        json: () => Promise.resolve(webhookPayload),
        headers: {
          get: () => null // No signature for test
        }
      };

      const mockEvent = {
        request: mockRequest
      } as RequestEvent;

      const response = await POST(mockEvent);
      const result = await response.json();

      // Verify stream was updated to completed
      expect(mockStreamDoc.ref.update).toHaveBeenCalledWith({
        recordingReady: true,
        recordingUrl: 'https://cloudflare.com/video.m3u8',
        recordingDuration: 1800,
        recordingSessions: expect.any(Object),
        status: 'completed',
        playbackUrl: 'https://cloudflarestream.com/cloudflare-video-id/iframe',
        updatedAt: expect.any(Date)
      });

      expect(result.success).toBe(true);
      expect(result.streamId).toBe('test-stream-id');
    });

    it('should handle multiple recording sessions', async () => {
      // Mock stream with existing recording session
      mockStreamDoc.data = () => ({
        id: 'test-stream-id',
        title: 'Test Stream',
        status: 'ending',
        recordingSessions: [
          {
            sessionId: 'session-1',
            cloudflareStreamId: 'video-1',
            status: 'ready'
          }
        ]
      });

      const webhookPayload = {
        uid: 'cloudflare-video-id-2',
        playback: {
          hls: 'https://cloudflare.com/video2.m3u8'
        },
        recording: {
          duration: 900
        }
      };

      const mockRequest = {
        json: () => Promise.resolve(webhookPayload),
        headers: { get: () => null }
      };

      const mockEvent = { request: mockRequest } as RequestEvent;

      await POST(mockEvent);

      // Should add new recording session
      expect(mockStreamDoc.ref.update).toHaveBeenCalledWith(
        expect.objectContaining({
          recordingSessions: expect.objectContaining({
            sessionId: expect.stringContaining('session_'),
            cloudflareStreamId: 'cloudflare-video-id-2',
            status: 'ready'
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing stream gracefully', async () => {
      // Mock no streams found
      const mockEmptyQuery = {
        collection: vi.fn(() => ({
          where: vi.fn(() => ({
            get: vi.fn(() => ({
              docs: [] // No streams found
            }))
          }))
        }))
      };

      const webhookPayload = {
        uid: 'non-existent-video',
        playback: { hls: 'test.m3u8' }
      };

      const mockRequest = {
        json: () => Promise.resolve(webhookPayload),
        headers: { get: () => null }
      };

      const mockEvent = { request: mockRequest } as RequestEvent;

      const response = await POST(mockEvent);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.message).toContain('No streams found');
    });

    it('should validate webhook signature when configured', async () => {
      const mockRequest = {
        json: () => Promise.resolve({ uid: 'test' }),
        headers: {
          get: (header: string) => {
            if (header === 'cf-webhook-signature') return null;
            return null;
          }
        }
      };

      // Mock environment with webhook secret
      vi.mock('$env/dynamic/private', () => ({
        env: { CLOUDFLARE_WEBHOOK_SECRET: 'test-secret' }
      }));

      const mockEvent = { request: mockRequest } as RequestEvent;

      const response = await POST(mockEvent);
      
      expect(response.status).toBe(401);
    });
  });
});
