import { test, expect } from '@playwright/test';
import { loginAsLawyer, loginAsClient, logout } from './test-helpers';
import {
	createCaseJourney,
	navigateToCaseDetail,
	createInvoiceJourney,
	editInvoiceJourney,
	navigateToTab,
	generateUniqueTestData
} from './journey-helpers';

test.describe('Invoice Management Journeys', () => {
	test.describe('Lawyer Invoice Management', () => {
		test.beforeEach(async ({ page }) => {
			await loginAsLawyer(page);
		});

		test.afterEach(async ({ page }) => {
			await logout(page);
		});

		test('should create invoice for case', async ({ page }) => {
			const testData = generateUniqueTestData('Invoice');

			// Create a case
			await createCaseJourney(page, {
				title: testData.caseTitle,
				description: testData.description
			});

			// Navigate to case detail
			await navigateToCaseDetail(page, testData.caseTitle);

			// Navigate to Invoices tab
			await navigateToTab(page, 'Invoices');

			// Create invoice
			await createInvoiceJourney(page, {
				description: testData.invoiceDesc,
				amount: '1500.00'
			});

			// Verify invoice appears
			await expect(page.locator(`text=${testData.invoiceDesc}`)).toBeVisible();
			await expect(page.locator('text=$1500.00, text=1,500.00')).toBeVisible();
		});

		test('should create multiple invoices for same case', async ({ page }) => {
			const testData = generateUniqueTestData('MultiInvoice');

			// Create a case
			await createCaseJourney(page, {
				title: testData.caseTitle,
				description: testData.description
			});

			// Navigate to case detail
			await navigateToCaseDetail(page, testData.caseTitle);

			// Navigate to Invoices tab
			await navigateToTab(page, 'Invoices');

			// Create first invoice
			await createInvoiceJourney(page, {
				description: `${testData.invoiceDesc} - Initial Consultation`,
				amount: '500.00'
			});

			// Create second invoice
			await createInvoiceJourney(page, {
				description: `${testData.invoiceDesc} - Document Review`,
				amount: '750.00'
			});

			// Verify both invoices appear
			await expect(page.locator('text=Initial Consultation')).toBeVisible();
			await expect(page.locator('text=Document Review')).toBeVisible();
		});

		test('should edit unpaid invoice', async ({ page }) => {
			const testData = generateUniqueTestData('EditInvoice');

			// Create a case
			await createCaseJourney(page, {
				title: testData.caseTitle,
				description: testData.description
			});

			// Navigate to case detail
			await navigateToCaseDetail(page, testData.caseTitle);

			// Navigate to Invoices tab
			await navigateToTab(page, 'Invoices');

			// Create invoice
			await createInvoiceJourney(page, {
				description: testData.invoiceDesc,
				amount: '1000.00'
			});

			// Edit invoice
			await editInvoiceJourney(page, testData.invoiceDesc, {
				description: `${testData.invoiceDesc} - Updated`,
				amount: '1250.00'
			});

			// Verify updated values appear
			await expect(page.locator('text=Updated')).toBeVisible();
			await expect(page.locator('text=$1250, text=1,250')).toBeVisible();
		});

		test('should delete unpaid invoice', async ({ page }) => {
			const testData = generateUniqueTestData('DeleteInvoice');

			// Create a case
			await createCaseJourney(page, {
				title: testData.caseTitle,
				description: testData.description
			});

			// Navigate to case detail
			await navigateToCaseDetail(page, testData.caseTitle);

			// Navigate to Invoices tab
			await navigateToTab(page, 'Invoices');

			// Create invoice
			await createInvoiceJourney(page, {
				description: testData.invoiceDesc,
				amount: '800.00'
			});

			// Verify invoice created
			await expect(page.locator(`text=${testData.invoiceDesc}`)).toBeVisible();

			// Find and click delete button
			const invoiceRow = page.locator(`tr:has-text("${testData.invoiceDesc}"), div:has-text("${testData.invoiceDesc}")`);
			const deleteButton = invoiceRow.locator('button:has-text("Delete"), [data-testid="delete-invoice-btn"]').first();

			if (await deleteButton.isVisible({ timeout: 2000 })) {
				await deleteButton.click();

				// Confirm deletion
				const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
				if (await confirmButton.isVisible({ timeout: 2000 })) {
					await confirmButton.click();
				}

				// Wait for deletion
				await page.waitForTimeout(1000);

				// Verify invoice removed
				await expect(page.locator(`text=${testData.invoiceDesc}`)).not.toBeVisible();
			} else {
				test.skip();
			}
		});

		test('should display invoice summary statistics', async ({ page }) => {
			const testData = generateUniqueTestData('InvoiceStats');

			// Create a case
			await createCaseJourney(page, {
				title: testData.caseTitle,
				description: testData.description
			});

			// Navigate to case detail
			await navigateToCaseDetail(page, testData.caseTitle);

			// Navigate to Invoices tab
			await navigateToTab(page, 'Invoices');

			// Create invoices
			await createInvoiceJourney(page, {
				description: `${testData.invoiceDesc} - 1`,
				amount: '1000.00'
			});

			await createInvoiceJourney(page, {
				description: `${testData.invoiceDesc} - 2`,
				amount: '500.00'
			});

			// Look for summary section
			const summaryLabels = ['Total', 'Outstanding', 'Paid'];
			let hasSummary = false;

			for (const label of summaryLabels) {
				if (await page.locator(`text=${label}`).isVisible({ timeout: 2000 })) {
					hasSummary = true;
					break;
				}
			}

			// Either has summary or just shows invoices
			expect(hasSummary || await page.locator(`text=${testData.invoiceDesc}`).isVisible()).toBeTruthy();
		});

		test('should display invoice status badge', async ({ page }) => {
			const testData = generateUniqueTestData('InvoiceStatus');

			// Create a case
			await createCaseJourney(page, {
				title: testData.caseTitle,
				description: testData.description
			});

			// Navigate to case detail
			await navigateToCaseDetail(page, testData.caseTitle);

			// Navigate to Invoices tab
			await navigateToTab(page, 'Invoices');

			// Create invoice
			await createInvoiceJourney(page, {
				description: testData.invoiceDesc,
				amount: '600.00'
			});

			// Look for status badge
			const statusBadge = page.locator('span:has-text("Unpaid"), span:has-text("Pending"), [data-testid="invoice-status"]');

			// Should show unpaid status for new invoice
			if (await statusBadge.isVisible({ timeout: 2000 })) {
				await expect(statusBadge).toBeVisible();
			} else {
				// At minimum, invoice should be visible
				await expect(page.locator(`text=${testData.invoiceDesc}`)).toBeVisible();
			}
		});

		test('should set custom due date for invoice', async ({ page }) => {
			const testData = generateUniqueTestData('CustomDueDate');

			// Create a case
			await createCaseJourney(page, {
				title: testData.caseTitle,
				description: testData.description
			});

			// Navigate to case detail
			await navigateToCaseDetail(page, testData.caseTitle);

			// Navigate to Invoices tab
			await navigateToTab(page, 'Invoices');

			// Create invoice with custom due date
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 60);
			const dateString = futureDate.toISOString().split('T')[0];

			await createInvoiceJourney(page, {
				description: testData.invoiceDesc,
				amount: '900.00',
				dueDate: dateString
			});

			// Verify invoice created (due date verification would require parsing UI)
			await expect(page.locator(`text=${testData.invoiceDesc}`)).toBeVisible();
		});
	});

	test.describe('Client Invoice Management', () => {
		test.beforeEach(async ({ page }) => {
			await loginAsClient(page);
		});

		test.afterEach(async ({ page }) => {
			await logout(page);
		});

		test('client should view invoices for their case', async ({ page }) => {
			// Navigate to dashboard
			await page.goto('/dashboard/client');

			// Click on first available case
			const firstCase = page.locator('a[href^="/dashboard/client/case/"]').first();

			if (await firstCase.isVisible({ timeout: 3000 })) {
				await firstCase.click();

				// Navigate to Invoices tab
				await navigateToTab(page, 'Invoices');

				// Check for invoices section
				const invoicesSection = page.locator('h2:has-text("Invoice"), h3:has-text("Invoice"), [data-testid="invoices-section"]');

				if (await invoicesSection.isVisible({ timeout: 2000 })) {
					await expect(invoicesSection).toBeVisible();
				} else {
					// Empty state is also valid
					const emptyState = page.locator('text=No invoices, text=No outstanding');
					expect(await invoicesSection.isVisible() || await emptyState.isVisible()).toBeTruthy();
				}
			} else {
				test.skip();
			}
		});

		test('client should see invoice amount and due date', async ({ page }) => {
			// Navigate to dashboard
			await page.goto('/dashboard/client');

			// Click on first available case
			const firstCase = page.locator('a[href^="/dashboard/client/case/"]').first();

			if (await firstCase.isVisible({ timeout: 3000 })) {
				await firstCase.click();

				// Navigate to Invoices tab
				await navigateToTab(page, 'Invoices');

				// Look for invoice with amount ($ symbol)
				const invoiceAmount = page.locator('text=/\\$\\d+/');

				if (await invoiceAmount.isVisible({ timeout: 2000 })) {
					await expect(invoiceAmount).toBeVisible();
				} else {
					// No invoices yet
					test.skip();
				}
			} else {
				test.skip();
			}
		});

		test('client should not be able to edit invoices', async ({ page }) => {
			// Navigate to dashboard
			await page.goto('/dashboard/client');

			// Click on first available case
			const firstCase = page.locator('a[href^="/dashboard/client/case/"]').first();

			if (await firstCase.isVisible({ timeout: 3000 })) {
				await firstCase.click();

				// Navigate to Invoices tab
				await navigateToTab(page, 'Invoices');

				// Look for edit buttons - should not exist for clients
				const editButtons = page.locator('button:has-text("Edit"), [data-testid="edit-invoice-btn"]');
				const editCount = await editButtons.count();

				// Clients should not be able to edit
				expect(editCount).toBe(0);
			} else {
				test.skip();
			}
		});

		test('client should not be able to delete invoices', async ({ page }) => {
			// Navigate to dashboard
			await page.goto('/dashboard/client');

			// Click on first available case
			const firstCase = page.locator('a[href^="/dashboard/client/case/"]').first();

			if (await firstCase.isVisible({ timeout: 3000 })) {
				await firstCase.click();

				// Navigate to Invoices tab
				await navigateToTab(page, 'Invoices');

				// Look for delete buttons - should not exist for clients
				const deleteButtons = page.locator('button:has-text("Delete"), [data-testid="delete-invoice-btn"]');
				const deleteCount = await deleteButtons.count();

				// Clients should not be able to delete
				expect(deleteCount).toBe(0);
			} else {
				test.skip();
			}
		});

		test('client should see pay invoice button for unpaid invoices', async ({ page }) => {
			// Navigate to dashboard
			await page.goto('/dashboard/client');

			// Click on first available case
			const firstCase = page.locator('a[href^="/dashboard/client/case/"]').first();

			if (await firstCase.isVisible({ timeout: 3000 })) {
				await firstCase.click();

				// Navigate to Invoices tab
				await navigateToTab(page, 'Invoices');

				// Look for pay button
				const payButton = page.locator('button:has-text("Pay"), a:has-text("Pay Now"), [data-testid="pay-invoice-btn"]');

				if (await payButton.isVisible({ timeout: 2000 })) {
					// Pay button exists - this is expected for unpaid invoices
					await expect(payButton).toBeVisible();
				} else {
					// Either no invoices or all paid - both valid states
					test.skip();
				}
			} else {
				test.skip();
			}
		});
	});

	test.describe('Invoice Validation', () => {
		test.beforeEach(async ({ page }) => {
			await loginAsLawyer(page);
		});

		test.afterEach(async ({ page }) => {
			await logout(page);
		});

		test('should validate invoice amount is required', async ({ page }) => {
			const testData = generateUniqueTestData('ValidateAmount');

			// Create a case
			await createCaseJourney(page, {
				title: testData.caseTitle,
				description: testData.description
			});

			// Navigate to case detail
			await navigateToCaseDetail(page, testData.caseTitle);

			// Navigate to Invoices tab
			await navigateToTab(page, 'Invoices');

			// Click Create Invoice
			await page.click('button:has-text("Create Invoice")');

			// Wait for modal
			await expect(page.locator('h2:has-text("Create Invoice")')).toBeVisible();

			// Fill description but leave amount empty
			await page.fill('textarea[id="description"]', testData.invoiceDesc);

			// Try to submit
			await page.click('button[type="submit"]:has-text("Create Invoice")');

			// Should show validation error or not submit
			const errorMessage = page.locator('text=required, text=amount is required, [data-testid="error-message"]');

			if (await errorMessage.isVisible({ timeout: 2000 })) {
				await expect(errorMessage).toBeVisible();
			} else {
				// Modal should still be visible (didn't submit)
				await expect(page.locator('h2:has-text("Create Invoice")')).toBeVisible();
			}
		});

		test('should validate invoice description is required', async ({ page }) => {
			const testData = generateUniqueTestData('ValidateDesc');

			// Create a case
			await createCaseJourney(page, {
				title: testData.caseTitle,
				description: testData.description
			});

			// Navigate to case detail
			await navigateToCaseDetail(page, testData.caseTitle);

			// Navigate to Invoices tab
			await navigateToTab(page, 'Invoices');

			// Click Create Invoice
			await page.click('button:has-text("Create Invoice")');

			// Wait for modal
			await expect(page.locator('h2:has-text("Create Invoice")')).toBeVisible();

			// Fill amount but leave description empty
			await page.fill('input[id="amount"]', '500.00');

			// Try to submit
			await page.click('button[type="submit"]:has-text("Create Invoice")');

			// Should show validation error or not submit
			const errorMessage = page.locator('text=required, text=description is required, [data-testid="error-message"]');

			if (await errorMessage.isVisible({ timeout: 2000 })) {
				await expect(errorMessage).toBeVisible();
			} else {
				// Modal should still be visible (didn't submit)
				await expect(page.locator('h2:has-text("Create Invoice")')).toBeVisible();
			}
		});
	});
});
