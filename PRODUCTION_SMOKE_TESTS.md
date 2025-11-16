# Production Smoke Tests

## Overview

Production smoke tests validate critical user journeys on your **live production environment** without modifying any data. These tests ensure your MVP remains operational after deployments.

## What This System Does

✅ **Safe for Production** - Read-only tests, no data creation/modification  
✅ **Critical Path Testing** - Validates essential user flows  
✅ **Automated Verification** - Run after each deployment  
✅ **Cross-Browser Testing** - Desktop Chrome + Mobile Safari  
✅ **Performance Monitoring** - Tracks page load times  
✅ **Detailed Reporting** - HTML reports with screenshots/videos on failure  

## Quick Start

### 1. Run Tests Against Production

```bash
cd frontend
npm run test:smoke
```

This runs all smoke tests against `https://tributestream.live` (configurable via `PRODUCTION_URL` env var).

### 2. View Test Results

```bash
npm run test:smoke:report
```

Opens the HTML report showing:
- ✅ Passed tests
- ❌ Failed tests with screenshots
- 📹 Videos of failures
- ⏱️ Performance metrics

### 3. Run Tests Interactively (Debug Mode)

```bash
npm run test:smoke:ui
```

Opens Playwright UI for step-by-step debugging.

## Critical User Journeys Tested

### 🌐 Journey 1: Anonymous Memorial Discovery
- Homepage loads correctly
- Search functionality works
- Public memorials are viewable
- **Why Critical:** Primary user entry point

### 👤 Journey 2: Registration Flow
- Registration form loads
- All input fields present
- Role selection options available
- reCAPTCHA protection active
- **Why Critical:** User acquisition

### 🔐 Journey 3: Authentication System
- Login page accessible
- Password reset link present
- Form validation works
- Invalid credentials show errors
- **Why Critical:** User access, security

### 📄 Journey 4: Marketing Pages
- For Families page loads
- For Funeral Directors page loads
- Contact page loads
- **Why Critical:** Marketing, conversion

### 📧 Journey 5: Contact Form
- All form fields present
- Form validation active
- Submit functionality works
- **Why Critical:** Lead generation, support

### 🧭 Journey 6: Navigation
- Desktop navigation works
- Mobile navigation works
- All menu items accessible
- **Why Critical:** User experience

### ⚡ Journey 7: Performance Check
- Homepage loads < 10 seconds (hard limit)
- Warning if > 5 seconds
- Tracks load time metrics
- **Why Critical:** SEO, user retention

### 📝 Journey 8: Blog System
- Blog page accessible (if implemented)
- Content displays correctly
- **Why Critical:** Content marketing, SEO

### 🔌 API Health Checks
- Contact form API responsive
- Search API responsive
- **Why Critical:** Backend availability

## Running in CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Production Smoke Tests

on:
  workflow_dispatch: # Manual trigger
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Install Playwright Browsers
        run: |
          cd frontend
          npx playwright install --with-deps chromium webkit
      
      - name: Run Production Smoke Tests
        run: |
          cd frontend
          npm run test:smoke
        env:
          PRODUCTION_URL: https://tributestream.live
      
      - name: Upload Test Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: smoke-test-report
          path: frontend/playwright-report/
          retention-days: 30
```

### Vercel Deploy Hook Example

Add to `.github/workflows/production-verify.yml`:

```yaml
name: Verify Production After Deploy

on:
  deployment_status:

jobs:
  smoke-tests:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      # Same steps as above
```

## Configuration

### Change Target URL

```bash
# Test against staging
PRODUCTION_URL=https://staging.tributestream.live npm run test:smoke

