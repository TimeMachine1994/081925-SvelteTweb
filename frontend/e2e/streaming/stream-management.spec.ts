import { test, expect } from '@playwright/test';

test.describe('Stream Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as funeral director
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('director@test.com');
    await page.getByLabel(/password/i).fill('test123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Navigate to stream management
    await page.goto('/memorials/test-memorial/streams');
  });

  test('displays stream management interface', async ({ page }) => {
    await expect(page.getByText(/stream management/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create stream/i })).toBeVisible();
  });

  test('creates new RTMP stream', async ({ page }) => {
    // Click create stream
    await page.getByRole('button', { name: /create stream/i }).click();
    
    // Fill stream details
    await page.getByLabel(/stream title/i).fill('Memorial Service Live Stream');
    await page.getByLabel(/description/i).fill('Live coverage of the memorial service');
    await page.getByLabel(/scheduled start time/i).fill('2024-06-15T14:00');
    
    // Select RTMP stream type
    await page.getByLabel(/rtmp stream/i).check();
    
    // Create stream
    await page.getByRole('button', { name: /create stream/i }).click();
    
    // Should show success and stream details
    await expect(page.getByText(/stream created successfully/i)).toBeVisible();
    await expect(page.getByText(/memorial service live stream/i)).toBeVisible();
    
    // Should display RTMP connection details
    await expect(page.getByText(/rtmp url/i)).toBeVisible();
    await expect(page.getByText(/stream key/i)).toBeVisible();
  });

  test('creates new WHIP stream', async ({ page }) => {
    await page.getByRole('button', { name: /create stream/i }).click();
    
    await page.getByLabel(/stream title/i).fill('Browser Stream');
    await page.getByLabel(/whip stream/i).check();
    
    await page.getByRole('button', { name: /create stream/i }).click();
    
    await expect(page.getByText(/stream created successfully/i)).toBeVisible();
    
    // WHIP streams should show browser streaming interface
    await expect(page.getByText(/browser streaming/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /start browser stream/i })).toBeVisible();
  });

  test('displays stream connection details', async ({ page }) => {
    // Assuming a stream already exists
    const streamCard = page.locator('[data-testid="stream-card"]').first();
    
    // Click to expand details
    await streamCard.getByRole('button', { name: /view details/i }).click();
    
    // Should show connection information
    await expect(page.getByText(/connection details/i)).toBeVisible();
    await expect(page.getByText(/rtmp url/i)).toBeVisible();
    await expect(page.getByText(/stream key/i)).toBeVisible();
    
    // Should have copy buttons
    await expect(page.getByRole('button', { name: /copy url/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /copy key/i })).toBeVisible();
  });

  test('copies stream connection details', async ({ page }) => {
    const streamCard = page.locator('[data-testid="stream-card"]').first();
    await streamCard.getByRole('button', { name: /view details/i }).click();
    
    // Test copying RTMP URL
    await page.getByRole('button', { name: /copy url/i }).click();
    await expect(page.getByText(/url copied/i)).toBeVisible();
    
    // Test copying stream key
    await page.getByRole('button', { name: /copy key/i }).click();
    await expect(page.getByText(/key copied/i)).toBeVisible();
  });

  test('starts and stops stream', async ({ page }) => {
    const streamCard = page.locator('[data-testid="stream-card"]').first();
    
    // Stream should initially be offline
    await expect(streamCard.getByText(/offline/i)).toBeVisible();
    
    // Start stream
    await streamCard.getByRole('button', { name: /go live/i }).click();
    
    // Should show confirmation dialog
    await expect(page.getByText(/start streaming/i)).toBeVisible();
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Stream should now be live
    await expect(streamCard.getByText(/live/i)).toBeVisible();
    await expect(streamCard.getByRole('button', { name: /stop stream/i })).toBeVisible();
    
    // Stop stream
    await streamCard.getByRole('button', { name: /stop stream/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Stream should be offline again
    await expect(streamCard.getByText(/offline/i)).toBeVisible();
  });

  test('shows live viewer count', async ({ page }) => {
    // Start a stream first
    const streamCard = page.locator('[data-testid="stream-card"]').first();
    await streamCard.getByRole('button', { name: /go live/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Should show viewer count
    await expect(streamCard.getByText(/0 viewers/i)).toBeVisible();
    
    // Simulate viewers joining (this would require backend simulation)
    // await expect(streamCard.getByText(/5 viewers/i)).toBeVisible();
  });

  test('manages stream visibility', async ({ page }) => {
    const streamCard = page.locator('[data-testid="stream-card"]').first();
    
    // Toggle visibility
    await streamCard.getByRole('button', { name: /visibility/i }).click();
    
    // Should show visibility options
    await expect(page.getByText(/stream visibility/i)).toBeVisible();
    await expect(page.getByLabel(/visible to public/i)).toBeVisible();
    await expect(page.getByLabel(/hidden/i)).toBeVisible();
    
    // Change to hidden
    await page.getByLabel(/hidden/i).check();
    await page.getByRole('button', { name: /save/i }).click();
    
    // Stream card should show hidden status
    await expect(streamCard.getByText(/hidden/i)).toBeVisible();
  });

  test('auto-hides WHIP streams when live', async ({ page }) => {
    // Create WHIP stream
    await page.getByRole('button', { name: /create stream/i }).click();
    await page.getByLabel(/stream title/i).fill('Phone Stream');
    await page.getByLabel(/whip stream/i).check();
    await page.getByRole('button', { name: /create stream/i }).click();
    
    const whipStreamCard = page.locator('[data-testid="stream-card"]').last();
    
    // Start WHIP stream
    await whipStreamCard.getByRole('button', { name: /go live/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // WHIP stream should automatically be hidden when live
    await expect(whipStreamCard.getByText(/hidden/i)).toBeVisible();
  });

  test('shows stream recordings', async ({ page }) => {
    const streamCard = page.locator('[data-testid="stream-card"]').first();
    
    // Click recordings tab
    await streamCard.getByRole('tab', { name: /recordings/i }).click();
    
    // Should show recordings list
    await expect(page.getByText(/recordings/i)).toBeVisible();
    
    // If recordings exist, should show them
    // await expect(page.getByText(/june 15, 2024/i)).toBeVisible();
    // await expect(page.getByRole('button', { name: /download/i })).toBeVisible();
  });

  test('deletes stream', async ({ page }) => {
    const streamCard = page.locator('[data-testid="stream-card"]').first();
    
    // Open stream menu
    await streamCard.getByRole('button', { name: /menu/i }).click();
    
    // Delete stream
    await page.getByRole('menuitem', { name: /delete/i }).click();
    
    // Should show confirmation dialog
    await expect(page.getByText(/delete stream/i)).toBeVisible();
    await expect(page.getByText(/this action cannot be undone/i)).toBeVisible();
    
    // Confirm deletion
    await page.getByRole('button', { name: /delete/i }).click();
    
    // Stream should be removed
    await expect(page.getByText(/stream deleted/i)).toBeVisible();
  });

  test('shows OBS setup instructions', async ({ page }) => {
    const streamCard = page.locator('[data-testid="stream-card"]').first();
    
    // Click OBS setup help
    await streamCard.getByRole('button', { name: /obs setup/i }).click();
    
    // Should show setup modal
    await expect(page.getByText(/obs studio setup/i)).toBeVisible();
    await expect(page.getByText(/stream settings/i)).toBeVisible();
    await expect(page.getByText(/server/i)).toBeVisible();
    await expect(page.getByText(/stream key/i)).toBeVisible();
    
    // Should have step-by-step instructions
    await expect(page.getByText(/step 1/i)).toBeVisible();
    await expect(page.getByText(/step 2/i)).toBeVisible();
  });

  test('handles stream errors', async ({ page }) => {
    // Simulate stream error
    await page.route('/api/streams/*/start', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Stream server unavailable' })
      });
    });
    
    const streamCard = page.locator('[data-testid="stream-card"]').first();
    await streamCard.getByRole('button', { name: /go live/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Should show error message
    await expect(page.getByText(/stream server unavailable/i)).toBeVisible();
    
    // Stream should remain offline
    await expect(streamCard.getByText(/offline/i)).toBeVisible();
  });

  test('shows stream analytics', async ({ page }) => {
    const streamCard = page.locator('[data-testid="stream-card"]').first();
    
    // Click analytics tab
    await streamCard.getByRole('tab', { name: /analytics/i }).click();
    
    // Should show analytics data
    await expect(page.getByText(/stream analytics/i)).toBeVisible();
    await expect(page.getByText(/total views/i)).toBeVisible();
    await expect(page.getByText(/peak viewers/i)).toBeVisible();
    await expect(page.getByText(/average watch time/i)).toBeVisible();
  });

  test('filters streams by status', async ({ page }) => {
    // Should have filter options
    await expect(page.getByRole('button', { name: /all streams/i })).toBeVisible();
    
    // Filter by live streams
    await page.getByRole('button', { name: /all streams/i }).click();
    await page.getByRole('menuitem', { name: /live only/i }).click();
    
    // Should only show live streams
    await expect(page.getByText(/showing live streams/i)).toBeVisible();
    
    // Filter by offline streams
    await page.getByRole('button', { name: /live only/i }).click();
    await page.getByRole('menuitem', { name: /offline only/i }).click();
    
    await expect(page.getByText(/showing offline streams/i)).toBeVisible();
  });

  test('bulk manages streams', async ({ page }) => {
    // Select multiple streams
    await page.getByRole('checkbox', { name: /select stream/i }).first().check();
    await page.getByRole('checkbox', { name: /select stream/i }).nth(1).check();
    
    // Should show bulk actions
    await expect(page.getByText(/2 streams selected/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /bulk actions/i })).toBeVisible();
    
    // Test bulk delete
    await page.getByRole('button', { name: /bulk actions/i }).click();
    await page.getByRole('menuitem', { name: /delete selected/i }).click();
    
    await expect(page.getByText(/delete 2 streams/i)).toBeVisible();
  });
});
