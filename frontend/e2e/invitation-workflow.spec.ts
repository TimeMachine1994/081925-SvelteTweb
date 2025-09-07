import { test, expect } from '@playwright/test';
import { createUser, getUserByEmail, deleteUser } from './firebase-auth.utils';

const testUsers = {
  owner: `owner_invite_${Date.now()}@example.com`,
  familyMember: `family_invite_${Date.now()}@example.com`
};

const password = 'password123';

test.describe('Invitation Workflow', () => {
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

  test('Complete invitation workflow', async ({ page }) => {
    // Step 1: Owner creates memorial and sends invitation
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.owner);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Navigate to memorial creation
    await page.goto('/app/calculator');
    
    // Fill memorial form (assuming basic form exists)
    await page.fill('input[name="lovedOneName"]', 'Test Memorial Person');
    await page.fill('input[name="serviceDate"]', '2024-12-25');
    
    // Submit memorial creation
    await page.click('button[type="submit"]');
    
    // Should redirect to memorial page or success page
    await expect(page.locator('text=Memorial created')).toBeVisible();
    
    // Get memorial ID from URL or page
    const memorialId = await page.evaluate(() => {
      const url = window.location.pathname;
      const match = url.match(/\/tributes\/([^\/]+)/);
      return match ? match[1] : null;
    });
    
    expect(memorialId).toBeTruthy();
    
    // Navigate to invitation management
    await page.goto(`/my-portal/tributes/${memorialId}/invitations`);
    
    // Send invitation to family member
    await page.fill('input[name="inviteEmail"]', testUsers.familyMember);
    await page.selectOption('select[name="role"]', 'family_member');
    await page.click('button:has-text("Send Invitation")');
    
    // Verify invitation sent
    await expect(page.locator('text=Invitation sent successfully')).toBeVisible();
  });

  test('Family member accepts invitation', async ({ page }) => {
    // Simulate invitation acceptance flow
    // In real scenario, this would come from email link
    const invitationId = 'test-invitation-123';
    
    await page.goto(`/invite/${invitationId}`);
    
    // Should show invitation details
    await expect(page.locator('text=Memorial Invitation')).toBeVisible();
    await expect(page.locator('text=Test Memorial Person')).toBeVisible();
    
    // Login as family member
    await page.fill('#loginEmail', testUsers.familyMember);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Accept invitation
    await page.click('button:has-text("Accept Invitation")');
    
    // Should redirect to family member portal
    await expect(page).toHaveURL(/\/my-portal/);
    await expect(page.locator('text=Family Member Portal')).toBeVisible();
    
    // Should see the memorial in invited memorials
    await expect(page.locator('text=Test Memorial Person')).toBeVisible();
  });

  test('Invitation status updates correctly', async ({ page }) => {
    // Login as owner
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.owner);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Check invitation status in owner portal
    await page.goto('/my-portal');
    await page.click('text=Manage Invitations');
    
    // Should show invitation status as accepted
    await expect(page.locator('text=Accepted')).toBeVisible();
    await expect(page.locator(`text=${testUsers.familyMember}`)).toBeVisible();
  });

  test('Invalid invitation handling', async ({ page }) => {
    // Try to access non-existent invitation
    await page.goto('/invite/invalid-invitation-id');
    
    // Should show error message
    await expect(page.locator('text=Invitation not found')).toBeVisible();
  });

  test('Expired invitation handling', async ({ page }) => {
    // This would test expired invitations
    // For now, just ensure the page loads
    await page.goto('/invite/expired-invitation-123');
    
    // Should handle gracefully
    await expect(page.locator('text=Invitation')).toBeVisible();
  });

  test('Duplicate invitation prevention', async ({ page }) => {
    // Login as owner
    await page.goto('/login');
    await page.fill('#loginEmail', testUsers.owner);
    await page.fill('#loginPassword', password);
    await page.click('#loginForm button[type="submit"]');
    
    // Try to send invitation to same email again
    await page.goto('/my-portal');
    // Navigate to invitation form and try duplicate
    
    await page.fill('input[name="inviteEmail"]', testUsers.familyMember);
    await page.selectOption('select[name="role"]', 'family_member');
    await page.click('button:has-text("Send Invitation")');
    
    // Should show error about existing invitation
    await expect(page.locator('text=already invited')).toBeVisible();
  });
});
