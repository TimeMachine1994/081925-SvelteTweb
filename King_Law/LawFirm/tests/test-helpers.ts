import { expect, type Page } from '@playwright/test';

export const TEST_USERS = {
	lawyer: {
		email: 'lawyer@test.com',
		password: 'TestPassword123!',
		firstName: 'Ben',
		lastName: 'King',
		role: 'lawyer'
	},
	client: {
		email: 'client@test.com',
		password: 'TestPassword123!',
		firstName: 'John',
		lastName: 'Doe',
		role: 'client'
	},
	noCasesClient: {
		email: 'nocases@test.com',
		password: 'TestPassword123!',
		firstName: 'NoCases',
		lastName: 'TestClient',
		role: 'client'
	}
};

export const TEST_PREFIX = 'E2E_TEST_';

export async function loginAsLawyer(page: Page) {
	await page.goto('/login');
	await page.fill('input[id="username"]', 'lawyer@test.com');
	await page.fill('input[id="password"]', TEST_USERS.lawyer.password);
	await page.click('button[type="submit"]');
	await page.waitForURL('/dashboard/lawyer', { timeout: 10000 });
	await expect(page.locator('h1')).toContainText('Lawyer Dashboard');
}

export async function loginAsClient(page: Page) {
	await page.goto('/login');
	await page.fill('input[id="username"]', 'client@test.com');
	await page.fill('input[id="password"]', TEST_USERS.client.password);
	await page.click('button[type="submit"]');
	await page.waitForURL('/dashboard/client', { timeout: 10000 });
	await expect(page.locator('h1')).toContainText('Client Dashboard');
}

export async function logout(page: Page) {
	await page.click('button:has-text("Logout")');
	await page.waitForURL('/login');
}

export function generateTestCaseTitle(): string {
	return `Test Case ${Date.now()}`;
}

export function generateTestInvoiceDescription(): string {
	return `Test Invoice ${Date.now()}`;
}

export async function waitForToast(page: Page, message: string) {
	await expect(page.locator(`text=${message}`)).toBeVisible({ timeout: 5000 });
}

export async function loginAsNoCasesClient(page: Page) {
	await page.goto('/login');
	await page.fill('input[id="username"]', 'nocases');
	await page.fill('input[id="password"]', TEST_USERS.noCasesClient.password);
	await page.click('button[type="submit"]');
	await page.waitForURL('/dashboard/client', { timeout: 10000 });
}

export function generateE2ETestData() {
	const timestamp = Date.now();
	return {
		messageContent: `${TEST_PREFIX}Message content ${timestamp}`,
		caseTitle: `${TEST_PREFIX}Case ${timestamp}`,
		fileName: `${TEST_PREFIX}file-${timestamp}.txt`
	};
}

export async function cleanupTestData(page: Page, options?: { prefix?: string; userId?: string }) {
	// Login as lawyer to get auth cookie
	await page.goto('/login');
	await page.fill('input[id="username"]', 'lawyer@test.com');
	await page.fill('input[id="password"]', TEST_USERS.lawyer.password);
	await page.click('button[type="submit"]');
	await page.waitForURL('/dashboard/lawyer', { timeout: 10000 });

	// Call cleanup API
	const response = await page.request.post('/api/admin/test-cleanup', {
		data: {
			prefix: options?.prefix || TEST_PREFIX,
			userId: options?.userId
		}
	});

	return response.json();
}
