import { test, expect } from '@playwright/test';

test.describe('Memorial Calculator Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as owner first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('owner@test.com');
    await page.getByLabel(/password/i).fill('test123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Navigate to calculator (assuming memorial exists)
    await page.goto('/memorials/test-memorial/calculator');
  });

  test('completes full calculator flow', async ({ page }) => {
    // Step 1: Service Details
    await expect(page.getByText(/service details/i)).toBeVisible();
    
    // Fill service location
    await page.getByLabel(/location name/i).fill('Memorial Chapel');
    await page.getByLabel(/address/i).fill('123 Main St, City, State 12345');
    
    // Fill service date and time
    await page.getByLabel(/service date/i).fill('2024-06-15');
    await page.getByLabel(/service time/i).fill('14:00');
    
    // Set duration
    await page.getByLabel(/duration/i).selectOption('2');
    
    // Proceed to next step
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 2: Tier Selection
    await expect(page.getByText(/choose your package/i)).toBeVisible();
    
    // Verify tier options are displayed
    await expect(page.getByText(/diy/i)).toBeVisible();
    await expect(page.getByText(/standard/i)).toBeVisible();
    await expect(page.getByText(/premium/i)).toBeVisible();
    
    // Select Standard tier
    await page.getByRole('button', { name: /standard.*\$199/i }).click();
    
    // Proceed to summary
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 3: Summary
    await expect(page.getByText(/summary/i)).toBeVisible();
    
    // Verify details are correct
    await expect(page.getByText(/memorial chapel/i)).toBeVisible();
    await expect(page.getByText(/june 15, 2024/i)).toBeVisible();
    await expect(page.getByText(/2:00 pm/i)).toBeVisible();
    await expect(page.getByText(/standard package/i)).toBeVisible();
    await expect(page.getByText(/\$199/)).toBeVisible();
    
    // Save and pay later
    await page.getByRole('button', { name: /save and pay later/i }).click();
    
    // Should show success message
    await expect(page.getByText(/saved successfully/i)).toBeVisible();
  });

  test('validates service details step', async ({ page }) => {
    // Try to proceed without filling required fields
    await page.getByRole('button', { name: /next/i }).click();
    
    // Should show validation errors
    await expect(page.getByText(/location name is required/i)).toBeVisible();
    await expect(page.getByText(/service date is required/i)).toBeVisible();
    await expect(page.getByText(/service time is required/i)).toBeVisible();
  });

  test('handles unknown location option', async ({ page }) => {
    // Select "Location TBD" option
    await page.getByLabel(/location is unknown/i).check();
    
    // Location fields should be disabled
    await expect(page.getByLabel(/location name/i)).toBeDisabled();
    await expect(page.getByLabel(/address/i)).toBeDisabled();
    
    // Should be able to proceed
    await page.getByLabel(/service date/i).fill('2024-06-15');
    await page.getByLabel(/service time/i).fill('14:00');
    await page.getByRole('button', { name: /next/i }).click();
    
    await expect(page.getByText(/choose your package/i)).toBeVisible();
  });

  test('handles unknown time option', async ({ page }) => {
    await page.getByLabel(/location name/i).fill('Memorial Chapel');
    
    // Select "Time TBD" option
    await page.getByLabel(/time is unknown/i).check();
    
    // Time fields should be disabled
    await expect(page.getByLabel(/service date/i)).toBeDisabled();
    await expect(page.getByLabel(/service time/i)).toBeDisabled();
    
    // Should be able to proceed
    await page.getByRole('button', { name: /next/i }).click();
    
    await expect(page.getByText(/choose your package/i)).toBeVisible();
  });

  test('adds additional services', async ({ page }) => {
    // Fill main service details
    await page.getByLabel(/location name/i).fill('Memorial Chapel');
    await page.getByLabel(/service date/i).fill('2024-06-15');
    await page.getByLabel(/service time/i).fill('14:00');
    
    // Add additional service
    await page.getByRole('button', { name: /add additional service/i }).click();
    
    // Fill additional service details
    await page.getByLabel(/additional location/i).fill('Reception Hall');
    await page.getByLabel(/additional date/i).fill('2024-06-15');
    await page.getByLabel(/additional time/i).fill('16:00');
    
    await page.getByRole('button', { name: /next/i }).click();
    
    // Select tier and proceed to summary
    await page.getByRole('button', { name: /standard/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Summary should show both services
    await expect(page.getByText(/memorial chapel/i)).toBeVisible();
    await expect(page.getByText(/reception hall/i)).toBeVisible();
  });

  test('removes additional services', async ({ page }) => {
    // Fill main service and add additional
    await page.getByLabel(/location name/i).fill('Memorial Chapel');
    await page.getByLabel(/service date/i).fill('2024-06-15');
    await page.getByLabel(/service time/i).fill('14:00');
    
    await page.getByRole('button', { name: /add additional service/i }).click();
    await page.getByLabel(/additional location/i).fill('Reception Hall');
    
    // Remove additional service
    await page.getByRole('button', { name: /remove.*service/i }).click();
    
    // Additional service fields should be gone
    await expect(page.getByLabel(/additional location/i)).not.toBeVisible();
  });

  test('tier selection updates pricing', async ({ page }) => {
    // Complete service details
    await fillServiceDetails(page);
    
    // Check initial state (no tier selected)
    await expect(page.getByText(/select a package/i)).toBeVisible();
    
    // Select DIY tier
    await page.getByRole('button', { name: /diy.*\$99/i }).click();
    await expect(page.getByText(/\$99/)).toBeVisible();
    
    // Switch to Premium tier
    await page.getByRole('button', { name: /premium.*\$299/i }).click();
    await expect(page.getByText(/\$299/)).toBeVisible();
    
    // Proceed to summary
    await page.getByRole('button', { name: /next/i }).click();
    
    // Summary should show Premium pricing
    await expect(page.getByText(/premium package/i)).toBeVisible();
    await expect(page.getByText(/\$299/)).toBeVisible();
  });

  test('shows tier feature comparisons', async ({ page }) => {
    await fillServiceDetails(page);
    
    // Check DIY features
    const diyTier = page.locator('[data-tier="diy"]');
    await expect(diyTier.getByText(/basic livestream/i)).toBeVisible();
    await expect(diyTier.getByText(/email support/i)).toBeVisible();
    
    // Check Standard features
    const standardTier = page.locator('[data-tier="standard"]');
    await expect(standardTier.getByText(/hd livestream/i)).toBeVisible();
    await expect(standardTier.getByText(/recording included/i)).toBeVisible();
    await expect(standardTier.getByText(/phone support/i)).toBeVisible();
    
    // Check Premium features
    const premiumTier = page.locator('[data-tier="premium"]');
    await expect(premiumTier.getByText(/4k livestream/i)).toBeVisible();
    await expect(premiumTier.getByText(/professional editing/i)).toBeVisible();
    await expect(premiumTier.getByText(/dedicated support/i)).toBeVisible();
  });

  test('proceeds to payment flow', async ({ page }) => {
    await fillServiceDetails(page);
    
    // Select tier
    await page.getByRole('button', { name: /standard/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Proceed to payment
    await page.getByRole('button', { name: /proceed to payment/i }).click();
    
    // Should navigate to payment page
    await expect(page).toHaveURL(/\/payment/);
    await expect(page.getByText(/payment/i)).toBeVisible();
  });

  test('auto-saves form progress', async ({ page }) => {
    // Fill some details
    await page.getByLabel(/location name/i).fill('Memorial Chapel');
    await page.getByLabel(/service date/i).fill('2024-06-15');
    
    // Wait for auto-save
    await page.waitForTimeout(2000);
    
    // Refresh page
    await page.reload();
    
    // Data should be restored
    await expect(page.getByLabel(/location name/i)).toHaveValue('Memorial Chapel');
    await expect(page.getByLabel(/service date/i)).toHaveValue('2024-06-15');
  });

  test('navigates between steps correctly', async ({ page }) => {
    await fillServiceDetails(page);
    
    // Go to tier selection
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.getByText(/choose your package/i)).toBeVisible();
    
    // Go back to service details
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.getByText(/service details/i)).toBeVisible();
    
    // Data should be preserved
    await expect(page.getByLabel(/location name/i)).toHaveValue('Memorial Chapel');
  });

  test('shows step progress indicator', async ({ page }) => {
    // Check initial step indicator
    await expect(page.getByText(/step 1 of 3/i)).toBeVisible();
    
    await fillServiceDetails(page);
    await page.getByRole('button', { name: /next/i }).click();
    
    // Check second step indicator
    await expect(page.getByText(/step 2 of 3/i)).toBeVisible();
    
    await page.getByRole('button', { name: /standard/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Check final step indicator
    await expect(page.getByText(/step 3 of 3/i)).toBeVisible();
  });

  test('handles booking form integration', async ({ page }) => {
    await fillServiceDetails(page);
    await page.getByRole('button', { name: /next/i }).click();
    
    // Select tier and proceed
    await page.getByRole('button', { name: /standard/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Fill booking details
    await page.getByLabel(/reception following service/i).check();
    await page.getByLabel(/reception location/i).fill('Community Center');
    await page.getByLabel(/special requests/i).fill('Wheelchair accessible entrance needed');
    
    // Save with booking details
    await page.getByRole('button', { name: /save and pay later/i }).click();
    
    await expect(page.getByText(/saved successfully/i)).toBeVisible();
  });

  // Helper function
  async function fillServiceDetails(page: any) {
    await page.getByLabel(/location name/i).fill('Memorial Chapel');
    await page.getByLabel(/address/i).fill('123 Main St');
    await page.getByLabel(/service date/i).fill('2024-06-15');
    await page.getByLabel(/service time/i).fill('14:00');
  }
});
