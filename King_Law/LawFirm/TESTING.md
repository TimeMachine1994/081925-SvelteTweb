# Testing Guide - King Law Firm

## Overview
This project uses Playwright for end-to-end testing of the complete lawyer and client workflows.

## Prerequisites

### 1. Test Database Setup
Before running tests, you need test users in your database:

```bash
# Run the database seed script to create test users
npm run db:seed
```

This will create:
- **Lawyer Account**: `lawyer@test.com` / `TestPassword123!`
- **Client Account**: `client@test.com` / `TestPassword123!`

### 2. Install Playwright Browsers
First time setup only:

```bash
npx playwright install
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in UI Mode (Interactive)
```bash
npm run test:ui
```
This opens an interactive UI where you can:
- See tests running in real-time
- Debug failures
- Inspect DOM elements
- View screenshots

### Run Tests in Debug Mode
```bash
npm run test:debug
```
Runs tests with Playwright Inspector for step-by-step debugging.

### Run Specific Test File
```bash
npx playwright test tests/lawyer-workflow.spec.ts
```

### Run Tests in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### View Test Report
After tests run, view the HTML report:
```bash
npm run test:report
```

## Test Structure

### Test Files

#### `tests/auth.spec.ts`
Tests authentication flows:
- Login (lawyer and client)
- Logout
- Invalid credentials
- Protected route access
- Role-based access control

#### `tests/lawyer-workflow.spec.ts`
Tests lawyer-specific features:
- View dashboard with stats
- Create new case
- Navigate to case details
- Create invoice from case
- Upload documents to case

#### `tests/client-workflow.spec.ts`
Tests client-specific features:
- View dashboard
- View assigned cases
- Navigate to case details
- Upload documents
- View invoices
- Send messages to lawyer

#### `tests/chat-attachments.spec.ts`
Tests chat functionality:
- Send messages (lawyer ↔ client)
- Send file attachments via chat
- Verify chat attachments appear in documents section

### Test Helpers

#### `tests/test-helpers.ts`
Reusable functions:
- `loginAsLawyer(page)` - Authenticate as lawyer
- `loginAsClient(page)` - Authenticate as client
- `logout(page)` - Sign out current user
- `generateTestCaseTitle()` - Create unique case title
- `generateTestInvoiceDescription()` - Create unique invoice description

## Configuration

### `playwright.config.ts`
- **Base URL**: `http://localhost:4173` (preview server)
- **Test Directory**: `./tests`
- **Retries**: 2 retries in CI, 0 locally
- **Reporter**: HTML report with screenshots on failure
- **Web Server**: Automatically builds and starts preview server

## Test Coverage

### ✅ Implemented Tests

#### Authentication
- [x] Login page display
- [x] Invalid credentials error
- [x] Lawyer login success
- [x] Client login success
- [x] Logout functionality
- [x] Protected route redirection
- [x] Role-based access control

#### Lawyer Workflow
- [x] Dashboard stats display
- [x] Create new case
- [x] Navigate to case details
- [x] Create invoice from case
- [x] Upload documents to case

#### Client Workflow
- [x] Dashboard display
- [x] View assigned cases
- [x] Navigate to case details
- [x] Upload documents
- [x] View invoices
- [x] Send messages to lawyer

#### Chat & Attachments
- [x] Send messages between lawyer/client
- [x] Send file attachments via chat
- [x] Verify chat attachments appear in documents

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Playwright Tests
on:
  push:
    branches: [ main, dev ]
  pull_request:
    branches: [ main, dev ]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      - name: Run Playwright tests
        run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Failed Tests

### 1. View Screenshots
Failed tests automatically capture screenshots in `test-results/`

### 2. View Trace
Run with trace enabled:
```bash
npx playwright test --trace on
```

Then view trace:
```bash
npx playwright show-trace test-results/.../trace.zip
```

### 3. Use Debug Mode
```bash
npm run test:debug
```
This opens Playwright Inspector where you can:
- Step through each action
- Inspect DOM at any point
- See console logs
- Modify selectors

### 4. Add Debug Statements
Add `await page.pause()` in your test to pause execution:
```typescript
await page.click('button:has-text("Create Case")');
await page.pause(); // Inspector opens here
```

## Best Practices

### 1. Use Data Attributes for Selectors
Prefer `data-testid` attributes over text-based selectors:
```svelte
<button data-testid="create-case-btn">Create Case</button>
```

```typescript
await page.click('[data-testid="create-case-btn"]');
```

### 2. Wait for Network Activity
```typescript
await page.waitForLoadState('networkidle');
```

### 3. Handle Dynamic Content
Use proper waiting strategies:
```typescript
await expect(page.locator('text=Success')).toBeVisible({ timeout: 5000 });
```

### 4. Clean Up After Tests
Use `afterEach` hooks to logout or reset state:
```typescript
test.afterEach(async ({ page }) => {
  await logout(page);
});
```

## Troubleshooting

### Tests Fail with "Session not found"
- Make sure test users exist in database: `npm run db:seed`
- Check that login credentials in `test-helpers.ts` match seeded users

### Preview Server Won't Start
- Port 4173 may be in use
- Run manually: `npm run build && npm run preview`
- Check for build errors

### Timeout Errors
- Increase timeout in test: `{ timeout: 10000 }`
- Check network connectivity
- Verify server is responding

### Element Not Found
- Use `--headed` mode to see what's on screen
- Check selector specificity
- Wait for element: `await page.waitForSelector('...')`

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Writing Tests Guide](https://playwright.dev/docs/writing-tests)
