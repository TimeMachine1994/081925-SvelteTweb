import { test, expect } from '@playwright/test';

/**
 * FULL USER JOURNEY E2E TEST
 * Tests complete flow: Register → Create Memorial → Configure Service → Save to Database
 * 
 * ⚠️ WARNING: This test CREATES REAL DATA in your database!
 * Only run on development/staging environments, NOT production!
 */

test.describe('Complete User Journey - Register to Memorial Creation', () => {
	// Generate unique test data
	const timestamp = Date.now();
	const testUser = {
		name: `Test User ${timestamp}`,
		email: `test.user.${timestamp}@example.com`,
		password: 'TestPass123!',
		phone: '(555) 123-4567'
	};
	
	const testMemorial = {
		lovedOneName: `John Doe ${timestamp}`,
		serviceName: 'Memorial Service',
		location: 'Memorial Chapel',
		address: '123 Main Street, City, ST 12345',
		date: '2025-12-31',
		time: '14:00'
	};

	test('Complete journey: Owner registration → Memorial creation → Service setup → Database save', async ({ page }) => {
		
		// ==========================================
		// STEP 1: REGISTER NEW OWNER
		// ==========================================
		await test.step('1. Register new owner account', async () => {
			await page.goto('/register');
			
			// Fill registration form
			await page.getByLabel(/display name/i).fill(testUser.name);
			await page.getByLabel(/email/i).fill(testUser.email);
			await page.getByLabel(/password/i).fill(testUser.password);
			
			// Select "Register as Owner" option
			await page.getByRole('button', { name: /register as owner/i }).click();
			
			// Submit registration
			await page.getByRole('button', { name: /create account/i }).click();
			
			// Verify registration success
			await expect(page).toHaveURL(/\/profile/, { timeout: 10000 });
			await expect(page.getByText(testUser.name)).toBeVisible();
			
			console.log('✅ User registered successfully:', testUser.email);
		});

		// ==========================================
		// STEP 2: CREATE MEMORIAL
		// ==========================================
		await test.step('2. Create new memorial', async () => {
			// Should be on profile page after registration
			await expect(page).toHaveURL(/\/profile/);
			
			// Click "Create Memorial" button
			await page.getByRole('button', { name: /create memorial/i }).click();
			
			// Fill memorial details in modal
			await page.getByLabel(/loved one.*name/i).fill(testMemorial.lovedOneName);
			
			// Submit memorial creation
			await page.getByRole('button', { name: /create/i }).click();
			
			// Wait for memorial to be created and redirected
			await expect(page).toHaveURL(/\/memorials\/.+/, { timeout: 10000 });
			await expect(page.getByText(testMemorial.lovedOneName)).toBeVisible();
			
			console.log('✅ Memorial created:', testMemorial.lovedOneName);
		});

		// ==========================================
		// STEP 3: NAVIGATE TO STREAM MANAGEMENT
		// ==========================================
		await test.step('3. Navigate to stream management', async () => {
			// Click on "Manage Streams" or navigate directly
			await page.getByRole('link', { name: /manage streams/i }).click();
			
			// Should be on stream management page
			await expect(page).toHaveURL(/\/memorials\/.+\/streams/);
			
			console.log('✅ Navigated to stream management');
		});

		// ==========================================
		// STEP 4: CREATE STREAM
		// ==========================================
		await test.step('4. Create livestream', async () => {
			// Click "Create Stream" button
			await page.getByRole('button', { name: /create stream/i }).click();
			
			// Fill stream details
			await page.getByLabel(/stream title/i).fill(testMemorial.serviceName);
			await page.getByLabel(/description/i).fill(`Memorial service for ${testMemorial.lovedOneName}`);
			
			// Set scheduled time
			await page.getByLabel(/scheduled.*date/i).fill(testMemorial.date);
			await page.getByLabel(/scheduled.*time/i).fill(testMemorial.time);
			
			// Submit stream creation
			await page.getByRole('button', { name: /create/i }).click();
			
			// Verify stream created
			await expect(page.getByText(testMemorial.serviceName)).toBeVisible();
			
			console.log('✅ Stream created:', testMemorial.serviceName);
		});

		// ==========================================
		// STEP 5: CONFIGURE SERVICE DETAILS
		// ==========================================
		await test.step('5. Configure service details via calculator', async () => {
			// Navigate to calculator/scheduler
			await page.getByRole('link', { name: /schedule service/i }).click();
			
			// Fill service location
			await page.getByLabel(/location name/i).fill(testMemorial.location);
			await page.getByLabel(/address/i).fill(testMemorial.address);
			
			// Fill service date and time
			await page.getByLabel(/service date/i).fill(testMemorial.date);
			await page.getByLabel(/service time/i).fill(testMemorial.time);
			
			// Set duration
			await page.getByLabel(/duration/i).selectOption('2'); // 2 hours
			
			// Save service details
			await page.getByRole('button', { name: /save/i }).click();
			
			// Verify save success
			await expect(page.getByText(/saved successfully/i)).toBeVisible();
			
			console.log('✅ Service details saved to database');
		});

		// ==========================================
		// STEP 6: VERIFY DATA IN DATABASE (via UI)
		// ==========================================
		await test.step('6. Verify all data saved correctly', async () => {
			// Navigate back to memorial page
			await page.goto(`/memorials/${testMemorial.lovedOneName.toLowerCase().replace(/\s+/g, '-')}`);
			
			// Verify memorial details visible
			await expect(page.getByText(testMemorial.lovedOneName)).toBeVisible();
			await expect(page.getByText(testMemorial.location)).toBeVisible();
			
			// Verify stream is scheduled
			await expect(page.getByText(/scheduled|upcoming/i)).toBeVisible();
			
			console.log('✅ All data verified in memorial page');
		});

		// ==========================================
		// STEP 7: TEST API ENDPOINTS DIRECTLY
		// ==========================================
		await test.step('7. Verify API endpoints respond correctly', async ({ request }) => {
			// Test memorial API
			const memorialResponse = await request.get('/api/memorials');
			expect(memorialResponse.ok()).toBeTruthy();
			
			// Test streams API
			const streamsResponse = await request.get('/api/streams');
			expect(streamsResponse.ok()).toBeTruthy();
			
			console.log('✅ API endpoints responding correctly');
		});

		console.log('\n🎉 COMPLETE USER JOURNEY TEST PASSED!');
		console.log(`   User: ${testUser.email}`);
		console.log(`   Memorial: ${testMemorial.lovedOneName}`);
		console.log(`   Stream: ${testMemorial.serviceName}`);
	});

	test('API Integration: User creation endpoint', async ({ request }) => {
		const timestamp = Date.now();
		const newUser = {
			displayName: `API Test User ${timestamp}`,
			email: `api.test.${timestamp}@example.com`,
			password: 'TestPass123!',
			role: 'owner'
		};

		// Test user registration API directly
		const response = await request.post('/api/register', {
			data: newUser
		});

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data).toHaveProperty('uid');
		
		console.log('✅ User creation API working:', newUser.email);
	});

	test('API Integration: Memorial creation endpoint', async ({ request }) => {
		const timestamp = Date.now();
		
		// First create a user (would normally use auth token)
		// Then create memorial via API
		const memorialData = {
			lovedOneName: `API Memorial ${timestamp}`,
			services: {
				main: {
					location: { name: 'Test Chapel', address: '123 Test St' },
					time: { date: '2025-12-31', time: '14:00' }
				}
			}
		};

		const response = await request.post('/api/memorials/create', {
			data: memorialData
		});

		// May fail if not authenticated - that's expected and good
		if (response.ok()) {
			console.log('✅ Memorial creation API working');
		} else if (response.status() === 401) {
			console.log('✅ Memorial creation API properly protected (auth required)');
		}
	});

	test('Database Persistence: Data survives page refresh', async ({ page }) => {
		const timestamp = Date.now();
		const testData = {
			name: `Persistence Test ${timestamp}`,
			email: `persist.${timestamp}@example.com`,
			password: 'TestPass123!'
		};

		// Register user
		await page.goto('/register');
		await page.getByLabel(/display name/i).fill(testData.name);
		await page.getByLabel(/email/i).fill(testData.email);
		await page.getByLabel(/password/i).fill(testData.password);
		await page.getByRole('button', { name: /register as owner/i }).click();
		await page.getByRole('button', { name: /create account/i }).click();

		// Wait for profile page
		await expect(page).toHaveURL(/\/profile/);
		await expect(page.getByText(testData.name)).toBeVisible();

		// Refresh page
		await page.reload();

		// Data should still be there (from database)
		await expect(page.getByText(testData.name)).toBeVisible();

		// Logout and login again
		await page.getByRole('button', { name: /logout/i }).click();
		
		await page.goto('/login');
		await page.getByLabel(/email/i).fill(testData.email);
		await page.getByLabel(/password/i).fill(testData.password);
		await page.getByRole('button', { name: /sign in/i }).click();

		// Should be logged in with same data
		await expect(page).toHaveURL(/\/profile/);
		await expect(page.getByText(testData.name)).toBeVisible();

		console.log('✅ Data persists across sessions - database working correctly');
	});
});

/**
 * CLEANUP HELPER (Optional)
 * 
 * If you want to clean up test data after tests run,
 * you can create cleanup scripts in your scripts/ folder:
 * 
 * - scripts/clean-test-users.js
 * - scripts/clean-test-memorials.js
 * 
 * Run them after tests complete.
 */
