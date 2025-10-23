import { test, expect } from '@playwright/test';

test.describe('Family Registration Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete family registration flow', async ({ page }) => {
    // Start from homepage
    await expect(page.getByText('TributeStream')).toBeVisible();
    
    // Click "Create Memorial" button
    await page.getByRole('button', { name: /create memorial/i }).click();
    await expect(page).toHaveURL(/\/register\/loved-one/);
    
    // Fill out registration form
    await page.getByLabel(/loved one.*name/i).fill('John Doe');
    await page.getByLabel(/your name/i).fill('Jane Doe');
    await page.getByLabel(/email/i).fill('jane.doe@example.com');
    await page.getByLabel(/phone/i).fill('(555) 123-4567');
    
    // Submit registration
    await page.getByRole('button', { name: /create memorial/i }).click();
    
    // Should redirect to memorial setup
    await expect(page).toHaveURL(/\/memorials\/[^\/]+\/setup/);
    await expect(page.getByText(/memorial for john doe/i)).toBeVisible();
  });

  test('validates required fields', async ({ page }) => {
    await page.goto('/register/loved-one');
    
    // Try to submit empty form
    await page.getByRole('button', { name: /create memorial/i }).click();
    
    // Check validation errors
    await expect(page.getByText(/loved one.*name.*required/i)).toBeVisible();
    await expect(page.getByText(/your name.*required/i)).toBeVisible();
    await expect(page.getByText(/email.*required/i)).toBeVisible();
  });

  test('validates email format', async ({ page }) => {
    await page.goto('/register/loved-one');
    
    await page.getByLabel(/loved one.*name/i).fill('John Doe');
    await page.getByLabel(/your name/i).fill('Jane Doe');
    await page.getByLabel(/email/i).fill('invalid-email');
    
    await page.getByRole('button', { name: /create memorial/i }).click();
    
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
  });

  test('validates phone number format', async ({ page }) => {
    await page.goto('/register/loved-one');
    
    await page.getByLabel(/loved one.*name/i).fill('John Doe');
    await page.getByLabel(/your name/i).fill('Jane Doe');
    await page.getByLabel(/email/i).fill('jane@example.com');
    await page.getByLabel(/phone/i).fill('invalid-phone');
    
    await page.getByRole('button', { name: /create memorial/i }).click();
    
    await expect(page.getByText(/please enter a valid phone number/i)).toBeVisible();
  });

  test('shows loading state during registration', async ({ page }) => {
    await page.goto('/register/loved-one');
    
    await page.getByLabel(/loved one.*name/i).fill('John Doe');
    await page.getByLabel(/your name/i).fill('Jane Doe');
    await page.getByLabel(/email/i).fill('jane@example.com');
    await page.getByLabel(/phone/i).fill('(555) 123-4567');
    
    const submitButton = page.getByRole('button', { name: /create memorial/i });
    await submitButton.click();
    
    // Check loading state
    await expect(page.getByText(/creating memorial/i)).toBeVisible();
    await expect(submitButton).toBeDisabled();
  });

  test('handles duplicate email registration', async ({ page }) => {
    await page.goto('/register/loved-one');
    
    // Use existing test account email
    await page.getByLabel(/loved one.*name/i).fill('John Doe');
    await page.getByLabel(/your name/i).fill('Jane Doe');
    await page.getByLabel(/email/i).fill('owner@test.com'); // Existing account
    await page.getByLabel(/phone/i).fill('(555) 123-4567');
    
    await page.getByRole('button', { name: /create memorial/i }).click();
    
    await expect(page.getByText(/email already in use/i)).toBeVisible();
  });

  test('auto-generates memorial slug correctly', async ({ page }) => {
    await page.goto('/register/loved-one');
    
    await page.getByLabel(/loved one.*name/i).fill('Mary Jane Smith-Johnson');
    await page.getByLabel(/your name/i).fill('John Johnson');
    await page.getByLabel(/email/i).fill('john@example.com');
    await page.getByLabel(/phone/i).fill('(555) 123-4567');
    
    await page.getByRole('button', { name: /create memorial/i }).click();
    
    // Should create slug from loved one's name
    await expect(page).toHaveURL(/\/memorials\/celebration-of-life-for-mary-jane-smith-johnson/);
  });

  test('shows memorial URL preview', async ({ page }) => {
    await page.goto('/register/loved-one');
    
    // Fill in loved one's name
    await page.getByLabel(/loved one.*name/i).fill('John Doe');
    
    // Should show URL preview
    await expect(page.getByText(/tributestream\.com\/celebration-of-life-for-john-doe/i)).toBeVisible();
  });

  test('allows navigation back to homepage', async ({ page }) => {
    await page.goto('/register/loved-one');
    
    // Click back to home
    await page.getByRole('link', { name: /back to home/i }).click();
    
    await expect(page).toHaveURL('/');
  });

  test('shows terms and privacy links', async ({ page }) => {
    await page.goto('/register/loved-one');
    
    await expect(page.getByRole('link', { name: /terms of service/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /privacy policy/i })).toBeVisible();
  });

  test('registration email is sent', async ({ page }) => {
    // This would require email testing infrastructure
    // For now, we'll test that the success message mentions email
    
    await page.goto('/register/loved-one');
    
    await page.getByLabel(/loved one.*name/i).fill('John Doe');
    await page.getByLabel(/your name/i).fill('Jane Doe');
    await page.getByLabel(/email/i).fill('jane@example.com');
    await page.getByLabel(/phone/i).fill('(555) 123-4567');
    
    await page.getByRole('button', { name: /create memorial/i }).click();
    
    // Should show success message mentioning email
    await expect(page.getByText(/check your email/i)).toBeVisible();
  });

  test('prevents multiple submissions', async ({ page }) => {
    await page.goto('/register/loved-one');
    
    await page.getByLabel(/loved one.*name/i).fill('John Doe');
    await page.getByLabel(/your name/i).fill('Jane Doe');
    await page.getByLabel(/email/i).fill('jane@example.com');
    await page.getByLabel(/phone/i).fill('(555) 123-4567');
    
    const submitButton = page.getByRole('button', { name: /create memorial/i });
    
    // Click multiple times rapidly
    await submitButton.click();
    await submitButton.click();
    await submitButton.click();
    
    // Button should be disabled after first click
    await expect(submitButton).toBeDisabled();
  });

  test('form auto-saves progress', async ({ page }) => {
    await page.goto('/register/loved-one');
    
    // Fill some fields
    await page.getByLabel(/loved one.*name/i).fill('John Doe');
    await page.getByLabel(/your name/i).fill('Jane Doe');
    
    // Refresh page
    await page.reload();
    
    // Fields should be restored (if auto-save is implemented)
    await expect(page.getByLabel(/loved one.*name/i)).toHaveValue('John Doe');
    await expect(page.getByLabel(/your name/i)).toHaveValue('Jane Doe');
  });

  test('handles network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('/api/register/loved-one', route => {
      route.abort('failed');
    });
    
    await page.goto('/register/loved-one');
    
    await page.getByLabel(/loved one.*name/i).fill('John Doe');
    await page.getByLabel(/your name/i).fill('Jane Doe');
    await page.getByLabel(/email/i).fill('jane@example.com');
    await page.getByLabel(/phone/i).fill('(555) 123-4567');
    
    await page.getByRole('button', { name: /create memorial/i }).click();
    
    // Should show error message
    await expect(page.getByText(/something went wrong/i)).toBeVisible();
    
    // Button should be re-enabled for retry
    await expect(page.getByRole('button', { name: /create memorial/i })).toBeEnabled();
  });
});
