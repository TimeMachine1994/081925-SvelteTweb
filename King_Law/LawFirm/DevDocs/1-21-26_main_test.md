# Client Portal Messaging - Automated E2E Testing Plan

**Created:** January 21, 2026  
**Status:** Ready for Implementation  
**Related Feature:** Uncategorized Messaging Flow (clients without cases)

---

## Overview

This document outlines the implementation plan for automated end-to-end testing of the new client portal messaging feature. The goal is to enable fully automated testing that:

1. Tests the complete user journey from client to lawyer to case assignment
2. Cleans up test data automatically to prevent database pollution
3. Runs reliably and repeatably without manual intervention

---

## Problem Statement

### Current Challenges
- Manual testing is time-consuming and error-prone
- Each test run creates real data in the database
- Test data accumulates over time, making the database harder to work with
- Subsequent tests may be affected by data from previous test runs

### Solution
Implement a comprehensive E2E test suite with automatic cleanup that:
- Uses dedicated test users with predictable behavior
- Creates test data with identifiable prefixes
- Cleans up all test data after each test run
- Guards cleanup endpoints to only work in non-production environments

---

## Implementation Components

### 1. Test Cleanup API Endpoint

**File:** `src/routes/api/admin/test-cleanup/+server.ts`

```typescript
import { json, error, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { messages, documents, cases, user } from '$lib/server/db/schema';
import { eq, like, or, and, inArray } from 'drizzle-orm';

export const POST = async ({ request, locals }: RequestEvent) => {
    // Security: Only allow in development/test environments
    if (process.env.NODE_ENV === 'production') {
        throw error(403, 'Test cleanup is not available in production');
    }

    // Security: Require admin authentication
    if (!locals.user || locals.user.role !== 'admin') {
        throw error(401, 'Admin authentication required');
    }

    try {
        const { prefix, userId, cleanupType } = await request.json();

        let deletedCounts = {
            messages: 0,
            documents: 0,
            cases: 0
        };

        // Cleanup by prefix (e.g., "E2E_TEST_")
        if (prefix) {
            // Delete messages with prefix in content
            const messagesToDelete = await db
                .select({ id: messages.id })
                .from(messages)
                .where(like(messages.content, `${prefix}%`));
            
            if (messagesToDelete.length > 0) {
                await db.delete(messages)
                    .where(inArray(messages.id, messagesToDelete.map(m => m.id)));
                deletedCounts.messages = messagesToDelete.length;
            }

            // Delete cases with prefix in title
            const casesToDelete = await db
                .select({ id: cases.id })
                .from(cases)
                .where(like(cases.title, `${prefix}%`));
            
            if (casesToDelete.length > 0) {
                await db.delete(cases)
                    .where(inArray(cases.id, casesToDelete.map(c => c.id)));
                deletedCounts.cases = casesToDelete.length;
            }
        }

        // Cleanup by user ID (e.g., test user)
        if (userId) {
            // Delete all messages from/to this user
            const userMessages = await db
                .select({ id: messages.id })
                .from(messages)
                .where(or(
                    eq(messages.senderId, userId),
                    eq(messages.recipientId, userId)
                ));
            
            if (userMessages.length > 0) {
                await db.delete(messages)
                    .where(inArray(messages.id, userMessages.map(m => m.id)));
                deletedCounts.messages += userMessages.length;
            }

            // Delete all cases for this user
            const userCases = await db
                .select({ id: cases.id })
                .from(cases)
                .where(eq(cases.clientId, userId));
            
            if (userCases.length > 0) {
                await db.delete(cases)
                    .where(inArray(cases.id, userCases.map(c => c.id)));
                deletedCounts.cases += userCases.length;
            }
        }

        return json({
            success: true,
            deleted: deletedCounts,
            message: 'Test data cleaned up successfully'
        });
    } catch (err) {
        console.error('Test cleanup error:', err);
        throw error(500, 'Failed to cleanup test data');
    }
};
```

**Key Features:**
- Environment guard: Only works when `NODE_ENV !== 'production'`
- Admin authentication required
- Supports cleanup by prefix or user ID
- Returns counts of deleted items for verification

---

### 2. Dedicated Test User (No Cases)

Create a test user specifically for testing the "client without cases" flow:

**User Details:**
```json
{
    "email": "nocases@test.com",
    "password": "TestPassword123!",
    "firstName": "NoCases",
    "lastName": "TestClient",
    "role": "client"
}
```

**Setup Script:** `scripts/seed-test-user.ts`

