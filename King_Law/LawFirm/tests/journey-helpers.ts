import { expect, type Page } from '@playwright/test';
import { TEST_USERS } from './test-helpers';

/**
 * Journey Helper Functions
 * Reusable functions for common user journeys across different test scenarios
 */

// ==================== CASE MANAGEMENT JOURNEYS ====================

export async function createCaseJourney(
	page: Page,
	caseData: {
		title: string;
		description: string;
		status?: 'active' | 'pending' | 'closed';
		clientEmail?: string;
	}
) {
	// Click Create Case button
	await page.click('button:has-text("Create Case"), button:has-text("+ Create Case")');

	// Wait for modal to open
	await expect(page.locator('h2:has-text("Create New Case")')).toBeVisible();

	// Search and select client if provided
	if (caseData.clientEmail) {
		await page.fill('input[placeholder*="Search clients"]', caseData.clientEmail);
		await page.waitForTimeout(500);
		await page.click('button:has-text("John Doe")').catch(() => {
			console.log('No test client found, continuing without client selection');
		});
	}

	// Fill in case details
	await page.fill('input[placeholder="Enter case title"]', caseData.title);
	await page.fill('textarea[placeholder*="case description"]', caseData.description);

	if (caseData.status) {
		await page.selectOption('select', caseData.status);
	}

	// Submit form
	await page.click('button:has-text("Create Case")');

	// Wait for modal to close and case to appear
	await page.waitForTimeout(1000);

	// Verify case appears in list
	await expect(page.locator(`text=${caseData.title}`)).toBeVisible({ timeout: 5000 });
}

export async function navigateToCaseDetail(page: Page, caseTitle?: string) {
	if (caseTitle) {
		await page.click(`text=${caseTitle}`);
	} else {
		// Navigate to first case
		const firstCase = page.locator('a[href^="/dashboard/lawyer/case/"]').first();
		await firstCase.click();
	}

	// Verify we're on case detail page
	await expect(page).toHaveURL(/\/dashboard\/lawyer\/case\/.+/);
	await expect(page.locator('h1')).toBeVisible();
}

export async function editCaseTitle(page: Page, newTitle: string) {
	// Look for edit icon or editable title
	const editButton = page.locator('[data-testid="edit-title-btn"], button:has-text("Edit")').first();

	if (await editButton.isVisible()) {
		await editButton.click();
	}

	// Fill new title
	const titleInput = page.locator('input[value], input[placeholder*="title"]').first();
	await titleInput.clear();
	await titleInput.fill(newTitle);

	// Save changes
	await page.click('button:has-text("Save"), [data-testid="save-title-btn"]');

	// Verify title updated
	await expect(page.locator(`text=${newTitle}`)).toBeVisible({ timeout: 5000 });
}

export async function changeCaseStatus(
	page: Page,
	newStatus: 'active' | 'pending' | 'closed'
) {
	// Click status dropdown/badge
	const statusElement = page.locator(
		'[data-testid="case-status"], select, button:has-text("Status")'
	).first();

	await statusElement.click();

	// Select new status
	await page.click(`text=${newStatus}`, { timeout: 3000 }).catch(async () => {
		// Try selecting via dropdown
		await page.selectOption('select', newStatus);
	});

	// Verify status changed
	await expect(page.locator(`text=${newStatus}`)).toBeVisible({ timeout: 5000 });
}

// ==================== DOCUMENT MANAGEMENT JOURNEYS ====================

export async function uploadDocumentJourney(
	page: Page,
	fileName: string,
	fileContent: string,
	mimeType: string = 'text/plain'
) {
	const buffer = Buffer.from(fileContent);

	const fileInput = page.locator('input[type="file"]').first();
	await fileInput.setInputFiles({
		name: fileName,
		mimeType: mimeType,
		buffer: buffer
	});

	// Wait for upload to complete
	await page.waitForTimeout(2000);

	// Verify document appears in list
	await expect(page.locator(`text=${fileName}`)).toBeVisible({ timeout: 5000 });
}

