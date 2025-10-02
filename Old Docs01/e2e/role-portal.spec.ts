import { test, expect } from '@playwright/test';
import { createUser, getUserByEmail, deleteUser } from './firebase-auth.utils';

// Test users for different roles
const testUsers = {
  owner: `owner_${Date.now()}@example.com`,
  familyMember: `family_${Date.now()}@example.com`,
  viewer: `viewer_${Date.now()}@example.com`,
  funeralDirector: `fd_${Date.now()}@example.com`
};

const password = 'password123';

test.describe('Role-Based Portal System', () => {
  test.beforeAll(async () => {
    // Create test users for all roles
    for (const email of Object.values(testUsers)) {
      await createUser(email, password);
    }
  });

  test.afterAll(async () => {
    // Clean up test users
    for (const email of Object.values(testUsers)) {
      const user = await getUserByEmail(email);
      if (user) {
        await deleteUser(user.localId);
      }
    }
  });

  test('Portal routing redirects unauthenticated users', async ({ page }) => {
    await page.goto('/my-portal');
    
    // Should redirect to login or home
    await expect(page).toHaveURL(/\/(login|$)/);
  });

  test('Owner portal displays correctly', async ({ page }) => {
    // Login as owner
    await page.goto('/login');
    await page.fill('#email', testUsers.owner);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    
    // Navigate to portal
    await page.goto('/my-portal');
    
    // Check for owner-specific elements
    await expect(page.locator('text=Owner Portal')).toBeVisible();
    await expect(page.locator('text=Memorial Management')).toBeVisible();
    await expect(page.locator('text=Create Memorial')).toBeVisible();
    await expect(page.locator('text=Manage Invitations')).toBeVisible();
  });

  test('Family member portal displays correctly', async ({ page }) => {
    // Login as family member
    await page.goto('/login');
    await page.fill('#email', testUsers.familyMember);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    
    // Navigate to portal
    await page.goto('/my-portal');
    
    // Check for family member-specific elements
    await expect(page.locator('text=Family Member Portal')).toBeVisible();
    await expect(page.locator('text=Invited Memorials')).toBeVisible();
  });

  test('Viewer portal displays correctly', async ({ page }) => {
    // Login as viewer
    await page.goto('/login');
    await page.fill('#email', testUsers.viewer);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    
    // Navigate to portal
    await page.goto('/my-portal');
    
    // Check for viewer-specific elements
    await expect(page.locator('text=Viewer Portal')).toBeVisible();
    await expect(page.locator('text=Followed Memorials')).toBeVisible();
    await expect(page.locator('text=Discover Memorials')).toBeVisible();
  });

  test('Funeral director portal displays correctly', async ({ page }) => {
    // Login as funeral director
    await page.goto('/login');
    await page.fill('#email', testUsers.funeralDirector);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    
    // Navigate to portal
    await page.goto('/my-portal');
    
    // Check for funeral director-specific elements
    await expect(page.locator('text=Funeral Director Portal')).toBeVisible();
    await expect(page.locator('text=Assigned Memorials')).toBeVisible();
    await expect(page.locator('text=Livestream Management')).toBeVisible();
    await expect(page.locator('text=Create Memorial')).toBeVisible();
  });

  test('Portal navigation works correctly', async ({ page }) => {
    // Login as owner
    await page.goto('/login');
    await page.fill('#email', testUsers.owner);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    
    // Navigate to portal
    await page.goto('/my-portal');
    
    // Test navigation elements
    await expect(page.locator('a[href="/app/calculator"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible(); // Logout button
  });

  test('Unauthorized role access is prevented', async ({ page }) => {
    // Login as viewer
    await page.goto('/login');
    await page.fill('#email', testUsers.viewer);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    
    // Try to access owner-specific functionality
    await page.goto('/my-portal/tributes/test-memorial/edit');
    
    // Should show error or redirect
    await expect(page.locator('text=Access Denied')).toBeVisible().catch(() => {
      // Alternative: check if redirected away from edit page
      expect(page.url()).not.toContain('/edit');
    });
  });
});
