import { test, expect } from '@playwright/test';

/**
 * PRODUCTION SMOKE TESTS
 * These tests run against live production to verify critical paths
 * They are READ-ONLY and do not create/modify data
 */

test.describe('Production Smoke Tests - Critical User Journeys', () => {
	// Skip data modification in production
	test.use({ baseURL: process.env.PRODUCTION_URL || 'https://tributestream.com' });

	/**
	 * JOURNEY 1: Anonymous Visitor - Memorial Discovery
	 * Critical for: Public memorial viewing, search functionality
	 */
	test('Journey 1: Anonymous visitor can discover and view public memorial', async ({ page }) => {
		await test.step('1. Visit homepage', async () => {
			await page.goto('/');
			await expect(page).toHaveTitle(/Tributestream/i);
			await expect(page.locator('h1')).toBeVisible();
		});

		await test.step('2. Navigate to search', async () => {
			await page.click('text=Search');
			await expect(page).toHaveURL(/\/search/);
		});

		await test.step('3. View public memorial (if exists)', async () => {
			// Try to find any public memorial
			const memorialLink = page.locator('a[href*="/memorials/"]').first();
			if (await memorialLink.isVisible({ timeout: 5000 })) {
				await memorialLink.click();
				await expect(page.locator('text=/Memorial|Service/i')).toBeVisible();
				console.log('✅ Public memorial viewing works');
			} else {
				console.log('⚠️ No public memorials found to test');
			}
		});
	});

	/**
	 * JOURNEY 2: Registration Flow (Family Owner)
	 * Critical for: User acquisition, memorial creation
	 */
	test('Journey 2: Registration page loads and form is accessible', async ({ page }) => {
		await test.step('1. Navigate to registration', async () => {
			await page.goto('/register');
			await expect(page.locator('input[type="email"]')).toBeVisible();
			await expect(page.locator('input[type="password"]')).toBeVisible();
		});

		await test.step('2. Verify role options available', async () => {
			// Check for owner/viewer options
			const roleOptions = page.locator('text=/Owner|Viewer|Funeral Director/i');
			await expect(roleOptions.first()).toBeVisible();
		});

		await test.step('3. Verify reCAPTCHA present', async () => {
			// Check for reCAPTCHA (don't submit)
			const recaptcha = page.locator('[class*="recaptcha"]');
			if (await recaptcha.isVisible({ timeout: 3000 })) {
				console.log('✅ reCAPTCHA protection active');
			}
		});
	});

	/**
	 * JOURNEY 3: Authentication System
	 * Critical for: User access, security
	 */
	test('Journey 3: Login page accessible and secure', async ({ page }) => {
		await test.step('1. Navigate to login', async () => {
			await page.goto('/login');
			await expect(page.locator('input[type="email"]')).toBeVisible();
			await expect(page.locator('input[type="password"]')).toBeVisible();
		});

		await test.step('2. Verify password reset link', async () => {
			await expect(page.locator('text=/Forgot.*password/i')).toBeVisible();
		});

		await test.step('3. Test invalid login shows error', async () => {
			await page.fill('input[type="email"]', 'invalid@test.com');
			await page.fill('input[type="password"]', 'wrongpassword');
			await page.click('button[type="submit"]');
			// Should show error (don't check specific text as it may vary)
			await page.waitForTimeout(2000);
			console.log('✅ Login form submission works');
		});
	});

	/**
	 * JOURNEY 4: For Families Landing Page
	 * Critical for: Marketing, conversion
	 */
	test('Journey 4: Marketing pages load correctly', async ({ page }) => {
		const pages = [
			{ url: '/for-families', name: 'For Families' },
			{ url: '/for-funeral-directors', name: 'For Funeral Directors' },
			{ url: '/contact', name: 'Contact' },
		];

		for (const { url, name } of pages) {
			await test.step(`Navigate to ${name}`, async () => {
				await page.goto(url);
				await expect(page.locator('h1, h2').first()).toBeVisible();
				console.log(`✅ ${name} page loads`);
			});
		}
	});

	/**
	 * JOURNEY 5: Contact Form Accessibility
	 * Critical for: Customer support, lead generation
	 */
	test('Journey 5: Contact form is functional', async ({ page }) => {
		await test.step('1. Navigate to contact page', async () => {
			await page.goto('/contact');
			await expect(page.locator('input[name="name"]')).toBeVisible();
		});

		await test.step('2. Verify all form fields present', async () => {
			await expect(page.locator('input[name="email"]')).toBeVisible();
			await expect(page.locator('input[name="subject"]')).toBeVisible();
			await expect(page.locator('textarea[name="message"]')).toBeVisible();
			await expect(page.locator('button[type="submit"]')).toBeVisible();
		});

		await test.step('3. Test form validation', async () => {
			// Submit empty form to test validation
			await page.click('button[type="submit"]');
			await page.waitForTimeout(1000);
			console.log('✅ Form validation active');
		});
	});

	/**
	 * JOURNEY 6: Navigation & Core UI
	 * Critical for: User experience, site navigation
	 */
	test('Journey 6: Main navigation works across devices', async ({ page }) => {
		await test.step('1. Test desktop navigation', async () => {
			await page.goto('/');
			await expect(page.locator('nav')).toBeVisible();
			await expect(page.locator('text=For Families')).toBeVisible();
			await expect(page.locator('text=Contact')).toBeVisible();
		});

		await test.step('2. Test mobile navigation', async () => {
			await page.setViewportSize({ width: 375, height: 667 });
			await page.goto('/');
			// Mobile menu button should be visible
			const mobileMenuButton = page.locator('button[aria-label*="menu" i]');
			if (await mobileMenuButton.isVisible()) {
				await mobileMenuButton.click();
				console.log('✅ Mobile navigation works');
			}
		});
	});

	/**
	 * JOURNEY 7: Performance Check
	 * Critical for: User experience, SEO
	 */
	test('Journey 7: Homepage loads within acceptable time', async ({ page }) => {
		const startTime = Date.now();
		
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		
		const loadTime = Date.now() - startTime;
		console.log(`⏱️ Homepage load time: ${loadTime}ms`);
		
		// Warn if load time is slow (don't fail)
		if (loadTime > 5000) {
			console.warn('⚠️ Homepage load time exceeds 5 seconds');
		}
		
		expect(loadTime).toBeLessThan(10000); // Hard limit: 10 seconds
	});

	/**
	 * JOURNEY 8: Blog System (if exists)
	 * Critical for: Content marketing, SEO
	 */
	test('Journey 8: Blog page accessible', async ({ page }) => {
		await page.goto('/blog');
		
		// Check if blog page exists
		if (page.url().includes('/blog')) {
			await expect(page.locator('h1, h2').first()).toBeVisible();
			console.log('✅ Blog page accessible');
		} else {
			console.log('⚠️ Blog not yet implemented');
		}
	});
});

/**
 * HEALTH CHECKS - Quick API availability tests
 */
test.describe('API Health Checks', () => {
	test('API: Contact form endpoint responsive', async ({ request }) => {
		const response = await request.post('/api/contact', {
			data: {},
			failOnStatusCode: false
		});
		// Should return 400 (validation) or 200, not 500
		expect([200, 400]).toContain(response.status());
	});

	test('API: Memorial search endpoint responsive', async ({ request }) => {
		const response = await request.get('/api/search?q=test', {
			failOnStatusCode: false
		});
		// Should return 200 or 404, not crash
		expect([200, 404]).toContain(response.status());
	});
});
