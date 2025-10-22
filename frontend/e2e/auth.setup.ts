import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate as owner', async ({ page }) => {
  // Perform authentication steps
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('owner@test.com');
  await page.getByLabel(/password/i).fill('test123');
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait until the page receives the cookies
  await page.waitForURL('/profile');
  
  // End of authentication steps
  await page.context().storageState({ path: authFile });
});

setup('authenticate as funeral director', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('director@test.com');
  await page.getByLabel(/password/i).fill('test123');
  await page.getByRole('button', { name: /sign in/i }).click();
  
  await page.waitForURL('/funeral-director-portal');
  
  await page.context().storageState({ path: 'playwright/.auth/director.json' });
});

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@test.com');
  await page.getByLabel(/password/i).fill('test123');
  await page.getByRole('button', { name: /sign in/i }).click();
  
  await page.waitForURL('/admin');
  
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
});
