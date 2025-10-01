import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Enhanced Livestream UX Flow
 * Tests the complete user experience: live → ending → completed
 */

test.describe('Livestream Status Transitions', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to memorial page
    await page.goto('/celebration-of-life-for-test2');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="memorial-header"]', { timeout: 10000 });
  });

  test('should show live stream when status is live', async ({ page }) => {
    // Mock API to return live stream
    await page.route('/api/memorials/*/streams', async route => {
      await route.fulfill({
        json: {
          memorialId: 'test-memorial',
          totalStreams: 1,
          liveStreams: [{
            id: 'test-stream',
            title: 'Test Stream',
            status: 'live',
            playbackUrl: 'https://cloudflarestream.com/test/iframe',
            isVisible: true
          }],
          scheduledStreams: [],
          readyStreams: [],
          recordedStreams: []
        }
      });
    });

    await page.reload();

    // Should show live stream indicator
    await expect(page.locator('text=🔴 LIVE')).toBeVisible();
    
    // Should show live stream iframe
    await expect(page.locator('iframe[src*="cloudflarestream.com"]')).toBeVisible();
    
    // Should show live stream count
    await expect(page.locator('text=1 Live Stream')).toBeVisible();
  });

  test('should show processing animation when status is ending', async ({ page }) => {
    // Mock API to return ending stream
    await page.route('/api/memorials/*/streams', async route => {
      await route.fulfill({
        json: {
          memorialId: 'test-memorial',
          totalStreams: 1,
          liveStreams: [],
          scheduledStreams: [],
          readyStreams: [{
            id: 'test-stream',
            title: 'Test Stream',
            status: 'ending',
            playbackUrl: 'https://cloudflarestream.com/test/iframe',
            isVisible: true
          }],
          recordedStreams: []
        }
      });
    });

    await page.reload();

    // Should show processing animation
    await expect(page.locator('text=🎬 PROCESSING RECORDING')).toBeVisible();
    
    // Should show processing message
    await expect(page.locator('text=Stream has ended, preparing recording...')).toBeVisible();
    
    // Should show estimated time
    await expect(page.locator('text=Estimated: 2-3 minutes remaining')).toBeVisible();
    
    // Should show spinning animation
    await expect(page.locator('.animate-spin')).toBeVisible();
    
    // Should show progress bar
    await expect(page.locator('.bg-orange-500.animate-pulse')).toBeVisible();
  });

  test('should show recorded video when status is completed', async ({ page }) => {
    // Mock API to return completed stream with recording
    await page.route('/api/memorials/*/streams', async route => {
      await route.fulfill({
        json: {
          memorialId: 'test-memorial',
          totalStreams: 1,
          liveStreams: [],
          scheduledStreams: [],
          readyStreams: [],
          recordedStreams: [{
            id: 'test-stream',
            title: 'Test Stream',
            status: 'completed',
            recordingReady: true,
            recordingUrl: 'https://cloudflarestream.com/recording/iframe',
            isVisible: true
          }]
        }
      });
    });

    await page.reload();

    // Should show recorded indicator
    await expect(page.locator('text=📹 RECORDED')).toBeVisible();
    
    // Should show recorded video iframe
    await expect(page.locator('iframe[src*="recording"]')).toBeVisible();
  });

  test('should auto-refresh and detect status changes', async ({ page }) => {
    let callCount = 0;
    
    // Mock API that changes response after first call
    await page.route('/api/streams/*/status', async route => {
      callCount++;
      
      if (callCount === 1) {
        // First call: stream is live
        await route.fulfill({
          json: {
            streamId: 'test-stream',
            status: 'live',
            cloudflare: { connected: true }
          }
        });
      } else {
        // Subsequent calls: stream ended
        await route.fulfill({
          json: {
            streamId: 'test-stream', 
            status: 'ending',
            cloudflare: { connected: false }
          }
        });
      }
    });

    // Initial load should show live
    await page.reload();
    await expect(page.locator('text=🔴 LIVE')).toBeVisible();

    // Wait for polling to detect change (10 second interval)
    // Note: In real test, we'd mock timers to speed this up
    await page.waitForTimeout(12000);
    
    // Should detect status change and reload
    await expect(page.locator('text=🎬 PROCESSING RECORDING')).toBeVisible();
  });

  test('should handle multiple recordings display', async ({ page }) => {
    // Mock recordings API
    await page.route('/api/streams/*/recordings', async route => {
      await route.fulfill({
        json: {
          streamId: 'test-stream',
          totalRecordings: 3,
          recordings: [
            {
              id: 'recording-1',
              title: 'Test Stream - Recording 1',
              sequenceNumber: 1,
              duration: 900,
              playbackUrl: 'https://cloudflarestream.com/rec1/iframe',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              recordingReady: true
            },
            {
              id: 'recording-2', 
              title: 'Test Stream - Recording 2',
              sequenceNumber: 2,
              duration: 1200,
              playbackUrl: 'https://cloudflarestream.com/rec2/iframe',
              createdAt: new Date(Date.now() - 1800000).toISOString(),
              recordingReady: true
            },
            {
              id: 'recording-3',
              title: 'Test Stream - Recording 3', 
              sequenceNumber: 3,
              duration: 600,
              playbackUrl: 'https://cloudflarestream.com/rec3/iframe',
              createdAt: new Date(Date.now() - 900000).toISOString(),
              recordingReady: true
            }
          ]
        }
      });
    });

    await page.reload();

    // Should show multiple recordings
    await expect(page.locator('text=3 Recording')).toBeVisible();
    
    // Should show all recording titles
    await expect(page.locator('text=Recording 1')).toBeVisible();
    await expect(page.locator('text=Recording 2')).toBeVisible(); 
    await expect(page.locator('text=Recording 3')).toBeVisible();
    
    // Should show recording durations
    await expect(page.locator('text=15:00')).toBeVisible(); // 900 seconds
    await expect(page.locator('text=20:00')).toBeVisible(); // 1200 seconds
    await expect(page.locator('text=10:00')).toBeVisible(); // 600 seconds
  });

  test('should show both live stream and recordings simultaneously', async ({ page }) => {
    // Mock memorial streams API
    await page.route('/api/memorials/*/streams', async route => {
      await route.fulfill({
        json: {
          memorialId: 'test-memorial',
          totalStreams: 1,
          liveStreams: [{
            id: 'test-stream',
            title: 'Test Stream',
            status: 'live',
            playbackUrl: 'https://cloudflarestream.com/live/iframe',
            isVisible: true
          }],
          scheduledStreams: [],
          readyStreams: [],
          recordedStreams: []
        }
      });
    });

    // Mock recordings API
    await page.route('/api/streams/*/recordings', async route => {
      await route.fulfill({
        json: {
          totalRecordings: 2,
          recordings: [
            {
              id: 'recording-1',
              title: 'Previous Recording 1',
              sequenceNumber: 1,
              playbackUrl: 'https://cloudflarestream.com/rec1/iframe',
              recordingReady: true
            },
            {
              id: 'recording-2',
              title: 'Previous Recording 2', 
              sequenceNumber: 2,
              playbackUrl: 'https://cloudflarestream.com/rec2/iframe',
              recordingReady: true
            }
          ]
        }
      });
    });

    await page.reload();

    // Should show both live stream and recordings
    await expect(page.locator('text=1 Live Stream')).toBeVisible();
    await expect(page.locator('text=2 Recording')).toBeVisible();
    
    // Should show live stream
    await expect(page.locator('text=🔴 LIVE')).toBeVisible();
    
    // Should show recordings
    await expect(page.locator('text=Previous Recording 1')).toBeVisible();
    await expect(page.locator('text=Previous Recording 2')).toBeVisible();
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Mock empty streams
    await page.route('/api/memorials/*/streams', async route => {
      await route.fulfill({
        json: {
          memorialId: 'test-memorial',
          totalStreams: 0,
          liveStreams: [],
          scheduledStreams: [],
          readyStreams: [],
          recordedStreams: []
        }
      });
    });

    await page.reload();

    // Should show empty state message
    await expect(page.locator('text=No memorial services are currently available')).toBeVisible();
  });
});