```typescript
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

async function seedNoCasesTestUser() {
    const existingUser = await db.query.user.findFirst({
        where: eq(user.email, 'nocases@test.com')
    });

    if (!existingUser) {
        const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
        await db.insert(user).values({
            id: nanoid(),
            email: 'nocases@test.com',
            password: hashedPassword,
            firstName: 'NoCases',
            lastName: 'TestClient',
            role: 'client'
        });
        console.log('Created nocases@test.com user');
    } else {
        console.log('nocases@test.com already exists');
    }
}

seedNoCasesTestUser();
```

---

### 3. Test Helper Updates

**File:** `tests/test-helpers.ts`

Add new test users and cleanup helpers:

```typescript
// Add to existing TEST_USERS object
export const TEST_USERS = {
    lawyer: {
        email: 'lawyer@test.com',
        password: 'TestPassword123!',
        firstName: 'Ben',
        lastName: 'King',
        role: 'lawyer'
    },
    client: {
        email: 'client@test.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'client'
    },
    // NEW: Client with no cases for messaging flow testing
    noCasesClient: {
        email: 'nocases@test.com',
        password: 'TestPassword123!',
        firstName: 'NoCases',
        lastName: 'TestClient',
        role: 'client'
    }
};

// NEW: Login as no-cases client
export async function loginAsNoCasesClient(page: Page) {
    await page.goto('/login');
    await page.fill('input[id="username"]', TEST_USERS.noCasesClient.email);
    await page.fill('input[id="password"]', TEST_USERS.noCasesClient.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard/client', { timeout: 10000 });
}

// NEW: Test data prefix for easy identification
export const TEST_PREFIX = 'E2E_TEST_';

// NEW: Generate unique test data with prefix
export function generateE2ETestData() {
    const timestamp = Date.now();
    return {
        messageContent: `${TEST_PREFIX}Message content ${timestamp}`,
        caseTitle: `${TEST_PREFIX}Case ${timestamp}`,
        fileName: `${TEST_PREFIX}file-${timestamp}.txt`
    };
}

// NEW: Cleanup test data via API
export async function cleanupTestData(page: Page, options?: {
    prefix?: string;
    userId?: string;
}) {
    // First, login as admin to get auth cookie
    await page.goto('/login');
    await page.fill('input[id="username"]', 'admin@test.com');
    await page.fill('input[id="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');
    
    // Call cleanup API
    const response = await page.request.post('/api/admin/test-cleanup', {
        data: {
            prefix: options?.prefix || TEST_PREFIX,
            userId: options?.userId
        }
    });
    
    return response.json();
}
```

---

### 4. E2E Test Spec for Uncategorized Messaging

