import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate as owner', async ({ page }) => {
  // Perform authentication steps
  await page.goto('/login');
  
  // Fill in the form fields using exact labels
  await page.getByLabel('Email').fill('owner@test.com');
  await page.getByLabel('Password').fill('test123');
  
  // Click the Sign In button and wait for navigation
  await Promise.all([
    page.waitForURL('/my-portal'), // Users without custom claims go to my-portal
    page.getByRole('button', { name: 'Sign In', exact: true }).click()
  ]);
  
  // Ensure the page has fully loaded
  await page.waitForLoadState('networkidle');
  
  // End of authentication steps
  await page.context().storageState({ path: authFile });
});

setup('authenticate as funeral director', async ({ page }) => {
  await page.goto('/login');
  
  // Fill in the form fields using exact labels
  await page.getByLabel('Email').fill('director@test.com');
  await page.getByLabel('Password').fill('test123');
  
  // Click the Sign In button and wait for navigation
  await Promise.all([
    page.waitForURL('/my-portal'), // Users without custom claims go to my-portal
    page.getByRole('button', { name: 'Sign In', exact: true }).click()
  ]);
  
  // Ensure the page has fully loaded
  await page.waitForLoadState('networkidle');
  
  await page.context().storageState({ path: 'playwright/.auth/director.json' });
});

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  
  // Fill in the form fields using exact labels
  await page.getByLabel('Email').fill('admin@test.com');
  await page.getByLabel('Password').fill('test123');
  
  // Click the Sign In button and wait for navigation
  await Promise.all([
    page.waitForURL('/my-portal'), // Admin without custom claims also goes to my-portal
    page.getByRole('button', { name: 'Sign In', exact: true }).click()
  ]);
  
  // Ensure the page has fully loaded
  await page.waitForLoadState('networkidle');
  
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
});
