import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
	
	test('Admin route responds without 500 error', async ({ page }) => {
		// Test unauthenticated access first
		await page.goto('/admin');
		
		// Should redirect to login, not show 500 error
		await page.waitForTimeout(2000);
		const currentUrl = page.url();
		
		// Should be redirected away from admin (to login)
		expect(currentUrl).toMatch(/\/(login|profile)/);
		
		// Page should not show 500 error
		const pageContent = await page.textContent('body');
		expect(pageContent).not.toContain('500');
		expect(pageContent).not.toContain('Internal Server Error');
	});

	test('Admin route loads data without serialization errors', async ({ page }) => {
		// Monitor network requests
		const responses = [];
		page.on('response', response => {
			if (response.url().includes('admin') || response.url().includes('__data.json')) {
				responses.push({
					url: response.url(),
					status: response.status(),
					statusText: response.statusText()
				});
			}
		});

		// Try to access admin route
		await page.goto('/admin');
		await page.waitForTimeout(3000);

		// Check if any admin-related requests returned 500
		const serverErrors = responses.filter(r => r.status === 500);
		
		console.log('Network responses:', responses);
		console.log('Server errors:', serverErrors);
		
		// Should not have 500 errors on admin data loading
		expect(serverErrors.length).toBe(0);
	});

	test('Production admin route accessibility test', async ({ page }) => {
		// Test against production URL
		await page.goto('https://tweblol-6urvojfnb-timemachine1994s-projects.vercel.app/admin');
		
		// Should redirect to login, not show 500 error
		await page.waitForTimeout(3000);
		const currentUrl = page.url();
		
		// Should be redirected to login
		expect(currentUrl).toContain('login');
		
		// Page should not show 500 error
		const pageContent = await page.textContent('body');
		expect(pageContent).not.toContain('500');
		expect(pageContent).not.toContain('Internal Server Error');
		
		console.log('✅ Production admin route redirects properly without 500 errors');
	});
});
