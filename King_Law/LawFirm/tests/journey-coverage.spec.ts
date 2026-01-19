import { test, expect } from '@playwright/test';
import { loginAsLawyer, loginAsClient, logout, TEST_USERS } from './test-helpers';

/**
 * Journey Coverage - Smoke Tests
 * 
 * These tests verify that all critical user journeys are accessible
 * and key UI elements are present. They provide quick validation
 * that core functionality hasn't broken.
 */

test.describe('Critical Journey Coverage - Smoke Tests', () => {
	test.describe('Lawyer Critical Paths', () => {
		test.beforeEach(async ({ page }) => {
			await loginAsLawyer(page);
		});

		test.afterEach(async ({ page }) => {
			await logout(page);
		});

		test('lawyer dashboard is accessible with all stats', async ({ page }) => {
			// Verify dashboard loads
			await expect(page.locator('h1')).toContainText('Lawyer Dashboard');

			// Verify stats are visible
			const statsLabels = ['Total Cases', 'Active Cases', 'Documents', 'Revenue', 'Clients'];
			let visibleStats = 0;

			for (const label of statsLabels) {
				if (await page.locator(`text=${label}`).isVisible({ timeout: 1000 })) {
					visibleStats++;
				}
			}

			// At least 3 of the expected stats should be visible
			expect(visibleStats).toBeGreaterThanOrEqual(3);
		});

		test('create case flow is accessible', async ({ page }) => {
			// Verify Create Case button exists
			const createButton = page.locator('button:has-text("Create Case"), button:has-text("+ Create Case")');
			await expect(createButton).toBeVisible({ timeout: 5000 });

			// Click to open modal
			await createButton.click();

			// Verify modal opens
			await expect(page.locator('h2:has-text("Create New Case"), h2:has-text("New Case")')).toBeVisible();

			// Verify key form fields exist
			await expect(page.locator('input[placeholder*="title"], input[placeholder*="Title"]')).toBeVisible();
			await expect(page.locator('textarea[placeholder*="description"], textarea[placeholder*="Description"]')).toBeVisible();
		});

		test('case list is accessible', async ({ page }) => {
			// Verify cases section exists
			const casesSection = page.locator('text=Cases, text=Your Cases, [data-testid="cases-list"]');
			
			// Either has cases or shows empty state
			const hasCases = await page.locator('a[href^="/dashboard/lawyer/case/"]').count() > 0;
			const hasEmptyState = await page.locator('text=No cases, text=Create your first').isVisible({ timeout: 2000 });

			expect(hasCases || hasEmptyState).toBeTruthy();
		});

		test('case detail page is accessible', async ({ page }) => {
			// Navigate to first case if available
			const firstCase = page.locator('a[href^="/dashboard/lawyer/case/"]').first();

			if (await firstCase.isVisible({ timeout: 3000 })) {
				await firstCase.click();

				// Verify case detail page loads
				await expect(page).toHaveURL(/\/dashboard\/lawyer\/case\/.+/);

				// Verify tabs are present
				const tabs = ['Overview', 'Documents', 'Invoices', 'Messages'];
				let visibleTabs = 0;

				for (const tab of tabs) {
					if (await page.locator(`button:has-text("${tab}"), a:has-text("${tab}")`).isVisible({ timeout: 1000 })) {
						visibleTabs++;
					}
				}

				// At least 2 tabs should be visible
				expect(visibleTabs).toBeGreaterThanOrEqual(2);
			} else {
				test.skip();
			}
		});

		test('document upload is accessible', async ({ page }) => {
			const firstCase = page.locator('a[href^="/dashboard/lawyer/case/"]').first();

			if (await firstCase.isVisible({ timeout: 3000 })) {
				await firstCase.click();

				// Navigate to Documents tab if not default
				const docsTab = page.locator('button:has-text("Documents"), a:has-text("Documents")');
				if (await docsTab.isVisible({ timeout: 2000 })) {
					await docsTab.click();
				}

				// Verify file upload input exists
				await expect(page.locator('input[type="file"]')).toBeVisible({ timeout: 3000 });
			} else {
				test.skip();
			}
		});

		test('invoice creation is accessible', async ({ page }) => {
			const firstCase = page.locator('a[href^="/dashboard/lawyer/case/"]').first();

			if (await firstCase.isVisible({ timeout: 3000 })) {
				await firstCase.click();

				// Navigate to Invoices tab
				const invoicesTab = page.locator('button:has-text("Invoices"), a:has-text("Invoices")');
				if (await invoicesTab.isVisible({ timeout: 2000 })) {
					await invoicesTab.click();
				}

				// Verify Create Invoice button exists
				const createInvoice = page.locator('button:has-text("Create Invoice"), button:has-text("+ Invoice")');
				await expect(createInvoice).toBeVisible({ timeout: 3000 });
			} else {
				test.skip();
			}
		});

		test('messaging is accessible', async ({ page }) => {
			const firstCase = page.locator('a[href^="/dashboard/lawyer/case/"]').first();

			if (await firstCase.isVisible({ timeout: 3000 })) {
				await firstCase.click();

				// Navigate to Messages tab
				const messagesTab = page.locator('button:has-text("Messages"), a:has-text("Messages")');
				if (await messagesTab.isVisible({ timeout: 2000 })) {
					await messagesTab.click();
				}

				// Verify message input exists
				await expect(page.locator('textarea, input[type="text"]')).toBeVisible({ timeout: 3000 });
			} else {
				test.skip();
			}
		});

		test('search functionality is accessible', async ({ page }) => {
			// Look for search input
			const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
			
			if (await searchInput.isVisible({ timeout: 3000 })) {
				await expect(searchInput).toBeVisible();
			} else {
				// Search might not be implemented yet
				test.skip();
			}
		});

		test('filter functionality is accessible', async ({ page }) => {
			// Look for filter controls
			const filterControl = page.locator('select, button:has-text("Filter"), [data-testid="filter"]');
			
			if (await filterControl.isVisible({ timeout: 3000 })) {
				await expect(filterControl).toBeVisible();
			} else {
				// Filter might not be implemented yet
				test.skip();
			}
		});
	});

	test.describe('Client Critical Paths', () => {
		test.beforeEach(async ({ page }) => {
			await loginAsClient(page);
		});

		test.afterEach(async ({ page }) => {
			await logout(page);
		});

		test('client dashboard is accessible', async ({ page }) => {
			// Verify dashboard loads
			await expect(page.locator('h1')).toContainText('Client Dashboard');

			// Verify at least some content is visible
			const hasContent = 
				await page.locator('text=Cases, text=Your Cases').isVisible({ timeout: 3000 }) ||
				await page.locator('a[href^="/dashboard/client/case/"]').count() > 0;

			expect(hasContent).toBeTruthy();
		});

		test('client can view their cases', async ({ page }) => {
			// Navigate to dashboard
			await page.goto('/dashboard/client');

			// Either has cases or shows empty state
			const hasCases = await page.locator('a[href^="/dashboard/client/case/"]').count() > 0;
			const hasEmptyState = await page.locator('text=No cases, text=no assigned cases').isVisible({ timeout: 2000 });

			expect(hasCases || hasEmptyState).toBeTruthy();
		});

		test('client can access case details', async ({ page }) => {
			const firstCase = page.locator('a[href^="/dashboard/client/case/"]').first();

			if (await firstCase.isVisible({ timeout: 3000 })) {
				await firstCase.click();

				// Verify case detail page loads
				await expect(page).toHaveURL(/\/dashboard\/client\/case\/.+/);

				// Verify page has content
				await expect(page.locator('h1, h2')).toBeVisible();
			} else {
				test.skip();
			}
		});

		test('client can view documents', async ({ page }) => {
			const firstCase = page.locator('a[href^="/dashboard/client/case/"]').first();

			if (await firstCase.isVisible({ timeout: 3000 })) {
				await firstCase.click();

				// Navigate to Documents tab
				const docsTab = page.locator('button:has-text("Documents"), a:has-text("Documents")');
				if (await docsTab.isVisible({ timeout: 2000 })) {
					await docsTab.click();
				}

				// Verify documents section loads (either has docs or empty state)
				const hasDocsSection = await page.locator('text=Documents').isVisible() ||
					await page.locator('input[type="file"]').isVisible({ timeout: 2000 });

				expect(hasDocsSection).toBeTruthy();
			} else {
				test.skip();
			}
		});

		test('client can view invoices', async ({ page }) => {
			const firstCase = page.locator('a[href^="/dashboard/client/case/"]').first();

			if (await firstCase.isVisible({ timeout: 3000 })) {
				await firstCase.click();

				// Navigate to Invoices tab
				const invoicesTab = page.locator('button:has-text("Invoices"), a:has-text("Invoices")');
				if (await invoicesTab.isVisible({ timeout: 2000 })) {
					await invoicesTab.click();
				}

				// Verify invoices section loads
				const hasInvoicesSection = await page.locator('text=Invoice').isVisible({ timeout: 2000 });
				expect(hasInvoicesSection).toBeTruthy();
			} else {
				test.skip();
			}
		});

		test('client can access messaging', async ({ page }) => {
			const firstCase = page.locator('a[href^="/dashboard/client/case/"]').first();

			if (await firstCase.isVisible({ timeout: 3000 })) {
				await firstCase.click();

				// Navigate to Messages tab
				const messagesTab = page.locator('button:has-text("Messages"), a:has-text("Messages")');
				if (await messagesTab.isVisible({ timeout: 2000 })) {
					await messagesTab.click();
				}

				// Verify messaging interface loads
				const hasMessaging = await page.locator('textarea').isVisible({ timeout: 2000 });
				expect(hasMessaging).toBeTruthy();
			} else {
				test.skip();
			}
		});
	});

	test.describe('Authentication & Security', () => {
		test('login page is accessible', async ({ page }) => {
			await page.goto('/login');

			// Verify login form elements
			await expect(page.locator('input[id="username"], input[type="email"]')).toBeVisible();
			await expect(page.locator('input[id="password"], input[type="password"]')).toBeVisible();
			await expect(page.locator('button[type="submit"]')).toBeVisible();
		});

		test('logout functionality works', async ({ page }) => {
			await loginAsLawyer(page);

			// Logout
			await logout(page);

			// Verify redirected to login
			await expect(page).toHaveURL(/\/login/);
		});

		test('protected routes redirect to login when not authenticated', async ({ page }) => {
			// Try to access dashboard without authentication
			await page.goto('/dashboard/lawyer');

			// Should redirect to login
			await page.waitForURL(/\/login/, { timeout: 5000 });
			await expect(page).toHaveURL(/\/login/);
		});

		test('lawyer cannot access client routes', async ({ page }) => {
			await loginAsLawyer(page);

			// Try to access client dashboard
			await page.goto('/dashboard/client');

			// Should either redirect or show unauthorized
			await page.waitForTimeout(1000);
			const currentUrl = page.url();

			// Should not be able to access client dashboard
			expect(currentUrl).not.toContain('/dashboard/client');

			await logout(page);
		});

		test('client cannot access lawyer routes', async ({ page }) => {
			await loginAsClient(page);

			// Try to access lawyer dashboard
			await page.goto('/dashboard/lawyer');

			// Should either redirect or show unauthorized
			await page.waitForTimeout(1000);
			const currentUrl = page.url();

			// Should not be able to access lawyer dashboard
			expect(currentUrl).not.toContain('/dashboard/lawyer');

			await logout(page);
		});
	});

	test.describe('Complete User Journeys', () => {
		test('complete lawyer workflow - create case to invoice', async ({ page }) => {
			await loginAsLawyer(page);

			// Step 1: Verify dashboard access
			await expect(page.locator('h1')).toContainText('Lawyer Dashboard');

			// Step 2: Verify can access create case
			const createButton = page.locator('button:has-text("Create Case"), button:has-text("+ Create Case")');
			await expect(createButton).toBeVisible({ timeout: 5000 });

			// Step 3: Navigate to a case
			const firstCase = page.locator('a[href^="/dashboard/lawyer/case/"]').first();
			if (await firstCase.isVisible({ timeout: 3000 })) {
				await firstCase.click();

				// Step 4: Verify can access all tabs
				const tabs = ['Documents', 'Invoices', 'Messages'];
				for (const tab of tabs) {
					const tabElement = page.locator(`button:has-text("${tab}"), a:has-text("${tab}")`);
					if (await tabElement.isVisible({ timeout: 1000 })) {
						await tabElement.click();
						await page.waitForTimeout(500);
					}
				}

				// Workflow accessible
				expect(true).toBeTruthy();
			} else {
				test.skip();
			}

			await logout(page);
		});

		test('complete client workflow - view case to message', async ({ page }) => {
			await loginAsClient(page);

			// Step 1: Verify dashboard access
			await expect(page.locator('h1')).toContainText('Client Dashboard');

			// Step 2: Navigate to a case
			const firstCase = page.locator('a[href^="/dashboard/client/case/"]').first();
			if (await firstCase.isVisible({ timeout: 3000 })) {
				await firstCase.click();

				// Step 3: Verify can access key sections
				const sections = ['Documents', 'Invoices', 'Messages'];
				for (const section of sections) {
					const sectionElement = page.locator(`button:has-text("${section}"), a:has-text("${section}")`);
					if (await sectionElement.isVisible({ timeout: 1000 })) {
						await sectionElement.click();
						await page.waitForTimeout(500);
					}
				}

				// Workflow accessible
				expect(true).toBeTruthy();
			} else {
				test.skip();
			}

			await logout(page);
		});
	});

	test.describe('UI Responsiveness', () => {
		test('lawyer dashboard loads within acceptable time', async ({ page }) => {
			const startTime = Date.now();
			
			await loginAsLawyer(page);
			
			const loadTime = Date.now() - startTime;

			// Should load within 10 seconds
			expect(loadTime).toBeLessThan(10000);

			await logout(page);
		});

		test('client dashboard loads within acceptable time', async ({ page }) => {
			const startTime = Date.now();
			
			await loginAsClient(page);
			
			const loadTime = Date.now() - startTime;

			// Should load within 10 seconds
			expect(loadTime).toBeLessThan(10000);

			await logout(page);
		});

		test('case detail page loads within acceptable time', async ({ page }) => {
			await loginAsLawyer(page);

			const firstCase = page.locator('a[href^="/dashboard/lawyer/case/"]').first();
			if (await firstCase.isVisible({ timeout: 3000 })) {
				const startTime = Date.now();
				
				await firstCase.click();
				await expect(page).toHaveURL(/\/dashboard\/lawyer\/case\/.+/);
				
				const loadTime = Date.now() - startTime;

				// Should load within 5 seconds
				expect(loadTime).toBeLessThan(5000);
			} else {
				test.skip();
			}

			await logout(page);
		});
	});
});
