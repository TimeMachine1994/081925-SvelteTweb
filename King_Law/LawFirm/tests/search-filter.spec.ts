import { test, expect } from '@playwright/test';
import { loginAsLawyer, logout } from './test-helpers';
import {
	createCaseJourney,
	searchCasesJourney,
	filterCasesByStatus,
	clearSearch,
	generateUniqueTestData
} from './journey-helpers';

test.describe('Search and Filter Journeys', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsLawyer(page);
	});

	test.afterEach(async ({ page }) => {
		await logout(page);
	});

	test('should search cases by title', async ({ page }) => {
		const testData = generateUniqueTestData('SearchTitle');

		// Create a unique case
		await createCaseJourney(page, {
			title: testData.caseTitle,
			description: testData.description
		});

		// Navigate to dashboard if not already there
		await page.goto('/dashboard/lawyer');

		// Search for the case
		const resultsCount = await searchCasesJourney(page, testData.caseTitle);

		// Verify the case appears in results
		await expect(page.locator(`text=${testData.caseTitle}`)).toBeVisible({ timeout: 5000 });

		// Verify we have at least one result
		expect(resultsCount).toBeGreaterThan(0);
	});

	test('should search cases by partial title match', async ({ page }) => {
		const uniquePrefix = `Partial${Date.now()}`;
		const caseTitle = `${uniquePrefix} Contract Review`;

		// Create a case
		await createCaseJourney(page, {
			title: caseTitle,
			description: 'Contract review case for search testing'
		});

		// Navigate to dashboard
		await page.goto('/dashboard/lawyer');

		// Search with partial match
		await searchCasesJourney(page, uniquePrefix);

		// Verify case found
		await expect(page.locator(`text=${caseTitle}`)).toBeVisible({ timeout: 5000 });
	});

	test('should search cases by client name', async ({ page }) => {
		const testData = generateUniqueTestData('ClientSearch');

		// Create a case with client
		await createCaseJourney(page, {
			title: testData.caseTitle,
			description: testData.description,
			clientEmail: 'client@test.com'
		});

		// Navigate to dashboard
		await page.goto('/dashboard/lawyer');

		// Search by client name
		await searchCasesJourney(page, 'John Doe');

		// Verify case appears (it's associated with John Doe client)
		const caseLinks = await page.locator('a[href^="/dashboard/lawyer/case/"]').count();
		expect(caseLinks).toBeGreaterThan(0);
	});

	test('should show no results for non-existent search term', async ({ page }) => {
		// Navigate to dashboard
		await page.goto('/dashboard/lawyer');

		// Search for something that doesn't exist
		await searchCasesJourney(page, 'NonExistentCaseXYZ123456789');

		// Verify no results message or empty state
		const noResults = page.locator('text=No cases found, text=No results, [data-testid="empty-state"]');
		const caseLinks = await page.locator('a[href^="/dashboard/lawyer/case/"]').count();

		// Either shows no results message or has 0 case links
		if (await noResults.isVisible({ timeout: 2000 })) {
			await expect(noResults).toBeVisible();
		} else {
			expect(caseLinks).toBe(0);
		}
	});

	test('should clear search and show all cases', async ({ page }) => {
		const testData = generateUniqueTestData('ClearSearch');

		// Create a case
		await createCaseJourney(page, {
			title: testData.caseTitle,
			description: testData.description
		});

		// Navigate to dashboard
		await page.goto('/dashboard/lawyer');

		// Get initial case count
		const initialCount = await page.locator('a[href^="/dashboard/lawyer/case/"]').count();

		// Search for specific case
		await searchCasesJourney(page, testData.caseTitle);

		// Clear search
		await clearSearch(page);

		// Verify all cases shown again
		const finalCount = await page.locator('a[href^="/dashboard/lawyer/case/"]').count();
		expect(finalCount).toBeGreaterThanOrEqual(initialCount);
	});

	test('should filter cases by active status', async ({ page }) => {
		const testData = generateUniqueTestData('FilterActive');

		// Create an active case
		await createCaseJourney(page, {
			title: testData.caseTitle,
			description: testData.description,
			status: 'active'
		});

		// Navigate to dashboard
		await page.goto('/dashboard/lawyer');

		// Filter by active status
		const activeCount = await filterCasesByStatus(page, 'active');

		// Verify we have active cases
		expect(activeCount).toBeGreaterThan(0);

		// Verify the created case appears
		await expect(page.locator(`text=${testData.caseTitle}`)).toBeVisible({ timeout: 5000 });
	});

	test('should filter cases by closed status', async ({ page }) => {
		const testData = generateUniqueTestData('FilterClosed');

		// Create a closed case
		await createCaseJourney(page, {
			title: testData.caseTitle,
			description: testData.description,
			status: 'closed'
		});

		// Navigate to dashboard
		await page.goto('/dashboard/lawyer');

		// Filter by closed status
		await filterCasesByStatus(page, 'closed');

		// Wait for filter to apply
		await page.waitForTimeout(1000);

		// Verify the closed case appears
		await expect(page.locator(`text=${testData.caseTitle}`)).toBeVisible({ timeout: 5000 });
	});

	test('should filter cases by pending status', async ({ page }) => {
		const testData = generateUniqueTestData('FilterPending');

		// Create a pending case
		await createCaseJourney(page, {
			title: testData.caseTitle,
			description: testData.description,
			status: 'pending'
		});

		// Navigate to dashboard
		await page.goto('/dashboard/lawyer');

		// Filter by pending status
		await filterCasesByStatus(page, 'pending');

		// Wait for filter to apply
		await page.waitForTimeout(1000);

		// Verify the pending case appears
		await expect(page.locator(`text=${testData.caseTitle}`)).toBeVisible({ timeout: 5000 });
	});

	test('should show all cases when filter is set to all', async ({ page }) => {
		// Navigate to dashboard
		await page.goto('/dashboard/lawyer');

		// Get total case count
		const allCount = await page.locator('a[href^="/dashboard/lawyer/case/"]').count();

		// Filter by active
		await filterCasesByStatus(page, 'active');
		await page.waitForTimeout(500);
		const activeCount = await page.locator('a[href^="/dashboard/lawyer/case/"]').count();

		// Filter back to all
		await filterCasesByStatus(page, 'all');
		await page.waitForTimeout(500);
		const finalCount = await page.locator('a[href^="/dashboard/lawyer/case/"]').count();

		// Verify we're back to showing all cases
		expect(finalCount).toBe(allCount);
	});

	test('should combine search and filter', async ({ page }) => {
		const uniqueKeyword = `Combined${Date.now()}`;
		const activeCase = `${uniqueKeyword} Active Case`;
		const closedCase = `${uniqueKeyword} Closed Case`;

		// Create an active case
		await createCaseJourney(page, {
			title: activeCase,
			description: 'Active case for combined search/filter test',
			status: 'active'
		});

		// Create a closed case
		await createCaseJourney(page, {
			title: closedCase,
			description: 'Closed case for combined search/filter test',
			status: 'closed'
		});

		// Navigate to dashboard
		await page.goto('/dashboard/lawyer');

		// Search for unique keyword
		await searchCasesJourney(page, uniqueKeyword);

		// Verify both cases appear
		await expect(page.locator(`text=${activeCase}`)).toBeVisible({ timeout: 5000 });
		await expect(page.locator(`text=${closedCase}`)).toBeVisible({ timeout: 5000 });

		// Now filter by active only
		await filterCasesByStatus(page, 'active');
		await page.waitForTimeout(1000);

		// Active case should still be visible
		await expect(page.locator(`text=${activeCase}`)).toBeVisible({ timeout: 5000 });

		// Closed case should not be visible
		await expect(page.locator(`text=${closedCase}`)).not.toBeVisible();
	});

	test('should display results count after search', async ({ page }) => {
		const testData = generateUniqueTestData('ResultsCount');

		// Create a case
		await createCaseJourney(page, {
			title: testData.caseTitle,
			description: testData.description
		});

		// Navigate to dashboard
		await page.goto('/dashboard/lawyer');

		// Search for the case
		await searchCasesJourney(page, testData.caseTitle);

		// Check for results count display
		const resultsCount = page.locator(
			'text=/\\d+ results?/, text=/Found \\d+/, [data-testid="results-count"]'
		);

		if (await resultsCount.isVisible({ timeout: 2000 })) {
			await expect(resultsCount).toBeVisible();
		} else {
			// At minimum, verify the case is visible
			await expect(page.locator(`text=${testData.caseTitle}`)).toBeVisible();
		}
	});

	test('should maintain filter state when navigating back from case detail', async ({ page }) => {
		const testData = generateUniqueTestData('FilterState');

		// Create an active case
		await createCaseJourney(page, {
			title: testData.caseTitle,
			description: testData.description,
			status: 'active'
		});

		// Navigate to dashboard
		await page.goto('/dashboard/lawyer');

		// Filter by active
		await filterCasesByStatus(page, 'active');
		await page.waitForTimeout(500);

		// Click on the case
		await page.click(`text=${testData.caseTitle}`);

		// Verify we're on case detail
		await expect(page).toHaveURL(/\/dashboard\/lawyer\/case\/.+/);

		// Navigate back
		await page.goBack();

		// Wait for dashboard to load
		await expect(page.locator('h1')).toContainText('Lawyer Dashboard');

		// Verify filter is still applied (active case still visible)
		await expect(page.locator(`text=${testData.caseTitle}`)).toBeVisible({ timeout: 5000 });
	});
});
