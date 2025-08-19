import { test, expect } from '@playwright/test';
import { createUser, getUserByEmail, deleteUser } from './firebase-auth.utils';

const uniqueEmail = `testuser_${Date.now()}@example.com`;
const password = 'password123';

test.beforeEach(async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
});

test.afterEach(async () => {
  const user = await getUserByEmail(uniqueEmail);
  if (user) {
    await deleteUser(user.localId);
  }
});

test('Registration', async ({ page }) => {
  await expect(page.locator('#homePage')).toBeVisible();
  await page.click('#navRegisterBtn');
  await expect(page.locator('#registerPage')).toBeVisible();

  await page.fill('#registerEmail', uniqueEmail);
  await page.fill('#registerPassword', password);
  await page.fill('#registerConfirmPassword', password);
  await page.click('#registerForm button[type="submit"]');

  await expect(page.locator('#messageText')).toHaveText('Account created successfully! Please login.');
  await page.click('#messageCloseBtn');
  await expect(page.locator('#loginPage')).toBeVisible();

  const user = await getUserByEmail(uniqueEmail);
  expect(user).toBeTruthy();
  expect(user.email).toBe(uniqueEmail);
});

test.describe('Login and Logout', () => {
  test.beforeAll(async () => {
    await createUser(uniqueEmail, password);
  });

  test.afterAll(async () => {
    const user = await getUserByEmail(uniqueEmail);
    if (user) {
      await deleteUser(user.localId);
    }
  });

  test('Login', async ({ page }) => {
    await page.click('#navLoginBtn');
    await expect(page.locator('#loginPage')).toBeVisible();

    await page.fill('#loginEmail', uniqueEmail);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');

    await expect(page.locator('#messageText')).toHaveText(`Logged in as ${uniqueEmail}!`);
    await page.click('#messageCloseBtn');
    await expect(page.locator('#portalWelcomeMessage')).toContainText(`Welcome, ${uniqueEmail}`);
  });

  test('Logout', async ({ page }) => {
    // First, log in the user
    await page.click('#navLoginBtn');
    await page.fill('#loginEmail', uniqueEmail);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    await page.click('#messageCloseBtn');
    await page.waitForSelector('#portalWelcomeMessage', { state: 'visible' });
    await expect(page.locator('#portalWelcomeMessage')).toBeVisible();

    // Now, log out
    await page.click('#navLogoutBtn');
    await expect(page.locator('#messageText')).toHaveText('Are you sure you want to log out?');
    await page.click('#messageConfirmBtn');
    
    await expect(page.locator('#messageText')).toHaveText('You have been logged out.');
    await page.click('#messageCloseBtn');
    await expect(page.locator('#homePage')).toBeVisible();
  });
});