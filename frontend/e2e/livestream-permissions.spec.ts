import { test, expect } from '@playwright/test';
import { createUser, getUserByEmail, deleteUser } from './firebase-auth.utils';

const testUsers = {
  owner: `owner_stream_${Date.now()}@example.com`,
  funeralDirector: `fd_stream_${Date.now()}@example.com`,
  familyMember: `family_stream_${Date.now()}@example.com`,
  viewer: `viewer_stream_${Date.now()}@example.com`
};

const password = 'password123';

test.describe('Livestream Control Permissions', () => {
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

  test('Owner can access livestream controls', async ({ page }) => {
    // Login as owner
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.owner);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to owner portal
    await page.goto('/my-portal');
    
    // Should see livestream management section
    await expect(page.locator('text=Livestream Management')).toBeVisible();
    
    // Should have start/stop controls
    await expect(page.locator('button:has-text("Start Stream")')).toBeVisible();
    await expect(page.locator('button:has-text("Stop Stream")')).toBeVisible();
  });

  test('Funeral Director can access livestream controls for assigned memorials', async ({ page }) => {
    // Login as funeral director
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.funeralDirector);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to funeral director portal
    await page.goto('/my-portal');
    
    // Should see livestream management section
    await expect(page.locator('text=Livestream Management')).toBeVisible();
    
    // Should have livestream controls for assigned memorials
    await expect(page.locator('text=Livestream Control')).toBeVisible();
  });

  test('Family Member cannot access livestream controls', async ({ page }) => {
    // Login as family member
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.familyMember);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to family member portal
    await page.goto('/my-portal');
    
    // Should NOT see livestream management
    await expect(page.locator('text=Livestream Management')).not.toBeVisible();
    await expect(page.locator('button:has-text("Start Stream")')).not.toBeVisible();
  });

  test('Viewer cannot access livestream controls', async ({ page }) => {
    // Login as viewer
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.viewer);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to viewer portal
    await page.goto('/my-portal');
    
    // Should NOT see livestream management
    await expect(page.locator('text=Livestream Management')).not.toBeVisible();
    await expect(page.locator('button:has-text("Start Stream")')).not.toBeVisible();
  });

  test('Livestream API endpoints enforce permissions', async ({ page }) => {
    // Test API endpoint permissions directly
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.viewer);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Try to call livestream API as viewer (should fail)
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/livestream/memorial-123/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        return { status: res.status, ok: res.ok };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    // Should be forbidden
    expect(response.status).toBe(403);
  });

  test('Livestream status updates correctly', async ({ page }) => {
    // Login as owner
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.owner);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to portal with livestream controls
    await page.goto('/my-portal');
    
    // Start livestream
    await page.click('button:has-text("Start Stream")');
    
    // Should show stream is active
    await expect(page.locator('text=Stream Active')).toBeVisible();
    await expect(page.locator('button:has-text("Stop Stream")')).toBeVisible();
    
    // Stop livestream
    await page.click('button:has-text("Stop Stream")');
    
    // Should show stream is stopped
    await expect(page.locator('text=Stream Stopped')).toBeVisible();
    await expect(page.locator('button:has-text("Start Stream")')).toBeVisible();
  });

  test('Multiple users cannot start simultaneous streams', async ({ page, context }) => {
    // Create second page for second user
    const page2 = await context.newPage();
    
    // Login first user (owner)
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.owner);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Login second user (funeral director) 
    await page2.goto('/login');
    await page2.fill('#loginEmail', testUsers.funeralDirector);
    await page2.fill('#loginPassword', password);
    await page2.click('#loginForm button[type="submit"]');
    
    // First user starts stream
    await page.goto('/my-portal');
    await page.click('button:has-text("Start Stream")');
    await expect(page.locator('text=Stream Active')).toBeVisible();
    
    // Second user tries to start stream on same memorial
    await page2.goto('/my-portal');
    await page2.click('button:has-text("Start Stream")');
    
    // Should show error about existing stream
    await expect(page2.locator('text=Stream already active')).toBeVisible();
    
    await page2.close();
  });
});
