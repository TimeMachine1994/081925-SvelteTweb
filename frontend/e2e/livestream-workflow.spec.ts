import { test, expect } from '@playwright/test';

test.describe('Livestream Archive E2E', () => {
	test('funeral director manages archive', async ({ page }) => {
		// Mock API responses
		await page.route('**/api/memorials/*/livestream/archive', route => {
			route.fulfill({
				status: 200,
				body: JSON.stringify({
					success: true,
					archive: [{
						id: 'stream-1',
						title: 'Memorial Service',
						isVisible: true,
						recordingReady: true
					}]
				})
			});
		});

		await page.goto('/funeral-director/memorial/test-123');
		
		await expect(page.locator('text=Livestream Archive')).toBeVisible();
		await expect(page.locator('text=Memorial Service')).toBeVisible();
	});

	test('public user views recordings', async ({ page }) => {
		await page.route('**/api/memorials/*/livestream/archive', route => {
			route.fulfill({
				status: 200,
				body: JSON.stringify({
					success: true,
					archive: [{
						id: 'stream-1',
						title: 'Memorial Service',
						isVisible: true,
						recordingReady: true,
						cloudflareId: 'cf-123'
					}],
					hasControlAccess: false
				})
			});
		});

		await page.goto('/memorial/test-memorial');
		await expect(page.locator('text=Memorial Service Recordings')).toBeVisible();
	});
});
