import { test, expect } from '@playwright/test';
import { createUser, getUserByEmail, deleteUser } from './firebase-auth.utils';

const testUsers = {
  viewer1: `viewer1_follow_${Date.now()}@example.com`,
  viewer2: `viewer2_follow_${Date.now()}@example.com`,
  owner: `owner_follow_${Date.now()}@example.com`
};

const password = 'password123';

test.describe('Follow/Unfollow System', () => {
  test.beforeAll(async () => {
    // Create test users
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

  test('Viewer can follow a event', async ({ page }) => {
    // Login as viewer
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.viewer1);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to a public event
    await page.goto('/tributes/public-event-123');
    
    // Should see follow button
    await expect(page.locator('button:has-text("Follow")')).toBeVisible();
    
    // Click follow
    await page.click('button:has-text("Follow")');
    
    // Should show following status
    await expect(page.locator('button:has-text("Following")')).toBeVisible();
    await expect(page.locator('text=You are now following')).toBeVisible();
  });

  test('Followed event appears in viewer portal', async ({ page }) => {
    // Login as viewer who followed event
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.viewer1);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to viewer portal
    await page.goto('/my-portal');
    
    // Should see followed event in the list
    await expect(page.locator('text=Followed Memorials')).toBeVisible();
    await expect(page.locator('text=public-event-123')).toBeVisible();
  });

  test('Viewer can unfollow a event', async ({ page }) => {
    // Login as viewer
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.viewer1);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to followed event
    await page.goto('/tributes/public-event-123');
    
    // Should see following button
    await expect(page.locator('button:has-text("Following")')).toBeVisible();
    
    // Click to unfollow
    await page.click('button:has-text("Following")');
    
    // Should show unfollow confirmation or immediate unfollow
    await expect(page.locator('button:has-text("Follow")')).toBeVisible();
    await expect(page.locator('text=You unfollowed')).toBeVisible();
  });

  test('Unfollowed event removed from viewer portal', async ({ page }) => {
    // Login as viewer who unfollowed
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.viewer1);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to viewer portal
    await page.goto('/my-portal');
    
    // Event should no longer be in followed list
    await expect(page.locator('text=public-event-123')).not.toBeVisible();
  });

  test('Follow API endpoints work correctly', async ({ page }) => {
    // Login as viewer
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.viewer2);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Test follow API directly
    const followResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/memorials/test-event/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        return { status: res.status, ok: res.ok };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    expect(followResponse.ok).toBe(true);
    
    // Test unfollow API
    const unfollowResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/memorials/test-event/unfollow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        return { status: res.status, ok: res.ok };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    expect(unfollowResponse.ok).toBe(true);
  });

  test('Follow count updates correctly', async ({ page, context }) => {
    // Create second page for second viewer
    const page2 = await context.newPage();
    
    // Login first viewer
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.viewer1);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Login second viewer
    await page2.goto('/login');
    await page2.fill('#loginEmail', testUsers.viewer2);
    await page2.fill('#loginPassword', password);
    await page2.click('#loginForm button[type="submit"]');
    
    // Both navigate to same event
    await page.goto('/tributes/follow-count-event');
    await page2.goto('/tributes/follow-count-event');
    
    // Check initial follow count
    const initialCount = await page.locator('[data-testid="follow-count"]').textContent();
    
    // First viewer follows
    await page.click('button:has-text("Follow")');
    
    // Count should increase
    await expect(page.locator('[data-testid="follow-count"]')).not.toHaveText(initialCount);
    
    // Second viewer follows
    await page2.click('button:has-text("Follow")');
    
    // Count should increase again
    const newCount = await page2.locator('[data-testid="follow-count"]').textContent();
    expect(parseInt(newCount || '0')).toBeGreaterThan(parseInt(initialCount || '0'));
    
    await page2.close();
  });

  test('Owner cannot follow their own event', async ({ page }) => {
    // Login as owner
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.owner);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to their own event
    await page.goto('/tributes/owner-event-123');
    
    // Should NOT see follow button
    await expect(page.locator('button:has-text("Follow")')).not.toBeVisible();
  });

  test('Follow status persists across sessions', async ({ page }) => {
    // Login and follow event
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.viewer1);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    await page.goto('/tributes/persistent-event');
    await page.click('button:has-text("Follow")');
    
    // Logout
    await page.click('button:has-text("Logout")');
    
    // Login again
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.viewer1);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to event
    await page.goto('/tributes/persistent-event');
    
    // Should still show as following
    await expect(page.locator('button:has-text("Following")')).toBeVisible();
  });

  test('Event discovery shows unfollowed memorials', async ({ page }) => {
    // Login as viewer
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.viewer1);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to viewer portal
    await page.goto('/my-portal');
    
    // Should see discover memorials section
    await expect(page.locator('text=Discover Memorials')).toBeVisible();
    
    // Should show memorials not yet followed
    await expect(page.locator('[data-testid="discover-event"]')).toBeVisible();
    
    // Each should have a follow button
    await expect(page.locator('[data-testid="discover-event"] button:has-text("Follow")')).toBeVisible();
  });
});
