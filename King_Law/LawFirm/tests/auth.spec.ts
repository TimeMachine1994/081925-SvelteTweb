import { test, expect } from '@playwright/test';
import { TEST_USERS } from './test-helpers';

test.describe('Authentication', () => {
	test('should show login page', async ({ page }) => {
		await page.goto('/login');
		await expect(page.locator('h1, h2')).toContainText(/Welcome Back|Login|Sign In/i);
		await expect(page.locator('input[id="username"]')).toBeVisible();
		await expect(page.locator('input[id="password"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test('should show error for invalid credentials', async ({ page }) => {
		await page.goto('/login');
		
		await page.fill('input[id="username"]', 'invalid@test.com');
		await page.fill('input[id="password"]', 'wrongpassword');
		await page.click('button[type="submit"]');

		// Wait for error message
		await expect(page.locator('text=/Invalid|incorrect|failed/i')).toBeVisible({ timeout: 5000 });
	});

	test('should login as lawyer successfully', async ({ page }) => {
		await page.goto('/login');
		
		await page.fill('input[name="email"]', TEST_USERS.lawyer.email);
		await page.fill('input[name="password"]', TEST_USERS.lawyer.password);
		await page.click('button[type="submit"]');

		// Should redirect to lawyer dashboard
		await page.waitForURL('/dashboard/lawyer', { timeout: 10000 });
		await expect(page.locator('h1')).toContainText('Lawyer Dashboard');
	});

	test('should login as client successfully', async ({ page }) => {
		await page.goto('/login');
		
		await page.fill('input[name="email"]', TEST_USERS.client.email);
		await page.fill('input[name="password"]', TEST_USERS.client.password);
		await page.click('button[type="submit"]');

		// Should redirect to client dashboard
		await page.waitForURL('/dashboard/client', { timeout: 10000 });
		await expect(page.locator('h1')).toContainText('Client Dashboard');
	});

	test('should logout successfully', async ({ page }) => {
		// Login first
		await page.goto('/login');
		await page.fill('input[name="email"]', TEST_USERS.lawyer.email);
		await page.fill('input[name="password"]', TEST_USERS.lawyer.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard/lawyer');

		// Logout
		await page.click('button:has-text("Logout")');
		
		// Should redirect to login
		await page.waitForURL('/login', { timeout: 5000 });
		await expect(page.locator('input[name="email"]')).toBeVisible();
	});

	test('should redirect to login when accessing protected route', async ({ page }) => {
		// Try to access lawyer dashboard without login
		await page.goto('/dashboard/lawyer');
		
		// Should redirect to login
		await page.waitForURL('/login', { timeout: 5000 });
		await expect(page.locator('input[name="email"]')).toBeVisible();
	});

	test('should prevent client from accessing lawyer dashboard', async ({ page }) => {
		// Login as client
		await page.goto('/login');
		await page.fill('input[name="email"]', TEST_USERS.client.email);
		await page.fill('input[name="password"]', TEST_USERS.client.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard/client');

		// Try to access lawyer dashboard
		await page.goto('/dashboard/lawyer');
		
		// Should redirect back to client dashboard or login
		await page.waitForTimeout(2000);
		expect(page.url()).not.toContain('/dashboard/lawyer');
	});
});