# Test against localhost (not recommended - use regular e2e tests)
PRODUCTION_URL=http://localhost:5173 npm run test:smoke
```

### Adjust Timeouts

Edit `frontend/playwright.production.config.ts`:

```typescript
export default defineConfig({
  timeout: 60 * 1000, // Increase to 60 seconds
  // ...
});
```

### Change Browser Coverage

Edit `frontend/playwright.production.config.ts`:

```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'mobile', use: { ...devices['iPhone 12'] } },
  { name: 'tablet', use: { ...devices['iPad Pro'] } }
]
```

## Best Practices

### ✅ DO

- Run after every production deployment
- Run on a schedule (hourly/daily)
- Monitor test results in CI/CD
- Update tests when adding critical features
- Keep tests read-only (no data modification)
- Use retry logic for flaky tests

### ❌ DON'T

- Create test data in production
- Delete production data
- Submit real forms (use validation tests only)
- Hard-code production credentials
- Run tests that send emails
- Perform destructive operations

## Extending the Test Suite

### Add New Critical Journey

1. Open `frontend/e2e/production-smoke.spec.ts`
2. Add new test in the describe block:

```typescript
test('Journey 9: Pricing calculator loads', async ({ page }) => {
  await test.step('1. Navigate to calculator', async () => {
    await page.goto('/calculator');
    await expect(page.locator('h1')).toContainText(/Calculator/i);
  });

  await test.step('2. Verify pricing tiers visible', async () => {
    await expect(page.locator('text=Essential')).toBeVisible();
    await expect(page.locator('text=Premium')).toBeVisible();
  });
});
```

### Add API Endpoint Test

```typescript
test('API: Stream status endpoint responsive', async ({ request }) => {
  const response = await request.get('/api/streams/health', {
    failOnStatusCode: false
  });
  expect([200, 404]).toContain(response.status());
});
```

## Monitoring & Alerts

### Set Up Slack Notifications

Use GitHub Actions + Slack webhook:

```yaml
- name: Notify Slack on Failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: '🚨 Production smoke tests failed!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Track Metrics Over Time

Store test results in your monitoring system:

```typescript
// Add to tests
const metrics = {
  timestamp: new Date().toISOString(),
  loadTime: loadTime,
  testsPassed: 8,
  testsFailed: 0
};
// Send to monitoring service
```

## Troubleshooting

### Tests Failing Due to Slow Load Times

- Check production server performance
- Review PageSpeed Insights
- Increase timeout in config
- Investigate slow API endpoints

### Tests Failing on Mobile but Passing on Desktop

- Review responsive design
- Check mobile-specific JavaScript
- Test on real devices
- Use Playwright trace viewer

### Intermittent Failures

- Increase retries in config (already set to 2)
- Add explicit waits for dynamic content
- Check for race conditions
- Review network conditions

### reCAPTCHA Blocking Tests

Tests should NOT submit forms protected by reCAPTCHA. Only validate that:
- Form fields are present
- Validation works
- reCAPTCHA is loaded

## Maintenance Schedule

- **Weekly:** Review test results, update selectors if needed
- **Monthly:** Add tests for new features
- **Quarterly:** Review and remove obsolete tests
- **After Major Releases:** Run manually before announcement

## Success Metrics

Track these KPIs:
- **Test Pass Rate:** Should be > 95%
- **Test Duration:** Should be < 5 minutes
- **False Positive Rate:** Should be < 5%
- **Coverage:** All critical paths tested

## Integration with Existing Tests

```
📁 Test Strategy Overview
├── Unit Tests (Vitest)           → Individual components
├── Integration Tests (Vitest)    → API endpoints, services
├── E2E Tests (Playwright)        → Full user flows (dev/staging)
└── Smoke Tests (Playwright)      → Critical paths (production)
    ↑ YOU ARE HERE
```

Smoke tests complement your existing test suite by providing:
- **Production verification** (existing tests run on dev/staging)
- **Continuous monitoring** (existing tests run on PRs)
- **Critical path focus** (existing tests are comprehensive)

## Files Created

```
frontend/
├── e2e/
│   └── production-smoke.spec.ts          # Test suite
├── playwright.production.config.ts       # Production config
└── package.json                           # Updated with scripts
```

## Next Steps

1. **Run your first smoke test:**
   ```bash
   cd frontend
   npm run test:smoke
   ```

2. **Review the report:**
   ```bash
   npm run test:smoke:report
   ```

3. **Set up CI/CD integration** (see GitHub Actions example above)

4. **Schedule regular runs** (recommended: after each deployment + every 6 hours)

5. **Add monitoring alerts** for test failures

---

## Questions?

- Review test output: `npm run test:smoke:report`
- Debug interactively: `npm run test:smoke:ui`
- Check Playwright docs: https://playwright.dev
