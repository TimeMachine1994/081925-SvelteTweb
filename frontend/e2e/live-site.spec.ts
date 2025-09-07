import { test, expect } from '@playwright/test';

test.describe('Live Site Tests', () => {
  test('Site is accessible and responds', async ({ page }) => {
    // Test that the site responds (even if protected)
    const response = await page.goto('/');
    
    // Should get a response (200 for public, 401 for protected)
    expect([200, 401]).toContain(response?.status());
    
    // Page should load some content (auth form or actual site)
    const hasContent = await page.locator('body').count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('Site has proper HTML structure', async ({ page }) => {
    await page.goto('/');
    
    // Should have basic HTML elements
    await expect(page.locator('html')).toBeVisible();
    await expect(page.locator('head')).toBeAttached();
    await expect(page.locator('body')).toBeVisible();
  });

  test('Site loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    
    // Wait a moment for any JS to execute
    await page.waitForTimeout(2000);
    
    // Should not have critical JavaScript errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('analytics') &&
      !error.includes('third-party')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('Site has proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Should have viewport meta tag for mobile
    const viewport = await page.locator('meta[name="viewport"]').count();
    expect(viewport).toBeGreaterThan(0);
  });

  test('Site deployment is successful', async ({ page }) => {
    const response = await page.goto('/');
    
    // Should not be a 404 or 500 error
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).not.toBe(500);
    
    // Should have Vercel headers indicating successful deployment
    const headers = response?.headers();
    expect(headers?.server).toBe('Vercel');
  });
});
