import { test, expect } from '@playwright/test';
import { createUser, getUserByEmail, deleteUser } from './firebase-auth.utils';

const testUsers = {
  owner: `owner_photo_${Date.now()}@example.com`,
  funeralDirector: `fd_photo_${Date.now()}@example.com`,
  familyMember: `family_photo_${Date.now()}@example.com`,
  viewer: `viewer_photo_${Date.now()}@example.com`
};

const password = 'password123';

test.describe('Photo Upload Role Enforcement', () => {
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

  test('Owner can upload photos to their memorial', async ({ page }) => {
    // Login as owner
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.owner);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to photo upload page
    await page.goto('/my-portal/tributes/test-memorial/upload');
    
    // Should see photo upload interface
    await expect(page.locator('input[type="file"]')).toBeVisible();
    await expect(page.locator('button:has-text("Upload")')).toBeVisible();
    
    // Should not see permission error
    await expect(page.locator('text=Access Denied')).not.toBeVisible();
  });

  test('Funeral Director can upload photos to assigned memorials', async ({ page }) => {
    // Login as funeral director
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.funeralDirector);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to photo upload page for assigned memorial
    await page.goto('/my-portal/tributes/assigned-memorial/upload');
    
    // Should see photo upload interface
    await expect(page.locator('input[type="file"]')).toBeVisible();
    await expect(page.locator('button:has-text("Upload")')).toBeVisible();
  });

  test('Family Member with invitation can upload photos', async ({ page }) => {
    // Login as family member
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.familyMember);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to photo upload page for invited memorial
    await page.goto('/my-portal/tributes/invited-memorial/upload');
    
    // Should see photo upload interface (assuming invitation exists)
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test('Family Member without invitation cannot upload photos', async ({ page }) => {
    // Login as family member
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.familyMember);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Try to access photo upload for non-invited memorial
    await page.goto('/my-portal/tributes/non-invited-memorial/upload');
    
    // Should show access denied or redirect
    await expect(page.locator('text=Access Denied')).toBeVisible().catch(async () => {
      // Alternative: check if redirected away
      await expect(page).not.toHaveURL(/\/upload$/);
    });
  });

  test('Viewer cannot upload photos', async ({ page }) => {
    // Login as viewer
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.viewer);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Try to access photo upload page
    await page.goto('/my-portal/tributes/any-memorial/upload');
    
    // Should show access denied
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });

  test('Photo upload API enforces permissions', async ({ page }) => {
    // Login as viewer
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.viewer);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Try to upload via API as viewer
    const response = await page.evaluate(async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');
      
      try {
        const res = await fetch('/api/photos/memorial-123/upload', {
          method: 'POST',
          body: formData
        });
        return { status: res.status, ok: res.ok };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    // Should be forbidden
    expect(response.status).toBe(403);
  });

  test('Photo upload form validates file types', async ({ page }) => {
    // Login as owner
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.owner);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to photo upload
    await page.goto('/my-portal/tributes/test-memorial/upload');
    
    // Try to upload invalid file type
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is not an image')
    });
    
    await page.click('button:has-text("Upload")');
    
    // Should show file type error
    await expect(page.locator('text=Invalid file type')).toBeVisible();
  });

  test('Photo upload respects file size limits', async ({ page }) => {
    // Login as owner
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.owner);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to photo upload
    await page.goto('/my-portal/tributes/test-memorial/upload');
    
    // Try to upload oversized file (simulate large file)
    const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'large.jpg',
      mimeType: 'image/jpeg',
      buffer: largeBuffer
    });
    
    await page.click('button:has-text("Upload")');
    
    // Should show file size error
    await expect(page.locator('text=File too large')).toBeVisible();
  });

  test('Photo deletion permissions work correctly', async ({ page }) => {
    // Login as owner
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.owner);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to memorial photos
    await page.goto('/my-portal/tributes/test-memorial');
    
    // Should see delete buttons on photos (owner can delete)
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();
    
    // Logout and login as family member
    await page.click('button:has-text("Logout")');
    await page.fill('#loginEmail', testUsers.familyMember);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to same memorial
    await page.goto('/my-portal/tributes/test-memorial');
    
    // Should NOT see delete buttons (family member cannot delete)
    await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();
  });
});