**File:** `tests/uncategorized-messaging.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { 
    loginAsLawyer, 
    loginAsNoCasesClient, 
    logout, 
    TEST_USERS,
    TEST_PREFIX,
    generateE2ETestData,
    cleanupTestData
} from './test-helpers';

test.describe('Uncategorized Messaging Flow', () => {
    let testData: ReturnType<typeof generateE2ETestData>;

    test.beforeAll(async ({ browser }) => {
        // Generate unique test data for this run
        testData = generateE2ETestData();
    });

    test.afterAll(async ({ browser }) => {
        // Cleanup all test data created during this run
        const context = await browser.newContext();
        const page = await context.newPage();
        await cleanupTestData(page, { prefix: TEST_PREFIX });
        await context.close();
    });

    test('Complete messaging flow: client sends message, lawyer assigns to case', async ({ page }) => {
        // ========== STEP 1: Client sends uncategorized message ==========
        await test.step('Client logs in and sees empty state', async () => {
            await loginAsNoCasesClient(page);
            
            // Verify empty state UI is shown
            await expect(page.locator('text=No Active Cases')).toBeVisible();
            
            // Verify MessageComposer is visible
            await expect(page.locator('h3:has-text("Send Us a Message")')).toBeVisible();
        });

        await test.step('Client sends message with content', async () => {
            // Fill message content
            await page.fill('textarea[placeholder*="message"]', testData.messageContent);
            
            // Click send button
            await page.click('button:has-text("Send Message")');
            
            // Wait for success indication
            await expect(page.locator('text=Message sent successfully')).toBeVisible({ timeout: 5000 });
        });

        await logout(page);

        // ========== STEP 2: Lawyer sees message in inbox ==========
        await test.step('Lawyer logs in and sees uncategorized message', async () => {
            await loginAsLawyer(page);
            
            // Verify "New Client Inquiries" section exists
            await expect(page.locator('h2:has-text("New Client Inquiries")')).toBeVisible();
            
            // Verify the message appears
            await expect(page.locator(`text=${testData.messageContent}`)).toBeVisible();
            
            // Verify sender info is shown
            await expect(page.locator('text=NoCases TestClient')).toBeVisible();
        });

        // ========== STEP 3: Lawyer assigns message to new case ==========
        await test.step('Lawyer opens assign modal', async () => {
            // Click "Assign to Case" button
            await page.click('button:has-text("Assign to Case")');
            
            // Verify modal opens
            await expect(page.locator('h2:has-text("Assign to Case")')).toBeVisible();
        });

        await test.step('Lawyer creates new case and assigns', async () => {
            // Select "Create new case" radio (should be default)
            await expect(page.locator('input[value="new"]:checked')).toBeVisible();
            
            // Fill case title
            await page.fill('input[id="caseTitle"]', testData.caseTitle);
            
            // Fill optional description
            await page.fill('textarea[id="caseDescription"]', 'E2E test case description');
            
            // Click assign button
            await page.click('button:has-text("Assign to Case")');
            
            // Wait for success
            await expect(page.locator('text=Message assigned to case successfully')).toBeVisible({ timeout: 5000 });
        });

        await test.step('Message disappears from inbox', async () => {
            // Reload dashboard
            await page.goto('/dashboard/lawyer');
            
            // Message should no longer appear in uncategorized section
            const messageLocator = page.locator(`text=${testData.messageContent}`);
            await expect(messageLocator).not.toBeVisible({ timeout: 3000 });
        });

        await logout(page);

        // ========== STEP 4: Client sees new case ==========
        await test.step('Client logs in and sees assigned case', async () => {
            await loginAsNoCasesClient(page);
            
            // Should no longer see empty state
            await expect(page.locator('text=No Active Cases')).not.toBeVisible();
            
            // Should see the new case
            await expect(page.locator(`text=${testData.caseTitle}`)).toBeVisible();
        });

        await test.step('Client can navigate to case and see message', async () => {
            // Click on case
            await page.click(`text=${testData.caseTitle}`);
            
            // Navigate to Messages tab
            await page.click('button:has-text("Messages")');
            
            // Verify original message is in the case
            await expect(page.locator(`text=${testData.messageContent}`)).toBeVisible();
        });

        await logout(page);
    });

    test('Client can send message with attachment', async ({ page }) => {
        await loginAsNoCasesClient(page);

        // Fill message
        await page.fill('textarea[placeholder*="message"]', `${TEST_PREFIX}Attachment test ${Date.now()}`);
        
        // Upload test file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
            name: `${TEST_PREFIX}test-document.pdf`,
            mimeType: 'application/pdf',
            buffer: Buffer.from('Test PDF content')
        });

        // Verify file appears in preview
        await expect(page.locator(`text=${TEST_PREFIX}test-document.pdf`)).toBeVisible();

        // Send message
        await page.click('button:has-text("Send Message")');
        
        // Verify success
        await expect(page.locator('text=Message sent successfully')).toBeVisible({ timeout: 5000 });

        await logout(page);
    });

    test('Lawyer can assign to existing case', async ({ page }) => {
        // First, create a case to assign to
        await loginAsLawyer(page);
        
        // Create case via UI
        await page.click('button:has-text("Create Case")');
        await page.fill('input[placeholder="Enter case title"]', `${TEST_PREFIX}Existing Case ${Date.now()}`);
        await page.fill('textarea[placeholder*="description"]', 'Existing case for assignment test');
        await page.click('button[type="submit"]:has-text("Create Case")');
        await page.waitForTimeout(1000);

        await logout(page);

        // Client sends message
        await loginAsNoCasesClient(page);
        const assignTestMessage = `${TEST_PREFIX}Assign to existing ${Date.now()}`;
        await page.fill('textarea[placeholder*="message"]', assignTestMessage);
        await page.click('button:has-text("Send Message")');
        await page.waitForTimeout(1000);
        await logout(page);

        // Lawyer assigns to existing case
        await loginAsLawyer(page);
        await page.click('button:has-text("Assign to Case")');
        
        // Select "Assign to existing case"
        await page.click('input[value="existing"]');
        
        // Select the existing case from dropdown
        await page.selectOption('select[id="caseSelect"]', { index: 1 });
        
        // Submit
        await page.click('button:has-text("Assign to Case")');
        
        // Verify success
        await expect(page.locator('text=Message assigned to case successfully')).toBeVisible();

        await logout(page);
    });
});
```

---

### 5. NPM Scripts

**Add to `package.json`:**

