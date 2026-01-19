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
	}
};

export async function loginAsLawyer(page: Page) {
	await page.goto('/login');
	await page.fill('input[id="username"]', TEST_USERS.lawyer.email);
	await page.fill('input[id="password"]', TEST_USERS.lawyer.password);
	await page.click('button[type="submit"]');
	await page.waitForURL('/dashboard/lawyer', { timeout: 10000 });
	await expect(page.locator('h1')).toContainText('Lawyer Dashboard');
}

export async function loginAsClient(page: Page) {
	await page.goto('/login');
	await page.fill('input[id="username"]', TEST_USERS.client.email);
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
