import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('displays login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('shows validation error for invalid email', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    // Use test account credentials
    await page.getByLabel(/email/i).fill('owner@test.com');
    await page.getByLabel(/password/i).fill('test123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should redirect to owner dashboard
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test('displays error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test('shows loading state during login', async ({ page }) => {
    await page.getByLabel(/email/i).fill('owner@test.com');
    await page.getByLabel(/password/i).fill('test123');
    
    const submitButton = page.getByRole('button', { name: /sign in/i });
    await submitButton.click();
    
    // Check loading state
    await expect(page.getByText(/signing in/i)).toBeVisible();
    await expect(submitButton).toBeDisabled();
  });

  test('forgot password link works', async ({ page }) => {
    await page.getByText(/forgot password/i).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('register link works', async ({ page }) => {
    await page.getByText(/create account/i).click();
    await expect(page).toHaveURL(/\/register\/loved-one/);
  });

  test('remembers login state across page refreshes', async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill('owner@test.com');
    await page.getByLabel(/password/i).fill('test123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL(/\/profile/);
    
    // Refresh page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByText(/owner@test.com/i)).toBeVisible();
  });

  test('logout works correctly', async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill('owner@test.com');
    await page.getByLabel(/password/i).fill('test123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL(/\/profile/);
    
    // Open user menu and logout
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByText(/sign out/i).click();
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/sign in/i)).toBeVisible();
  });

  test('redirects to intended page after login', async ({ page }) => {
    // Try to access protected page
    await page.goto('/profile');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    
    // Login
    await page.getByLabel(/email/i).fill('owner@test.com');
    await page.getByLabel(/password/i).fill('test123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should redirect back to intended page
    await expect(page).toHaveURL(/\/profile/);
  });

  test('handles session expiration', async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill('owner@test.com');
    await page.getByLabel(/password/i).fill('test123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL(/\/profile/);
    
    // Simulate session expiration by clearing cookies
    await page.context().clearCookies();
    
    // Try to access protected resource
    await page.goto('/profile');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
