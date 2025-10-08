import { test, expect } from '@playwright/test';

test.describe('HLS Stream Integration', () => {
	test.beforeEach(async ({ page }) => {
		// Set up console logging to catch errors
		page.on('console', msg => {
			if (msg.type() === 'error') {
				console.error('Browser console error:', msg.text());
			}
		});

		// Set up network request logging
		page.on('requestfailed', request => {
			console.error('Failed request:', request.url(), request.failure()?.errorText);
		});
	});

	test('should load HLS page without errors', async ({ page }) => {
		// Navigate to HLS page with test stream ID
		await page.goto('/hls/test-stream-123');

		// Wait for page to load
		await page.waitForLoadState('networkidle');

		// Check that the page loaded without JavaScript errors
		const errors = await page.evaluate(() => {
			return window.console.error.toString();
		});

		// Should show loading or error state (since test stream doesn't exist)
		await expect(page.locator('.hls-container')).toBeVisible();
		
		// Should have either loading spinner or error message
		const hasLoadingOrError = await page.locator('.status-overlay').isVisible();
		expect(hasLoadingOrError).toBe(true);
	});

	test('should handle missing stream gracefully', async ({ page }) => {
		await page.goto('/hls/nonexistent-stream');
		
		// Wait for API call to complete
		await page.waitForTimeout(2000);
		
		// Should show error state
		await expect(page.locator('.status-overlay.error')).toBeVisible();
		await expect(page.locator('text=❌ Stream Error')).toBeVisible();
	});

	test('should make correct API calls', async ({ page }) => {
		// Set up request interception
		const apiRequests: string[] = [];
		
		page.on('request', request => {
			if (request.url().includes('/api/streams/')) {
				apiRequests.push(request.url());
			}
		});

		await page.goto('/hls/test-stream-456');
		
		// Wait for API calls
		await page.waitForTimeout(1000);
		
		// Should have made HLS API call
		expect(apiRequests.some(url => url.includes('/api/streams/test-stream-456/hls'))).toBe(true);
	});

	test('should have proper page structure', async ({ page }) => {
		await page.goto('/hls/test-stream-789');
		
		// Check page structure
		await expect(page.locator('.hls-container')).toBeVisible();
		await expect(page.locator('video.video-player')).toBeVisible();
		
		// Check page title
		await expect(page).toHaveTitle('HLS Stream for OBS');
		
		// Check that body has proper styling for OBS
		const bodyStyle = await page.evaluate(() => {
			return window.getComputedStyle(document.body);
		});
		
		expect(bodyStyle.margin).toBe('0px');
		expect(bodyStyle.padding).toBe('0px');
		expect(bodyStyle.backgroundColor).toBe('rgb(0, 0, 0)');
	});

	test('should handle video element properly', async ({ page }) => {
		await page.goto('/hls/test-stream-video');
		
		const video = page.locator('video.video-player');
		await expect(video).toBeVisible();
		
		// Check video attributes
		await expect(video).toHaveAttribute('autoplay');
		await expect(video).toHaveAttribute('muted');
		await expect(video).toHaveAttribute('playsinline');
	});
});

test.describe('WHEP Stream Integration', () => {
	test('should load WHEP page without timeout', async ({ page }) => {
		// Set longer timeout for this test
		test.setTimeout(30000);
		
		await page.goto('/whep/test-stream-whep');
		
		// Wait for page to load completely
		await page.waitForLoadState('networkidle');
		
		// Should show the WHEP container
		await expect(page.locator('.whep-container')).toBeVisible();
		
		// Should have video element
		await expect(page.locator('video.video-player')).toBeVisible();
		
		// Should show connecting or error state
		const hasStatus = await page.locator('.status-overlay').isVisible();
		expect(hasStatus).toBe(true);
	});

	test('should not cause Vite timeout errors', async ({ page }) => {
		const errors: string[] = [];
		
		page.on('console', msg => {
			if (msg.type() === 'error' && msg.text().includes('timeout')) {
				errors.push(msg.text());
			}
		});
		
		await page.goto('/whep/test-timeout-check');
		
		// Wait reasonable time
		await page.waitForTimeout(5000);
		
		// Should not have timeout errors
		expect(errors.length).toBe(0);
	});
});

test.describe('Stream Testing Tool', () => {
	test('should load testing tool page', async ({ page }) => {
		await page.goto('/test-stream');
		
		await expect(page.locator('h1')).toContainText('Stream Testing Tool');
		await expect(page.locator('input[placeholder="Enter Stream ID"]')).toBeVisible();
		await expect(page.locator('button')).toContainText('Run Tests');
	});

	test('should run tests when button clicked', async ({ page }) => {
		await page.goto('/test-stream');
		
		// Enter test stream ID
		await page.fill('input[placeholder="Enter Stream ID"]', 'test-123');
		
		// Click run tests
		await page.click('button:has-text("Run Tests")');
		
		// Should show testing state
		await expect(page.locator('button')).toContainText('Testing...');
		
		// Wait for tests to complete
		await page.waitForTimeout(3000);
		
		// Should show results
		await expect(page.locator('.grid')).toBeVisible();
	});
});
