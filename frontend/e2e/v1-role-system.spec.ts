import { test, expect } from '@playwright/test';

test.describe('V1 Role System - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('DevRoleSwitcher should only show 3 roles', async ({ page }) => {
    // Look for the DevRoleSwitcher component
    const roleSwitcher = page.locator('[data-testid="dev-role-switcher"]').first();
    
    if (await roleSwitcher.isVisible()) {
      // Check that only 3 role buttons exist
      const roleButtons = roleSwitcher.locator('button[data-role]');
      await expect(roleButtons).toHaveCount(3);
      
      // Verify the specific roles
      await expect(roleButtons.filter({ hasText: 'Admin' })).toBeVisible();
      await expect(roleButtons.filter({ hasText: 'Owner' })).toBeVisible();
      await expect(roleButtons.filter({ hasText: 'Funeral Director' })).toBeVisible();
      
      // Verify removed roles are not present
      await expect(roleButtons.filter({ hasText: 'Family Member' })).toHaveCount(0);
      await expect(roleButtons.filter({ hasText: 'Viewer' })).toHaveCount(0);
    }
  });

  test('Admin should have access to audit logs', async ({ page }) => {
    // Switch to admin role if DevRoleSwitcher is available
    const adminButton = page.locator('button[data-role="admin"]').first();
    if (await adminButton.isVisible()) {
      await adminButton.click();
      await page.waitForTimeout(1000);
    }

    // Navigate to admin portal
    await page.goto('/admin');
    
    // Check for audit logs tab
    const auditLogsTab = page.locator('button:has-text("🔍 Audit Logs")');
    await expect(auditLogsTab).toBeVisible();
    
    // Click audit logs tab
    await auditLogsTab.click();
    
    // Verify audit logs interface elements
    await expect(page.locator('h2:has-text("🔍 Audit Logs")')).toBeVisible();
    await expect(page.locator('text=Filters')).toBeVisible();
    await expect(page.locator('select[name="action"], select').first()).toBeVisible();
    await expect(page.locator('button:has-text("🔍 Search")')).toBeVisible();
  });

  test('Photo upload features should be removed', async ({ page }) => {
    // Check that photo upload buttons/components are not present
    await expect(page.locator('button:has-text("Upload Photos")')).toHaveCount(0);
    await expect(page.locator('[data-testid="photo-uploader"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="photo-gallery"]')).toHaveCount(0);
    
    // Check that upload action buttons are not present
    await expect(page.locator('button[data-action="upload"]')).toHaveCount(0);
  });

  test('Invitation system should be removed', async ({ page }) => {
    // Try to navigate to invitation routes - should not exist
    const inviteResponse = await page.goto('/invite/test-invitation', { waitUntil: 'networkidle' });
    expect(inviteResponse?.status()).toBe(404);
    
    const registerResponse = await page.goto('/register', { waitUntil: 'networkidle' });
    expect(registerResponse?.status()).toBe(404);
    
    // Check that invitation-related UI elements are not present
    await page.goto('/');
    await expect(page.locator('button:has-text("Invite")')).toHaveCount(0);
    await expect(page.locator('text=Send Invitation')).toHaveCount(0);
  });
});

test.describe('V1 Role System - Access Control', () => {
  test('Owner should have memorial access', async ({ page }) => {
    // Switch to owner role
    const ownerButton = page.locator('button[data-role="owner"]').first();
    if (await ownerButton.isVisible()) {
      await ownerButton.click();
      await page.waitForTimeout(1000);
    }

    // Navigate to memorials page
    await page.goto('/memorials');
    
    // Should be able to access memorials (not get access denied)
    await expect(page.locator('text=Access Denied')).toHaveCount(0);
    await expect(page.locator('text=Unauthorized')).toHaveCount(0);
  });

  test('Funeral Director should have appropriate access', async ({ page }) => {
    // Switch to funeral director role
    const fdButton = page.locator('button[data-role="funeral_director"]').first();
    if (await fdButton.isVisible()) {
      await fdButton.click();
      await page.waitForTimeout(1000);
    }

    // Navigate to funeral director portal
    await page.goto('/funeral-director');
    
    // Should be able to access funeral director features
    await expect(page.locator('text=Access Denied')).toHaveCount(0);
    await expect(page.locator('text=Unauthorized')).toHaveCount(0);
  });

  test('Non-admin users should not access admin features', async ({ page }) => {
    // Switch to owner role (non-admin)
    const ownerButton = page.locator('button[data-role="owner"]').first();
    if (await ownerButton.isVisible()) {
      await ownerButton.click();
      await page.waitForTimeout(1000);
    }

    // Try to access admin portal
    const adminResponse = await page.goto('/admin', { waitUntil: 'networkidle' });
    
    // Should either redirect or show access denied
    const currentUrl = page.url();
    const hasAccessDenied = await page.locator('text=Access Denied, text=Unauthorized, text=Admin access required').count() > 0;
    
    expect(currentUrl.includes('/admin') === false || hasAccessDenied).toBe(true);
  });
});

test.describe('V1 Role System - API Endpoints', () => {
  test('Audit logs API should require admin access', async ({ page }) => {
    // Test API endpoint directly
    const response = await page.request.get('/api/admin/audit-logs');
    
    // Should return 403 or redirect for non-admin users
    expect([403, 401, 302]).toContain(response.status());
  });

  test('Removed photo upload APIs should return 404', async ({ page }) => {
    // Test that photo upload endpoints no longer exist
    const photoUploadResponse = await page.request.post('/api/memorials/test/photos');
    expect(photoUploadResponse.status()).toBe(404);
  });

  test('Removed invitation APIs should return 404', async ({ page }) => {
    // Test that invitation endpoints no longer exist
    const inviteResponse = await page.request.post('/api/memorials/test/invite');
    expect(inviteResponse.status()).toBe(404);
  });
});

test.describe('V1 Role System - Audit Logging', () => {
  test('User actions should be logged', async ({ page }) => {
    // Switch to admin to access audit logs
    const adminButton = page.locator('button[data-role="admin"]').first();
    if (await adminButton.isVisible()) {
      await adminButton.click();
      await page.waitForTimeout(1000);
    }

    // Perform some actions that should be logged
    await page.goto('/memorials');
    await page.goto('/admin');
    
    // Check audit logs
    const auditLogsTab = page.locator('button:has-text("🔍 Audit Logs")');
    if (await auditLogsTab.isVisible()) {
      await auditLogsTab.click();
      
      // Load audit logs
      const searchButton = page.locator('button:has-text("🔍 Search")');
      await searchButton.click();
      
      // Wait for logs to load
      await page.waitForTimeout(2000);
      
      // Check that some audit events are present
      const auditTable = page.locator('table');
      if (await auditTable.isVisible()) {
        const rows = auditTable.locator('tbody tr');
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);
      }
    }
  });
});