export async function deleteDocumentJourney(page: Page, fileName: string) {
	// Find delete button for specific document
	const documentRow = page.locator(`tr:has-text("${fileName}"), div:has-text("${fileName}")`);
	const deleteButton = documentRow.locator('button:has-text("Delete"), [data-testid="delete-doc-btn"]').first();

	await deleteButton.click();

	// Confirm deletion if modal appears
	const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
	if (await confirmButton.isVisible({ timeout: 1000 })) {
		await confirmButton.click();
	}

	// Verify document removed
	await expect(page.locator(`text=${fileName}`)).not.toBeVisible({ timeout: 5000 });
}

export async function downloadDocumentJourney(page: Page, fileName: string) {
	// Set up download listener
	const downloadPromise = page.waitForEvent('download');

	// Click download button
	const documentRow = page.locator(`tr:has-text("${fileName}"), div:has-text("${fileName}")`);
	const downloadButton = documentRow.locator('button:has-text("Download"), [data-testid="download-doc-btn"]').first();

	await downloadButton.click();

	// Wait for download
	const download = await downloadPromise;

	// Verify download started
	expect(download.suggestedFilename()).toBe(fileName);
}

// ==================== INVOICE MANAGEMENT JOURNEYS ====================

export async function createInvoiceJourney(
	page: Page,
	invoiceData: {
		description: string;
		amount: string;
		dueDate?: string;
	}
) {
	// Click Create Invoice button
	await page.click('button:has-text("Create Invoice")');

	// Wait for modal
	await expect(page.locator('h2:has-text("Create Invoice")')).toBeVisible();

	// Fill invoice details
	await page.fill('textarea[id="description"]', invoiceData.description);
	await page.fill('input[id="amount"]', invoiceData.amount);

	// Set due date if provided, otherwise use default
	if (invoiceData.dueDate) {
		await page.fill('input[id="dueDate"]', invoiceData.dueDate);
	} else {
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 30);
		const dateString = futureDate.toISOString().split('T')[0];
		await page.fill('input[id="dueDate"]', dateString);
	}

	// Submit invoice
	await page.click('button[type="submit"]:has-text("Create Invoice")');

	// Wait for page reload
	await page.waitForTimeout(2000);

	// Verify invoice appears on page
	await expect(page.locator(`text=${invoiceData.description}`)).toBeVisible({ timeout: 5000 });
	await expect(page.locator(`text=$${invoiceData.amount}`)).toBeVisible();
}

export async function editInvoiceJourney(
	page: Page,
	originalDescription: string,
	newData: {
		description?: string;
		amount?: string;
	}
) {
	// Navigate to Invoices tab if not already there
	const invoicesTab = page.locator('button:has-text("Invoices"), a:has-text("Invoices")');
	if (await invoicesTab.isVisible()) {
		await invoicesTab.click();
	}

	// Find and click edit button for invoice
	const invoiceRow = page.locator(`tr:has-text("${originalDescription}"), div:has-text("${originalDescription}")`);
	const editButton = invoiceRow.locator('button:has-text("Edit"), [data-testid="edit-invoice-btn"]').first();

	await editButton.click();

	// Wait for edit modal
	await expect(page.locator('h2:has-text("Edit Invoice")')).toBeVisible();

	// Update fields if provided
	if (newData.description) {
		await page.fill('textarea[id="description"]', newData.description);
	}

	if (newData.amount) {
		await page.fill('input[id="amount"]', newData.amount);
	}

	// Save changes
	await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")');

	// Wait for update
	await page.waitForTimeout(2000);

	// Verify changes appear
	if (newData.description) {
		await expect(page.locator(`text=${newData.description}`)).toBeVisible({ timeout: 5000 });
	}
}

// ==================== MESSAGING JOURNEYS ====================

export async function sendMessageJourney(
	page: Page,
	messageContent: string,
	attachDocumentName?: string
) {
	// Navigate to Messages tab if not already there
	const messagesTab = page.locator('button:has-text("Messages"), a:has-text("Messages")');
	if (await messagesTab.isVisible()) {
		await messagesTab.click();
	}

	// Fill message textarea
	const messageInput = page.locator('textarea[placeholder*="message"], textarea').first();
	await messageInput.fill(messageContent);

	// Attach document if specified
	if (attachDocumentName) {
		const attachButton = page.locator('button:has-text("Attach"), [data-testid="attach-file-btn"]');
		if (await attachButton.isVisible()) {
			await attachButton.click();
			// Select document from list
			await page.click(`text=${attachDocumentName}`);
		}
	}

	// Send message
	await page.click('button:has-text("Send"), [data-testid="send-message-btn"]');

	// Wait for message to appear
	await page.waitForTimeout(1000);

	// Verify message appears in thread
	await expect(page.locator(`text=${messageContent}`)).toBeVisible({ timeout: 5000 });
}

