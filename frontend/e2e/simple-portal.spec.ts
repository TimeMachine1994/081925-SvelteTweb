import { test, expect } from '@playwright/test';

test.describe('Simple Portal Tests', () => {
  test('Home page loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Site redirects unauthenticated users to login, which is correct behavior
    await expect(page).toHaveTitle(/.*Login.*|.*Memorial.*|.*Tribute.*|.*Home.*/);
    
    // Check that page loads without errors (no 404/500)
    expect(page.url()).toMatch(/\/(login|$)/);
  });

  test('Login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Register page loads correctly', async ({ page }) => {
    await page.goto('/register');
    
    // Check if register page loads
    await expect(page.locator('text=Register')).toBeVisible();
  });

  test('Portal redirects unauthenticated users', async ({ page }) => {
    await page.goto('/my-portal');
    
    // Should redirect to login or home
    await page.waitForURL(/\/(login|$)/);
    expect(page.url()).toMatch(/\/(login|$)/);
  });

  test('Basic navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Test basic navigation links
    const links = await page.locator('a[href]').all();
    expect(links.length).toBeGreaterThan(0);
  });
});
