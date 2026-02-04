import { test, expect } from '@playwright/test';
import { loginAsLawyer, logout, generateTestCaseTitle, generateTestInvoiceDescription } from './test-helpers';

test.describe('Lawyer Workflow', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsLawyer(page);
	});

	test.afterEach(async ({ page }) => {
		await logout(page);
	});

	test('should display lawyer dashboard with stats', async ({ page }) => {
		await expect(page.locator('h1')).toContainText('Lawyer Dashboard');
		
		// Check stats cards exist
		await expect(page.locator('text=Total Cases')).toBeVisible();
		await expect(page.locator('text=Active Cases')).toBeVisible();
		await expect(page.locator('text=Documents')).toBeVisible();
		await expect(page.locator('text=Total Revenue')).toBeVisible();
	});

	test('should create a new case', async ({ page }) => {
		const caseTitle = generateTestCaseTitle();

		// Click Create Case button
		await page.click('button:has-text("Create Case"), button:has-text("+ Create Case")');

		// Wait for modal to open
		await expect(page.locator('h2:has-text("Create New Case")')).toBeVisible();

		// Search and select client
		await page.fill('input[placeholder*="Search clients"]', 'client@test.com');
		await page.waitForTimeout(500); // Wait for search results
		
		// Click first client result
		await page.click('button:has-text("John Doe")').catch(() => {
			// If no existing client, skip client selection for now
			console.log('No test client found, continuing without client selection');
		});

		// Fill in case details
		await page.fill('input[placeholder="Enter case title"]', caseTitle);
		await page.fill('textarea[placeholder*="case description"]', 'This is a test case created by Playwright');
		await page.selectOption('select', 'active');

		// Submit form
		await page.click('button:has-text("Create Case")');

		// Wait for modal to close and case to appear
		await page.waitForTimeout(1000);

		// Verify case appears in list
		await expect(page.locator(`text=${caseTitle}`)).toBeVisible({ timeout: 5000 });
	});

	test('should navigate to case detail page', async ({ page }) => {
		// Click on first case in the list
		const firstCase = page.locator('a[href^="/dashboard/lawyer/case/"]').first();
		
		if (await firstCase.isVisible()) {
			await firstCase.click();
			
			// Verify we're on case detail page
			await expect(page).toHaveURL(/\/dashboard\/lawyer\/case\/.+/);
			await expect(page.locator('h1')).toBeVisible();
		} else {
			test.skip(true, 'No cases available to test navigation');
		}
	});

	test('should create invoice from case detail page', async ({ page }) => {
		// Navigate to first case
		const firstCase = page.locator('a[href^="/dashboard/lawyer/case/"]').first();
		
		if (!(await firstCase.isVisible())) {
			test.skip(true, 'No cases available for invoice creation');
			return;
		}

		await firstCase.click();
		await page.waitForURL(/\/dashboard\/lawyer\/case\/.+/);

		// Click Create Invoice button
		await page.click('button:has-text("Create Invoice")');

		// Wait for modal
		await expect(page.locator('h2:has-text("Create Invoice")')).toBeVisible();

		// Fill invoice details
		const description = generateTestInvoiceDescription();
		await page.fill('textarea[id="description"]', description);
		await page.fill('input[id="amount"]', '500.00');
		
		// Set due date to 30 days from now
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 30);
		const dateString = futureDate.toISOString().split('T')[0];
		await page.fill('input[id="dueDate"]', dateString);

		// Submit invoice
		await page.click('button[type="submit"]:has-text("Create Invoice")');

		// Wait for page reload
		await page.waitForTimeout(2000);

		// Verify invoice appears on page
		await expect(page.locator(`text=${description}`)).toBeVisible({ timeout: 5000 });
		await expect(page.locator('text=$500.00')).toBeVisible();
	});

	test('should upload document to case', async ({ page }) => {
		// Navigate to first case
		const firstCase = page.locator('a[href^="/dashboard/lawyer/case/"]').first();
		
		if (!(await firstCase.isVisible())) {
			test.skip(true, 'No cases available for document upload');
			return;
		}

		await firstCase.click();
		await page.waitForURL(/\/dashboard\/lawyer\/case\/.+/);

		// Create a test file
		const fileContent = 'This is a test document created by Playwright';
		const buffer = Buffer.from(fileContent);

		// Upload document
		const fileInput = page.locator('input[type="file"]').first();
		await fileInput.setInputFiles({
			name: 'test-document.txt',
			mimeType: 'text/plain',
			buffer: buffer
		});

		// Wait for upload to complete
		await page.waitForTimeout(2000);

		// Verify document appears in list
		await expect(page.locator('text=test-document.txt')).toBeVisible({ timeout: 5000 });
	});
});
