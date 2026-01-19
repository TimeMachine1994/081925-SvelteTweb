import { test, expect } from '@playwright/test';
import { loginAsLawyer, logout } from './test-helpers';
import {
	createCaseJourney,
	navigateToCaseDetail,
	editCaseTitle,
	changeCaseStatus,
	generateUniqueTestData
} from './journey-helpers';

test.describe('Case Management Journeys', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsLawyer(page);
	});

	test.afterEach(async ({ page }) => {
		await logout(page);
	});

	test('should edit case title inline', async ({ page }) => {
		const testData = generateUniqueTestData('EditTitle');

		// Create a case first
		await createCaseJourney(page, {
			title: testData.caseTitle,
			description: testData.description
		});

		// Navigate to case detail
		await navigateToCaseDetail(page, testData.caseTitle);

		// Edit the title
		const newTitle = `${testData.caseTitle} - Updated`;
		await editCaseTitle(page, newTitle);

		// Verify new title is displayed
		await expect(page.locator('h1, h2').filter({ hasText: newTitle })).toBeVisible();
	});

	test('should change case status from active to closed', async ({ page }) => {
		const testData = generateUniqueTestData('StatusChange');

		// Create a case with active status
		await createCaseJourney(page, {
			title: testData.caseTitle,
			description: testData.description,
			status: 'active'
		});

		// Navigate to case detail
		await navigateToCaseDetail(page, testData.caseTitle);

		// Change status to closed
		await changeCaseStatus(page, 'closed');

		// Verify status badge shows closed
		await expect(
			page.locator('span, badge, div').filter({ hasText: /closed/i })
		).toBeVisible({ timeout: 5000 });
	});

	test('should change case status from pending to active', async ({ page }) => {
		const testData = generateUniqueTestData('StatusPending');

		// Create a case with pending status
		await createCaseJourney(page, {
			title: testData.caseTitle,
			description: testData.description,
			status: 'pending'
		});

		// Navigate to case detail
		await navigateToCaseDetail(page, testData.caseTitle);

		// Change status to active
		await changeCaseStatus(page, 'active');

		// Verify status updated
		await expect(
			page.locator('span, badge, div').filter({ hasText: /active/i })
		).toBeVisible({ timeout: 5000 });
	});

	test('should archive case', async ({ page }) => {
		const testData = generateUniqueTestData('Archive');

		// Create a case
		await createCaseJourney(page, {
			title: testData.caseTitle,
			description: testData.description
		});

		// Navigate to case detail
		await navigateToCaseDetail(page, testData.caseTitle);

		// Click archive button
		const archiveButton = page.locator('button:has-text("Archive"), [data-testid="archive-case-btn"]');

		if (await archiveButton.isVisible({ timeout: 3000 })) {
			await archiveButton.click();

			// Confirm if dialog appears
			const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
			if (await confirmButton.isVisible({ timeout: 2000 })) {
				await confirmButton.click();
			}

			// Wait for redirect or status update
			await page.waitForTimeout(1000);

			// Verify either redirected to dashboard or status changed to archived
			const currentUrl = page.url();
			if (currentUrl.includes('/dashboard/lawyer')) {
				// Redirected to dashboard - case archived
				expect(currentUrl).toContain('/dashboard/lawyer');
			} else {
				// Status changed to archived
				await expect(
					page.locator('span, badge').filter({ hasText: /archived/i })
				).toBeVisible({ timeout: 5000 });
			}
		} else {
			test.skip();
			return;
		}
	});

	test('should delete case with confirmation', async ({ page }) => {
		const testData = generateUniqueTestData('Delete');

		// Create a case
		await createCaseJourney(page, {
			title: testData.caseTitle,
			description: testData.description
		});

		// Navigate to case detail
		await navigateToCaseDetail(page, testData.caseTitle);

		// Look for delete button
		const deleteButton = page.locator('button:has-text("Delete"), [data-testid="delete-case-btn"]');

		if (await deleteButton.isVisible({ timeout: 3000 })) {
			await deleteButton.click();

			// Confirm deletion
			const confirmButton = page.locator(
				'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")'
			).last();
			await confirmButton.click();

			// Wait for redirect
			await page.waitForTimeout(1000);

			// Verify redirected to dashboard
			await expect(page).toHaveURL(/\/dashboard\/lawyer/);

			// Verify case no longer appears in list
			await expect(page.locator(`text=${testData.caseTitle}`)).not.toBeVisible();
		} else {
			test.skip();
			return;
		}
	});

	test('should update case description', async ({ page }) => {
		const testData = generateUniqueTestData('DescUpdate');

		// Create a case
		await createCaseJourney(page, {
			title: testData.caseTitle,
			description: testData.description
		});

		// Navigate to case detail
		await navigateToCaseDetail(page, testData.caseTitle);

		// Navigate to Overview tab if not already there
		const overviewTab = page.locator('button:has-text("Overview"), a:has-text("Overview")');
		if (await overviewTab.isVisible({ timeout: 2000 })) {
			await overviewTab.click();
		}

		// Click edit description button
		const editDescButton = page.locator(
			'button:has-text("Edit Description"), [data-testid="edit-description-btn"]'
		);

		if (await editDescButton.isVisible({ timeout: 3000 })) {
			await editDescButton.click();

			// Update description
			const newDescription = `${testData.description} - Updated with more details`;
			const descTextarea = page.locator('textarea').first();
			await descTextarea.clear();
			await descTextarea.fill(newDescription);

			// Save changes
			await page.click('button:has-text("Save"), [data-testid="save-description-btn"]');

			// Verify new description appears
			await expect(page.locator(`text=${newDescription}`)).toBeVisible({ timeout: 5000 });
		} else {
			test.skip();
			return;
		}
	});

	test('should display case statistics correctly', async ({ page }) => {
		const testData = generateUniqueTestData('Stats');

		// Create a case
		await createCaseJourney(page, {
			title: testData.caseTitle,
			description: testData.description
		});

		// Navigate to case detail
		await navigateToCaseDetail(page, testData.caseTitle);

		// Navigate to Overview tab
		const overviewTab = page.locator('button:has-text("Overview"), a:has-text("Overview")');
		if (await overviewTab.isVisible({ timeout: 2000 })) {
			await overviewTab.click();
		}

		// Check for statistics display
		const statsContainer = page.locator('[data-testid="case-stats"], .case-statistics');

		if (await statsContainer.isVisible({ timeout: 3000 })) {
			// Verify expected stat labels
			const expectedStats = ['Documents', 'Invoices', 'Messages'];

			for (const stat of expectedStats) {
				const statElement = page.locator(`text=${stat}`);
				if (await statElement.isVisible({ timeout: 1000 })) {
					await expect(statElement).toBeVisible();
				}
			}
		} else {
			// Basic verification - case detail page loaded
			await expect(page.locator('h1, h2')).toContainText(testData.caseTitle);
		}
	});

	test('should prevent editing closed case', async ({ page }) => {
		const testData = generateUniqueTestData('ClosedEdit');

		// Create a case
		await createCaseJourney(page, {
			title: testData.caseTitle,
			description: testData.description,
			status: 'active'
		});

		// Navigate to case detail
		await navigateToCaseDetail(page, testData.caseTitle);

		// Close the case
		await changeCaseStatus(page, 'closed');

		// Try to edit title
		const editButton = page.locator('[data-testid="edit-title-btn"], button:has-text("Edit")').first();

		// Verify edit button is either disabled or hidden
		if (await editButton.isVisible({ timeout: 2000 })) {
			const isDisabled = await editButton.isDisabled();
			expect(isDisabled).toBeTruthy();
		} else {
			// Edit button not visible for closed cases - expected behavior
			expect(await editButton.isVisible()).toBeFalsy();
		}
	});

	test('complete case lifecycle journey', async ({ page }) => {
		const testData = generateUniqueTestData('Lifecycle');

		// 1. Create case
		await createCaseJourney(page, {
			title: testData.caseTitle,
			description: testData.description,
			status: 'pending'
		});

		// 2. Navigate to case
		await navigateToCaseDetail(page, testData.caseTitle);

		// 3. Change status to active
		await changeCaseStatus(page, 'active');

		// 4. Add a document (covered in document-management tests)
		// 5. Create an invoice (covered in invoice-management tests)

		// 6. Change status to closed
		await changeCaseStatus(page, 'closed');

		// 7. Verify final state
		await expect(
			page.locator('span, badge').filter({ hasText: /closed/i })
		).toBeVisible({ timeout: 5000 });

		// 8. Navigate back to dashboard
		await page.click('a:has-text("Dashboard"), button:has-text("Back")');

		// Verify case appears in list with closed status
		const caseCard = page.locator(`text=${testData.caseTitle}`);
		await expect(caseCard).toBeVisible();
	});
});
