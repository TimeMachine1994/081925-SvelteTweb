import { test, expect } from '@playwright/test';

test.describe('Schedule Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/profile');
  });

  test('Profile to Schedule navigation flow', async ({ page }) => {
    // Start on profile page
    await page.goto('/profile');
    
    // Verify memorials are loaded
    await expect(page.locator('[data-testid="memorial-card"]')).toBeVisible();
    
    // Click schedule button on first memorial
    const scheduleButton = page.locator('[data-testid="schedule-button"]').first();
    await scheduleButton.click();
    
    // Should navigate to schedule page with memorial ID
    await page.waitForURL(/\/schedule\?memorialId=/);
    
    // Verify schedule page loads correctly
    await expect(page.locator('text=Choose Your Package')).toBeVisible();
    await expect(page.locator('text=Tributestream Record')).toBeVisible();
  });

  test('Complete schedule configuration flow', async ({ page }) => {
    // Navigate to schedule page with memorial ID
    await page.goto('/schedule?memorialId=test-memorial-123');
    
    // Wait for page to load
    await expect(page.locator('text=Choose Your Package')).toBeVisible();
    
    // Select Live tier
    await page.click('text=Tributestream Live');
    await expect(page.locator('text=$1,299')).toBeVisible();
    
    // Adjust main service hours
    await page.fill('[data-testid="main-service-hours"]', '4');
    
    // Enable additional location
    await page.check('[data-testid="additional-location-checkbox"]');
    await page.fill('[data-testid="additional-location-hours"]', '3');
    
    // Add photography addon
    await page.check('[data-testid="photography-checkbox"]');
    
    // Add USB drives
    await page.fill('[data-testid="usb-drives-input"]', '2');
    
    // Verify total calculation
    // Live: $1299 + Main overage: $250 + Additional location: $325 + Location overage: $125 + Photography: $400 + USB drives: $400
    const expectedTotal = 1299 + 250 + 325 + 125 + 400 + 400; // $2799
    await expect(page.locator(`text=$${expectedTotal.toLocaleString()}`)).toBeVisible();
    
    // Test auto-save functionality
    await page.waitForTimeout(3000); // Wait for auto-save debounce
    await expect(page.locator('text=Saved')).toBeVisible();
  });

  test('Book Now payment flow', async ({ page }) => {
    await page.goto('/schedule?memorialId=test-memorial-123');
    
    // Configure basic package
    await page.click('text=Tributestream Record');
    
    // Fill required contact information
    await page.fill('[data-testid="funeral-director-name"]', 'John Smith');
    await page.fill('[data-testid="funeral-home"]', 'Smith Funeral Home');
    
    // Click Book Now
    await page.click('[data-testid="book-now-button"]');
    
    // Should redirect to payment page
    await page.waitForURL(/\/payment\?data=/);
    
    // Verify payment page loads with correct data
    await expect(page.locator('text=Complete Payment')).toBeVisible();
    await expect(page.locator('text=$699')).toBeVisible();
  });

  test('Save and Pay Later functionality', async ({ page }) => {
    await page.goto('/schedule?memorialId=test-memorial-123');
    
    // Configure package
    await page.click('text=Tributestream Live');
    await page.fill('[data-testid="funeral-director-name"]', 'Jane Doe');
    
    // Click Save and Pay Later
    await page.click('[data-testid="save-pay-later-button"]');
    
    // Should show success message
    await expect(page.locator('text=Configuration saved successfully')).toBeVisible();
    
    // Verify data persists on page reload
    await page.reload();
    await expect(page.locator('text=Tributestream Live')).toBeVisible();
    await expect(page.locator('[data-testid="funeral-director-name"]')).toHaveValue('Jane Doe');
  });

  test('Error handling for invalid memorial ID', async ({ page }) => {
    // Navigate with invalid memorial ID
    await page.goto('/schedule?memorialId=invalid-id');
    
    // Should redirect to profile or show error
    await page.waitForURL('/profile');
    await expect(page.locator('text=Memorial not found')).toBeVisible();
  });

  test('Permission-based access control', async ({ page }) => {
    // Test as viewer role (should not have schedule access)
    await page.goto('/schedule?memorialId=restricted-memorial');
    
    // Should redirect or show permission error
    await expect(page.locator('text=Insufficient permissions')).toBeVisible();
  });

  test('Responsive design on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/schedule?memorialId=test-memorial-123');
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-tier-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-summary"]')).toBeVisible();
    
    // Test mobile interactions
    await page.click('[data-testid="mobile-tier-button-live"]');
    await expect(page.locator('text=$1,299')).toBeVisible();
  });
});

test.describe('Calculator Edge Cases', () => {
  test('USB drive pricing edge cases', async ({ page }) => {
    await page.goto('/schedule?memorialId=test-memorial-123');
    
    // Test Legacy tier with USB drives (1 included)
    await page.click('text=Tributestream Legacy');
    await page.fill('[data-testid="usb-drives-input"]', '3');
    
    // Should only charge for 2 additional drives
    await expect(page.locator('text=$200')).toBeVisible(); // 2 * $100
    
    // Switch to Record tier (0 included)
    await page.click('text=Tributestream Record');
    
    // Should charge for all 3 drives
    await expect(page.locator('text=$500')).toBeVisible(); // $300 + 2 * $100
  });

  test('Maximum hour limits', async ({ page }) => {
    await page.goto('/schedule?memorialId=test-memorial-123');
    
    // Test extreme hour values
    await page.fill('[data-testid="main-service-hours"]', '24');
    
    // Should calculate correct overage
    const overage = (24 - 2) * 125; // 22 hours * $125
    await expect(page.locator(`text=$${overage}`)).toBeVisible();
  });

  test('Zero and negative value handling', async ({ page }) => {
    await page.goto('/schedule?memorialId=test-memorial-123');
    
    // Test zero hours (should default to minimum)
    await page.fill('[data-testid="main-service-hours"]', '0');
    await page.blur('[data-testid="main-service-hours"]');
    
    // Should reset to minimum value (2 hours)
    await expect(page.locator('[data-testid="main-service-hours"]')).toHaveValue('2');
  });
});