export async function markMessagesAsRead(page: Page, caseTitle?: string) {
	// Navigate to case if title provided
	if (caseTitle) {
		await page.click(`text=${caseTitle}`);
	}

	// Navigate to Messages tab
	const messagesTab = page.locator('button:has-text("Messages"), a:has-text("Messages")');
	if (await messagesTab.isVisible()) {
		await messagesTab.click();
	}

	// Wait for messages to load and be marked as read
	await page.waitForTimeout(1000);

	// Verify unread badge is gone or count is 0
	const unreadBadge = page.locator('[data-testid="unread-badge"], .unread-count');
	if (await unreadBadge.isVisible({ timeout: 2000 })) {
		await expect(unreadBadge).toHaveText('0');
	}
}

// ==================== SEARCH & FILTER JOURNEYS ====================

export async function searchCasesJourney(page: Page, searchTerm: string) {
	// Find search input
	const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();

	// Enter search term
	await searchInput.fill(searchTerm);

	// Wait for debounced search
	await page.waitForTimeout(600);

	// Return filtered results
	const results = await page.locator('a[href^="/dashboard/lawyer/case/"]').count();
	return results;
}

export async function filterCasesByStatus(
	page: Page,
	status: 'all' | 'active' | 'pending' | 'closed'
) {
	// Find status filter dropdown
	const filterDropdown = page.locator(
		'select[name="status"], [data-testid="status-filter"]'
	).first();

	// Select status
	if (await filterDropdown.isVisible()) {
		await filterDropdown.selectOption(status);
	} else {
		// Try clicking filter button/link
		await page.click(`button:has-text("${status}"), a:has-text("${status}")`);
	}

	// Wait for filter to apply
	await page.waitForTimeout(500);

	// Return filtered count
	const results = await page.locator('a[href^="/dashboard/lawyer/case/"]').count();
	return results;
}

// ==================== VALIDATION HELPERS ====================

export async function expectFileUploadError(
	page: Page,
	fileName: string,
	fileContent: string,
	mimeType: string,
	expectedError: string
) {
	const buffer = Buffer.from(fileContent);

	const fileInput = page.locator('input[type="file"]').first();
	await fileInput.setInputFiles({
		name: fileName,
		mimeType: mimeType,
		buffer: buffer
	});

	// Wait for error message
	await expect(page.locator(`text=${expectedError}`)).toBeVisible({ timeout: 5000 });
}

// ==================== NAVIGATION HELPERS ====================

export async function navigateToDashboard(page: Page, role: 'lawyer' | 'client') {
	await page.goto(`/dashboard/${role}`);
	await expect(page.locator('h1')).toContainText(`${role === 'lawyer' ? 'Lawyer' : 'Client'} Dashboard`);
}

export async function navigateToTab(page: Page, tabName: string) {
	const tab = page.locator(`button:has-text("${tabName}"), a:has-text("${tabName}")`);
	await tab.click();
	await page.waitForTimeout(500);
}

// ==================== UTILITY FUNCTIONS ====================

export function generateUniqueTestData(prefix: string = 'Test') {
	const timestamp = Date.now();
	return {
		caseTitle: `${prefix} Case ${timestamp}`,
		description: `${prefix} Description ${timestamp}`,
		invoiceDesc: `${prefix} Invoice ${timestamp}`,
		fileName: `${prefix}-doc-${timestamp}.txt`,
		message: `${prefix} message content ${timestamp}`
	};
}

export async function waitForToast(page: Page, message: string, timeout: number = 5000) {
	await expect(page.locator(`text=${message}, [data-testid="toast"]:has-text("${message}")`))
		.toBeVisible({ timeout });
}

export async function clearSearch(page: Page) {
	const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
	await searchInput.clear();
	await page.waitForTimeout(600);
}
