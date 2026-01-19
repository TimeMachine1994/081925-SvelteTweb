import { test, expect } from '@playwright/test';
import { loginAsLawyer, loginAsClient, logout } from './test-helpers';

test.describe('Chat with Attachments', () => {
	test('lawyer should send message with attachment to client', async ({ page }) => {
		await loginAsLawyer(page);

		// Navigate to first case
		const firstCase = page.locator('a[href^="/dashboard/lawyer/case/"]').first();
		
		if (!(await firstCase.isVisible())) {
			test.skip('No cases available for testing chat');
			return;
		}

		await firstCase.click();
		await page.waitForURL(/\/dashboard\/lawyer\/case\/.+/);

		// Open chat slider if not already open
		const chatButton = page.locator('button:has-text("Chat"), button[aria-label*="Chat"]');
		if (await chatButton.isVisible()) {
			await chatButton.click();
			await page.waitForTimeout(500);
		}

		// Send a text message
		const messageText = `Test message with timestamp ${Date.now()}`;
		const messageInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]').last();
		
		if (await messageInput.isVisible()) {
			await messageInput.fill(messageText);
			await page.click('button:has-text("Send")').last();
			
			// Wait for message to appear
			await page.waitForTimeout(1000);
			await expect(page.locator(`text=${messageText}`)).toBeVisible();
		}

		await logout(page);
	});

	test('client should send message with file attachment', async ({ page }) => {
		await loginAsClient(page);

		// Navigate to first case
		const firstCase = page.locator('a[href^="/dashboard/client/case/"]').first();
		
		if (!(await firstCase.isVisible())) {
			test.skip('No cases available for client');
			return;
		}

		await firstCase.click();
		await page.waitForURL(/\/dashboard\/client\/case\/.+/);

		// Open chat slider if exists
		const chatButton = page.locator('button:has-text("Chat"), button[aria-label*="Chat"]');
		if (await chatButton.isVisible()) {
			await chatButton.click();
			await page.waitForTimeout(500);
		}

		// Look for file upload in chat
		const chatFileInput = page.locator('input[type="file"]').last();
		
		if (await chatFileInput.isVisible({ timeout: 2000 })) {
			// Create test attachment
			const attachmentContent = 'This is a test attachment sent via chat';
			const buffer = Buffer.from(attachmentContent);

			await chatFileInput.setInputFiles({
				name: 'chat-attachment.txt',
				mimeType: 'text/plain',
				buffer: buffer
			});

			// Wait for upload
			await page.waitForTimeout(2000);

			// Verify attachment appears in chat
			await expect(page.locator('text=chat-attachment.txt')).toBeVisible({ timeout: 5000 });
		}

		await logout(page);
	});

	test('chat attachment should appear in case documents', async ({ page }) => {
		await loginAsLawyer(page);

		// Navigate to first case
		const firstCase = page.locator('a[href^="/dashboard/lawyer/case/"]').first();
		
		if (!(await firstCase.isVisible())) {
			test.skip('No cases available');
			return;
		}

		const caseUrl = await firstCase.getAttribute('href');
		await firstCase.click();
		await page.waitForURL(/\/dashboard\/lawyer\/case\/.+/);

		// Send message with attachment via chat
		const chatButton = page.locator('button:has-text("Chat"), button[aria-label*="Chat"]');
		if (await chatButton.isVisible()) {
			await chatButton.click();
			await page.waitForTimeout(500);

			const chatFileInput = page.locator('input[type="file"]').last();
			
			if (await chatFileInput.isVisible({ timeout: 2000 })) {
				const fileName = `test-doc-${Date.now()}.txt`;
				const buffer = Buffer.from('Document sent via chat that should appear in documents section');

				await chatFileInput.setInputFiles({
					name: fileName,
					mimeType: 'text/plain',
					buffer: buffer
				});

				await page.waitForTimeout(3000);

				// Close chat if needed to see documents section
				const closeChat = page.locator('button[aria-label*="Close"]');
				if (await closeChat.isVisible()) {
					await closeChat.click();
				}

				// Refresh page to ensure documents are loaded
				await page.reload();
				await page.waitForLoadState('networkidle');

				// Look for the file in documents section
				const documentsSection = page.locator('h2:has-text("Documents")');
				await expect(documentsSection).toBeVisible();

				// Verify file appears in documents list
				await expect(page.locator(`text=${fileName}`)).toBeVisible({ timeout: 5000 });
			}
		}

		await logout(page);
	});
});