```json
{
    "scripts": {
        "test": "playwright test",
        "test:messaging": "playwright test uncategorized-messaging",
        "test:ui": "playwright test --ui",
        "test:headed": "playwright test --headed",
        "test:cleanup": "npx tsx scripts/cleanup-test-data.ts",
        "seed:test-users": "npx tsx scripts/seed-test-user.ts"
    }
}
```

---

### 6. Playwright Configuration Updates

**File:** `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: false, // Run sequentially for messaging flow tests
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1, // Single worker for database consistency
    reporter: [
        ['html'],
        ['list'] // Also show in terminal
    ],
    use: {
        baseURL: 'http://localhost:4173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure' // Record video for debugging failed tests
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ],
    webServer: {
        command: 'npm run preview',
        url: 'http://localhost:4173',
        reuseExistingServer: true,
        timeout: 180000
    },
    // Global setup/teardown
    globalSetup: require.resolve('./tests/global-setup.ts'),
    globalTeardown: require.resolve('./tests/global-teardown.ts')
});
```

---

### 7. Global Setup/Teardown

**File:** `tests/global-setup.ts`

```typescript
import { chromium } from '@playwright/test';

async function globalSetup() {
    console.log('🧪 Running global test setup...');
    
    // Verify test users exist
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        // Try to access login page
        await page.goto('http://localhost:4173/login');
        console.log('✅ App is accessible');
    } catch (error) {
        console.error('❌ App is not accessible. Make sure to run npm run preview first.');
        throw error;
    }
    
    await browser.close();
    console.log('✅ Global setup complete');
}

export default globalSetup;
```

**File:** `tests/global-teardown.ts`

```typescript
import { chromium } from '@playwright/test';

async function globalTeardown() {
    console.log('🧹 Running global test cleanup...');
    
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // Login as admin
        await page.goto('http://localhost:4173/login');
        await page.fill('input[id="username"]', 'admin@test.com');
        await page.fill('input[id="password"]', 'AdminPassword123!');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        
        // Call cleanup API
        const response = await page.request.post('http://localhost:4173/api/admin/test-cleanup', {
            data: { prefix: 'E2E_TEST_' }
        });
        
        const result = await response.json();
        console.log('✅ Cleanup result:', result);
    } catch (error) {
        console.warn('⚠️ Cleanup warning:', error);
    }
    
    await browser.close();
    console.log('✅ Global teardown complete');
}

export default globalTeardown;
```

---

## Implementation Steps

### Phase 1: Create Test Infrastructure
1. [ ] Create `/api/admin/test-cleanup/+server.ts` endpoint
2. [ ] Add environment guard to prevent production usage
3. [ ] Update `test-helpers.ts` with new users and functions

### Phase 2: Seed Test Data
1. [ ] Create `scripts/seed-test-user.ts`
2. [ ] Run seeding script to create `nocases@test.com` user
3. [ ] Verify user can login and sees empty state

### Phase 3: Create Test Specs
1. [ ] Create `tests/uncategorized-messaging.spec.ts`
2. [ ] Create `tests/global-setup.ts`
3. [ ] Create `tests/global-teardown.ts`

### Phase 4: Update Configuration
1. [ ] Update `playwright.config.ts` with new settings
2. [ ] Add npm scripts to `package.json`

### Phase 5: Verify and Document
1. [ ] Run full test suite: `npm run test:messaging`
2. [ ] Verify cleanup runs successfully
3. [ ] Document in README

---

## Running Tests

```bash
# Run all tests
npm run test

# Run only messaging tests
npm run test:messaging

# Run tests with UI (for debugging)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Manual cleanup if needed
npm run test:cleanup
```

---

## Security Considerations

1. **Environment Guard**: The cleanup endpoint only works when `NODE_ENV !== 'production'`
2. **Admin Auth Required**: Even in dev, admin authentication is required
3. **Prefix Isolation**: Test data uses `E2E_TEST_` prefix, making it easy to identify and clean
4. **No Production Data**: Test users have dedicated accounts that don't overlap with real users

---

## Troubleshooting

### Tests fail to connect
- Ensure `npm run preview` is running
- Check that port 4173 is available

### Cleanup doesn't work
- Verify admin user exists: `admin@test.com`
- Check that `NODE_ENV` is not set to `production`

### Test user doesn't exist
- Run: `npm run seed:test-users`

### Database gets cluttered
- Run manual cleanup: `npm run test:cleanup`
- Or delete records with `E2E_TEST_` prefix manually

---

## Summary

This testing approach provides:
- **Automated E2E tests** for the full messaging flow
- **Database isolation** through prefixed test data and cleanup
- **Repeatability** through dedicated test users
- **Safety** through environment guards and admin authentication
- **Visibility** through detailed test steps and cleanup logging

Ready to implement when approved.
