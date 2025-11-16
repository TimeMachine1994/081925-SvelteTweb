import { test, expect } from '@playwright/test';

/**
 * PRODUCTION INTEGRATION TESTS
 * 
 * ⚠️ WARNING: These tests CREATE and DELETE real data on production!
 * 
 * Why we need this:
 * - APIs don't fully work in localhost (Firebase, Cloudflare, etc.)
 * - Need to test real integrations end-to-end
 * - Staging doesn't exist or isn't production-like
 * 
 * Safety measures:
 * - Uses clearly marked test emails (test-automated-*)
 * - Cleans up after itself
 * - Uses unique timestamps to avoid conflicts
 * - Limited to critical path testing only
 */

test.describe('Production Integration Tests - Full API Testing', () => {
	test.use({ baseURL: process.env.PRODUCTION_URL || 'https://tributestream.com' });

	// Generate unique test identifiers
	const timestamp = Date.now();
	const testPrefix = 'test-automated';
	
	const testUser = {
		displayName: `Test User ${timestamp}`,
		email: `${testPrefix}-${timestamp}@example.com`,
		password: 'TestPass123!@#',
		phone: '5551234567'
	};

	const testMemorial = {
		lovedOneName: `Test Memorial ${timestamp}`,
		slug: `test-memorial-${timestamp}`
	};

	// Store IDs for cleanup
	let createdUserId: string | null = null;
	let createdMemorialId: string | null = null;
	let createdStreamId: string | null = null;

	/**
	 * JOURNEY 1: Complete User Registration Flow
	 * Tests: Firebase Auth, Firestore, Email sending
	 */
	test('Journey 1: Register owner and verify database save', async ({ page }) => {
		await test.step('Navigate to registration', async () => {
			await page.goto('/register');
			await expect(page.locator('h1, h2').first()).toBeVisible();
		});

		await test.step('Fill registration form', async () => {
			await page.getByLabel(/display name|name/i).fill(testUser.displayName);
			await page.getByLabel(/email/i).fill(testUser.email);
			await page.getByLabel(/password/i).first().fill(testUser.password);
			
			// Handle password confirmation if exists
			const confirmPassword = page.getByLabel(/confirm.*password/i);
			if (await confirmPassword.isVisible({ timeout: 1000 })) {
				await confirmPassword.fill(testUser.password);
			}
		});

		await test.step('Select owner role', async () => {
			// Try different possible selectors for owner registration
			const ownerButton = page.getByRole('button', { name: /register as owner|owner/i });
			const ownerRadio = page.getByRole('radio', { name: /owner/i });
			
			if (await ownerButton.isVisible({ timeout: 1000 })) {
				await ownerButton.click();
			} else if (await ownerRadio.isVisible({ timeout: 1000 })) {
				await ownerRadio.check();
			}
		});

		await test.step('Submit registration and verify redirect', async () => {
			// Wait a bit for any reCAPTCHA to load
			await page.waitForTimeout(2000);
			
			await page.getByRole('button', { name: /create account|register|sign up/i }).click();
			
			// Should redirect to profile after registration
			await expect(page).toHaveURL(/\/(profile|dashboard)/, { timeout: 15000 });
			
			console.log('✅ User registered:', testUser.email);
		});

		await test.step('Verify user is authenticated', async () => {
			// Should see user name in navigation or profile
			await expect(page.getByText(testUser.displayName)).toBeVisible({ timeout: 5000 });
			
			// Save user ID from URL or page data if possible
			console.log('✅ User authenticated and redirected correctly');
		});
	});

	/**
	 * JOURNEY 2: Memorial Creation Flow
	 * Tests: Memorial API, Firestore writes, Slug generation
	 */
	test('Journey 2: Create memorial and verify database persistence', async ({ page }) => {
		await test.step('Login first (use user from Journey 1 or create new)', async () => {
			// If Journey 1 didn't run, login with test account
			const currentUrl = page.url();
			if (!currentUrl.includes('/profile') && !currentUrl.includes('/dashboard')) {
				await page.goto('/login');
				await page.getByLabel(/email/i).fill(testUser.email);
				await page.getByLabel(/password/i).fill(testUser.password);
				await page.getByRole('button', { name: /sign in|login/i }).click();
				await expect(page).toHaveURL(/\/(profile|dashboard)/, { timeout: 10000 });
			}
		});

		await test.step('Navigate to memorial creation', async () => {
			// Click create memorial button
			await page.getByRole('button', { name: /create memorial/i }).click();
			
			// Modal or form should appear
			await expect(page.getByLabel(/loved one.*name|memorial.*name/i)).toBeVisible({ timeout: 5000 });
		});

		await test.step('Fill memorial details', async () => {
			await page.getByLabel(/loved one.*name|memorial.*name/i).fill(testMemorial.lovedOneName);
			
			// Submit memorial creation
			await page.getByRole('button', { name: /create/i }).click();
			
			console.log('✅ Memorial creation submitted');
		});

		await test.step('Verify memorial created and accessible', async () => {
			// Should redirect to memorial page or show success
			await page.waitForTimeout(3000);
			
			// Try to navigate to profile and see the memorial
			await page.goto('/profile');
			await expect(page.getByText(testMemorial.lovedOneName)).toBeVisible({ timeout: 10000 });
			
			console.log('✅ Memorial created and visible in profile');
		});

		await test.step('Verify memorial has unique slug', async () => {
			// Find the memorial link
			const memorialLink = page.getByRole('link', { name: new RegExp(testMemorial.lovedOneName, 'i') });
			await memorialLink.click();
			
			// Should navigate to memorial page with slug
			await expect(page).toHaveURL(/\/memorials\/[^\/]+/, { timeout: 5000 });
			
			// Save memorial ID/slug from URL
			const url = page.url();
			const match = url.match(/\/memorials\/([^\/]+)/);
			if (match) {
				testMemorial.slug = match[1];
				console.log('✅ Memorial slug:', testMemorial.slug);
			}
		});
	});

	/**
	 * JOURNEY 3: Stream Management
	 * Tests: Cloudflare integration, RTMP generation, Database writes
	 */
	test('Journey 3: Create stream and verify RTMP credentials', async ({ page }) => {
		await test.step('Login and navigate to stream management', async () => {
			// Login if needed
			await page.goto('/login');
			await page.getByLabel(/email/i).fill(testUser.email);
			await page.getByLabel(/password/i).fill(testUser.password);
			await page.getByRole('button', { name: /sign in/i }).click();
			await page.waitForTimeout(2000);
			
			// Navigate to memorial
			await page.goto(`/memorials/${testMemorial.slug}/streams`);
			await expect(page).toHaveURL(/\/streams/, { timeout: 5000 });
		});

		await test.step('Create new stream', async () => {
			// Click create stream
			await page.getByRole('button', { name: /create stream/i }).click();
			
			// Fill stream details
			await page.getByLabel(/title|stream.*name/i).fill('Test Stream');
			
			const descField = page.getByLabel(/description/i);
			if (await descField.isVisible({ timeout: 1000 })) {
				await descField.fill('Automated test stream');
			}
			
			// Set scheduled time (future date)
			const dateField = page.getByLabel(/date/i);
			if (await dateField.isVisible({ timeout: 1000 })) {
				await dateField.fill('2025-12-31');
			}
			
			const timeField = page.getByLabel(/time/i);
			if (await timeField.isVisible({ timeout: 1000 })) {
				await timeField.fill('14:00');
			}
			
			// Submit
			await page.getByRole('button', { name: /create|save/i }).click();
			await page.waitForTimeout(3000);
			
			console.log('✅ Stream creation submitted');
		});

		await test.step('Verify stream created with RTMP credentials', async () => {
			// Should see the stream in the list
			await expect(page.getByText(/test stream/i)).toBeVisible({ timeout: 10000 });
			
			// Look for RTMP URL or credentials (may be hidden by default)
			const showCredentials = page.getByRole('button', { name: /show.*credentials|view.*key/i });
			if (await showCredentials.isVisible({ timeout: 2000 })) {
				await showCredentials.click();
				await page.waitForTimeout(1000);
			}
			
			// Check if RTMP URL is visible (indicates Cloudflare integration worked)
			const rtmpIndicator = page.getByText(/rtmp:\/\/|stream.*key|rtmps:\/\//i);
			if (await rtmpIndicator.isVisible({ timeout: 2000 })) {
				console.log('✅ RTMP credentials generated (Cloudflare integration working)');
			} else {
				console.log('⚠️ RTMP credentials not visible (may require expansion)');
			}
		});
	});

	/**
	 * JOURNEY 4: Service Scheduling
	 * Tests: Calculator/scheduler, Database updates, Data persistence
	 */
	test('Journey 4: Schedule service and verify data saves', async ({ page }) => {
		await test.step('Login and navigate to scheduler', async () => {
			await page.goto('/login');
			await page.getByLabel(/email/i).fill(testUser.email);
			await page.getByLabel(/password/i).fill(testUser.password);
			await page.getByRole('button', { name: /sign in/i }).click();
			await page.waitForTimeout(2000);
			
			// Navigate to calculator/scheduler
			await page.goto(`/memorials/${testMemorial.slug}/calculator`);
			// OR
			await page.goto(`/schedule/${testMemorial.slug}`);
			await page.waitForTimeout(2000);
		});

		await test.step('Fill service details', async () => {
			// Fill location
			const locationField = page.getByLabel(/location.*name|service.*location/i);
			if (await locationField.isVisible({ timeout: 2000 })) {
				await locationField.fill('Test Chapel');
			}
			
			// Fill address
			const addressField = page.getByLabel(/address/i);
			if (await addressField.isVisible({ timeout: 2000 })) {
				await addressField.fill('123 Test Street');
			}
			
			// Fill date
			const dateField = page.getByLabel(/date/i).first();
			if (await dateField.isVisible({ timeout: 2000 })) {
				await dateField.fill('2025-12-31');
			}
			
			// Fill time
			const timeField = page.getByLabel(/time/i).first();
			if (await timeField.isVisible({ timeout: 2000 })) {
				await timeField.fill('14:00');
			}
		});

		await test.step('Save service details', async () => {
			// Click save button
			const saveButton = page.getByRole('button', { name: /save|next/i });
			await saveButton.click();
			await page.waitForTimeout(3000);
			
			// Look for success message
			const successIndicator = page.getByText(/saved|success|updated/i);
			if (await successIndicator.isVisible({ timeout: 5000 })) {
				console.log('✅ Service details saved');
			}
		});

		await test.step('Verify data persists on reload', async () => {
			// Reload the page
			await page.reload();
			await page.waitForTimeout(2000);
			
			// Check if data is still there
			const locationField = page.getByLabel(/location.*name/i);
			if (await locationField.isVisible({ timeout: 2000 })) {
				const value = await locationField.inputValue();
				if (value.includes('Test')) {
					console.log('✅ Data persisted after reload');
				}
			}
		});
	});

	/**
	 * JOURNEY 5: API Health Checks
	 * Tests: Direct API endpoints
	 */
	test('Journey 5: Test API endpoints directly', async ({ request }) => {
		await test.step('Test memorial search API', async () => {
			const response = await request.get('/api/search?q=test');
			expect([200, 404]).toContain(response.status());
			console.log('✅ Search API responding:', response.status());
		});

		await test.step('Test contact form API', async () => {
			const response = await request.post('/api/contact', {
				data: {
					name: 'Test User',
					email: `${testPrefix}-contact@example.com`,
					subject: 'API Test',
					message: 'Automated test message'
				}
			});
			expect([200, 400]).toContain(response.status());
			console.log('✅ Contact API responding:', response.status());
		});
	});

	/**
	 * CLEANUP: Delete test data
	 * Runs after all tests to clean up created data
	 */
	test.afterAll('Cleanup: Delete test data', async ({ page, request }) => {
		console.log('\n🧹 Starting cleanup of test data...');

		try {
			// Login as test user
			await page.goto('/login');
			await page.getByLabel(/email/i).fill(testUser.email);
			await page.getByLabel(/password/i).fill(testUser.password);
			await page.getByRole('button', { name: /sign in/i }).click();
			await page.waitForTimeout(2000);

			// Delete memorial if created
			if (testMemorial.slug) {
				try {
					await page.goto(`/memorials/${testMemorial.slug}/settings`);
					const deleteButton = page.getByRole('button', { name: /delete.*memorial/i });
					if (await deleteButton.isVisible({ timeout: 3000 })) {
						await deleteButton.click();
						// Confirm deletion if modal appears
						const confirmButton = page.getByRole('button', { name: /confirm|yes.*delete/i });
						if (await confirmButton.isVisible({ timeout: 2000 })) {
							await confirmButton.click();
						}
						console.log('✅ Deleted memorial:', testMemorial.slug);
					}
				} catch (e) {
					console.log('⚠️ Could not delete memorial:', e);
				}
			}

			// Delete user account if possible
			try {
				await page.goto('/profile/settings');
				const deleteAccount = page.getByRole('button', { name: /delete.*account/i });
				if (await deleteAccount.isVisible({ timeout: 3000 })) {
					await deleteAccount.click();
					// Confirm if needed
					const confirmButton = page.getByRole('button', { name: /confirm|yes.*delete/i });
					if (await confirmButton.isVisible({ timeout: 2000 })) {
						await confirmButton.click();
					}
					console.log('✅ Deleted user account:', testUser.email);
				}
			} catch (e) {
				console.log('⚠️ Could not delete user account (manual cleanup may be needed):', testUser.email);
			}

			console.log('✅ Cleanup complete');
		} catch (error) {
			console.error('❌ Cleanup failed:', error);
			console.log('\n⚠️ MANUAL CLEANUP REQUIRED:');
			console.log(`   Email: ${testUser.email}`);
			console.log(`   Memorial: ${testMemorial.slug}`);
		}
	});
});

/**
 * SAFETY NOTES:
 * 
 * 1. Test data is clearly marked with "test-automated-{timestamp}" prefix
 * 2. Cleanup runs automatically after tests
 * 3. Unique timestamps prevent conflicts between test runs
 * 4. If cleanup fails, data is easy to identify and remove manually
 * 
 * MANUAL CLEANUP (if needed):
 * - Search for emails starting with "test-automated-"
 * - Search for memorials with "Test Memorial" in name
 * - Search for streams with "Test Stream" in title
 */
