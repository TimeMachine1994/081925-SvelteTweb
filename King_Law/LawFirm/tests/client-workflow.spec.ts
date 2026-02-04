import { test, expect } from '@playwright/test';
import { loginAsClient, logout } from './test-helpers';

test.describe('Client Workflow', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsClient(page);
	});

	test.afterEach(async ({ page }) => {
		await logout(page);
	});

	test('should display client dashboard', async ({ page }) => {
		await expect(page.locator('h1')).toContainText('Client Dashboard');
		
		// Check stats cards
		await expect(page.locator('text=Your Cases')).toBeVisible();
		await expect(page.locator('text=Documents')).toBeVisible();
		await expect(page.locator('text=Invoices')).toBeVisible();
	});

	test('should view assigned cases', async ({ page }) => {
		// Look for cases section
		await expect(page.locator('text=Your Cases')).toBeVisible();
		
		// If cases exist, verify they're displayed
		const casesExist = await page.locator('a[href^="/dashboard/client/case/"]').count() > 0;
		
		if (casesExist) {
			const firstCase = page.locator('a[href^="/dashboard/client/case/"]').first();
			await expect(firstCase).toBeVisible();
		}
	});

	test('should navigate to case detail page', async ({ page }) => {
		const firstCase = page.locator('a[href^="/dashboard/client/case/"]').first();
		
		if (await firstCase.isVisible()) {
			await firstCase.click();
			
			// Verify we're on case detail page
			await expect(page).toHaveURL(/\/dashboard\/client\/case\/.+/);
			
			// Should see case details
			await expect(page.locator('h1')).toBeVisible();
			await expect(page.locator('text=Your Lawyer')).toBeVisible();
			await expect(page.locator('text=Documents')).toBeVisible();
			await expect(page.locator('text=Invoices')).toBeVisible();
		} else {
			test.skip(true, 'No cases assigned to test client');
		}
	});

	test('should upload document from case page', async ({ page }) => {
		const firstCase = page.locator('a[href^="/dashboard/client/case/"]').first();
		
		if (!(await firstCase.isVisible())) {
			test.skip(true, 'No cases available for document upload');
			return;
		}

		await firstCase.click();
		await page.waitForURL(/\/dashboard\/client\/case\/.+/);

		// Create test file
		const fileContent = 'Client uploaded document via Playwright';
		const buffer = Buffer.from(fileContent);

		// Upload document
		const fileInput = page.locator('input[type="file"]').first();
		await fileInput.setInputFiles({
			name: 'client-document.txt',
			mimeType: 'text/plain',
			buffer: buffer
		});

		// Wait for upload
		await page.waitForTimeout(2000);

		// Verify document appears
		await expect(page.locator('text=client-document.txt')).toBeVisible({ timeout: 5000 });
	});

	test('should view invoices', async ({ page }) => {
		// Navigate to first case
		const firstCase = page.locator('a[href^="/dashboard/client/case/"]').first();
		
		if (!(await firstCase.isVisible())) {
			test.skip(true, 'No cases available');
			return;
		}

		await firstCase.click();
		await page.waitForURL(/\/dashboard\/client\/case\/.+/);

		// Look for invoices section
		await expect(page.locator('h2:has-text("Invoices")')).toBeVisible();
		
		// Check if invoices exist
		const hasInvoices = await page.locator('text=$').count() > 0;
		
		if (hasInvoices) {
			// Verify invoice details are visible
			await expect(page.locator('.bg-background.border.border-border').first()).toBeVisible();
		}
	});

	test('should send message to lawyer', async ({ page }) => {
		const firstCase = page.locator('a[href^="/dashboard/client/case/"]').first();
		
		if (!(await firstCase.isVisible())) {
			test.skip(true, 'No cases available for messaging');
			return;
		}

		await firstCase.click();
		await page.waitForURL(/\/dashboard\/client\/case\/.+/);

		// Find message input
		const messageInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]').first();
		
		if (await messageInput.isVisible()) {
			const testMessage = `Test message from client at ${new Date().toLocaleTimeString()}`;
			
			await messageInput.fill(testMessage);
			await page.click('button:has-text("Send")');

			// Wait for message to appear
			await page.waitForTimeout(1000);
			
			// Verify message appears in chat
			await expect(page.locator(`text=${testMessage}`)).toBeVisible({ timeout: 5000 });
		} else {
			test.skip(true, 'Message input not found on case page');
		}
	});
});
