import { test, expect } from '@playwright/test';

test.describe('Admin Portal Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@test.com');
    await page.getByLabel(/password/i).fill('test123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Navigate to admin portal
    await page.goto('/admin');
  });

  test('displays admin portal dashboard', async ({ page }) => {
    await expect(page.getByText(/admin portal/i)).toBeVisible();
    await expect(page.getByText(/overview/i)).toBeVisible();
    await expect(page.getByText(/funeral directors/i)).toBeVisible();
    await expect(page.getByText(/memorials/i)).toBeVisible();
    await expect(page.getByText(/audit logs/i)).toBeVisible();
  });

  test('shows system statistics', async ({ page }) => {
    // Should display key metrics
    await expect(page.getByText(/total memorials/i)).toBeVisible();
    await expect(page.getByText(/active users/i)).toBeVisible();
    await expect(page.getByText(/pending approvals/i)).toBeVisible();
    await expect(page.getByText(/revenue/i)).toBeVisible();
    
    // Should show numbers
    await expect(page.locator('[data-testid="total-memorials"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="active-users"]')).toContainText(/\d+/);
  });

  test('manages funeral director approvals', async ({ page }) => {
    // Navigate to funeral directors tab
    await page.getByRole('tab', { name: /funeral directors/i }).click();
    
    await expect(page.getByText(/funeral director management/i)).toBeVisible();
    
    // Should show pending applications
    const pendingSection = page.locator('[data-testid="pending-applications"]');
    await expect(pendingSection).toBeVisible();
    
    // Approve a funeral director
    const firstApplication = pendingSection.locator('[data-testid="fd-application"]').first();
    await firstApplication.getByRole('button', { name: /approve/i }).click();
    
    // Should show confirmation dialog
    await expect(page.getByText(/approve funeral director/i)).toBeVisible();
    await page.getByRole('button', { name: /confirm approval/i }).click();
    
    // Should show success message
    await expect(page.getByText(/funeral director approved/i)).toBeVisible();
  });

  test('rejects funeral director applications', async ({ page }) => {
    await page.getByRole('tab', { name: /funeral directors/i }).click();
    
    const pendingSection = page.locator('[data-testid="pending-applications"]');
    const firstApplication = pendingSection.locator('[data-testid="fd-application"]').first();
    
    await firstApplication.getByRole('button', { name: /reject/i }).click();
    
    // Should show rejection dialog with reason field
    await expect(page.getByText(/reject application/i)).toBeVisible();
    await page.getByLabel(/rejection reason/i).fill('Incomplete documentation');
    await page.getByRole('button', { name: /confirm rejection/i }).click();
    
    await expect(page.getByText(/application rejected/i)).toBeVisible();
  });

  test('views funeral director details', async ({ page }) => {
    await page.getByRole('tab', { name: /funeral directors/i }).click();
    
    // Click on a funeral director
    const fdRow = page.locator('[data-testid="fd-row"]').first();
    await fdRow.click();
    
    // Should show detailed view
    await expect(page.getByText(/funeral director details/i)).toBeVisible();
    await expect(page.getByText(/company information/i)).toBeVisible();
    await expect(page.getByText(/contact details/i)).toBeVisible();
    await expect(page.getByText(/memorials created/i)).toBeVisible();
  });

  test('manages memorial listings', async ({ page }) => {
    await page.getByRole('tab', { name: /memorials/i }).click();
    
    await expect(page.getByText(/memorial management/i)).toBeVisible();
    
    // Should show memorial table
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText(/loved one/i)).toBeVisible();
    await expect(page.getByText(/owner/i)).toBeVisible();
    await expect(page.getByText(/status/i)).toBeVisible();
    await expect(page.getByText(/created/i)).toBeVisible();
  });

  test('creates memorial from admin panel', async ({ page }) => {
    await page.getByRole('tab', { name: /create memorial/i }).click();
    
    await expect(page.getByText(/create new memorial/i)).toBeVisible();
    
    // Fill memorial creation form
    await page.getByLabel(/loved one.*name/i).fill('Admin Created Memorial');
    await page.getByLabel(/owner email/i).fill('newowner@example.com');
    await page.getByLabel(/owner name/i).fill('New Owner');
    await page.getByLabel(/owner phone/i).fill('(555) 123-4567');
    
    await page.getByRole('button', { name: /create memorial/i }).click();
    
    await expect(page.getByText(/memorial created successfully/i)).toBeVisible();
    await expect(page.getByText(/email sent to owner/i)).toBeVisible();
  });

  test('searches and filters memorials', async ({ page }) => {
    await page.getByRole('tab', { name: /memorials/i }).click();
    
    // Search by loved one name
    await page.getByPlaceholder(/search memorials/i).fill('John Doe');
    await page.getByRole('button', { name: /search/i }).click();
    
    // Should filter results
    await expect(page.getByText(/john doe/i)).toBeVisible();
    
    // Filter by status
    await page.getByRole('combobox', { name: /status/i }).selectOption('paid');
    
    // Should show only paid memorials
    await expect(page.getByText(/showing paid memorials/i)).toBeVisible();
  });

  test('views audit logs', async ({ page }) => {
    await page.getByRole('tab', { name: /audit logs/i }).click();
    
    await expect(page.getByText(/audit logs/i)).toBeVisible();
    
    // Should show audit log table
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText(/timestamp/i)).toBeVisible();
    await expect(page.getByText(/action/i)).toBeVisible();
    await expect(page.getByText(/user/i)).toBeVisible();
    await expect(page.getByText(/resource/i)).toBeVisible();
  });

  test('filters audit logs', async ({ page }) => {
    await page.getByRole('tab', { name: /audit logs/i }).click();
    
    // Filter by action type
    await page.getByRole('combobox', { name: /action type/i }).selectOption('memorial_created');
    
    // Filter by date range
    await page.getByLabel(/start date/i).fill('2024-01-01');
    await page.getByLabel(/end date/i).fill('2024-12-31');
    
    // Filter by user
    await page.getByLabel(/user email/i).fill('admin@test.com');
    
    await page.getByRole('button', { name: /apply filters/i }).click();
    
    // Should show filtered results
    await expect(page.getByText(/memorial_created/i)).toBeVisible();
  });

  test('exports audit logs', async ({ page }) => {
    await page.getByRole('tab', { name: /audit logs/i }).click();
    
    // Set up download handler
    const downloadPromise = page.waitForEvent('download');
    
    await page.getByRole('button', { name: /export logs/i }).click();
    
    // Should trigger download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/audit-logs.*\.csv/);
  });

  test('shows system health metrics', async ({ page }) => {
    // Should display system status
    await expect(page.getByText(/system status/i)).toBeVisible();
    
    // Check various health indicators
    await expect(page.getByText(/database/i)).toBeVisible();
    await expect(page.getByText(/streaming service/i)).toBeVisible();
    await expect(page.getByText(/email service/i)).toBeVisible();
    await expect(page.getByText(/payment service/i)).toBeVisible();
    
    // Should show status indicators (green/red dots)
    await expect(page.locator('[data-testid="service-status"]')).toHaveCount(4);
  });

  test('manages user roles', async ({ page }) => {
    await page.getByRole('tab', { name: /users/i }).click();
    
    // Find a user and change their role
    const userRow = page.locator('[data-testid="user-row"]').first();
    await userRow.getByRole('button', { name: /edit/i }).click();
    
    // Should show role editor
    await expect(page.getByText(/edit user role/i)).toBeVisible();
    await page.getByRole('combobox', { name: /role/i }).selectOption('admin');
    
    await page.getByRole('button', { name: /save changes/i }).click();
    
    await expect(page.getByText(/user role updated/i)).toBeVisible();
  });

  test('handles bulk operations', async ({ page }) => {
    await page.getByRole('tab', { name: /memorials/i }).click();
    
    // Select multiple memorials
    await page.getByRole('checkbox', { name: /select memorial/i }).first().check();
    await page.getByRole('checkbox', { name: /select memorial/i }).nth(1).check();
    
    // Should show bulk actions
    await expect(page.getByText(/2 selected/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /bulk actions/i })).toBeVisible();
    
    // Test bulk status update
    await page.getByRole('button', { name: /bulk actions/i }).click();
    await page.getByRole('menuitem', { name: /mark as paid/i }).click();
    
    await expect(page.getByText(/update 2 memorials/i)).toBeVisible();
    await page.getByRole('button', { name: /confirm/i }).click();
    
    await expect(page.getByText(/memorials updated/i)).toBeVisible();
  });

  test('shows recent activity feed', async ({ page }) => {
    // Should display recent activity
    await expect(page.getByText(/recent activity/i)).toBeVisible();
    
    // Should show activity items
    const activityFeed = page.locator('[data-testid="activity-feed"]');
    await expect(activityFeed).toBeVisible();
    
    // Should show different types of activities
    await expect(activityFeed.getByText(/memorial created/i)).toBeVisible();
    await expect(activityFeed.getByText(/user registered/i)).toBeVisible();
    await expect(activityFeed.getByText(/payment processed/i)).toBeVisible();
  });

  test('handles admin permissions correctly', async ({ page }) => {
    // All admin functions should be accessible
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /funeral directors/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /memorials/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /create memorial/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /audit logs/i })).toBeVisible();
    
    // Should show admin-only actions
    await expect(page.getByRole('button', { name: /system settings/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /backup data/i })).toBeVisible();
  });

  test('prevents non-admin access', async ({ page }) => {
    // Logout and login as non-admin
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByText(/sign out/i).click();
    
    await page.getByLabel(/email/i).fill('owner@test.com');
    await page.getByLabel(/password/i).fill('test123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Try to access admin portal
    await page.goto('/admin');
    
    // Should be redirected or show access denied
    await expect(page.getByText(/access denied/i)).toBeVisible();
  });

  test('shows error handling', async ({ page }) => {
    // Simulate API error
    await page.route('/api/admin/stats', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Database connection failed' })
      });
    });
    
    await page.reload();
    
    // Should show error state
    await expect(page.getByText(/failed to load statistics/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });
});
