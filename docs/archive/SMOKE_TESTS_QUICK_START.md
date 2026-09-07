# Production Smoke Tests - Quick Start

## What You Have Now

✅ **Production Smoke Test Suite** - 8 critical user journeys + 2 API health checks  
✅ **Playwright Configuration** - Optimized for production testing  
✅ **npm Scripts** - Easy commands to run tests  
✅ **GitHub Actions Workflow** - Automated testing every 6 hours  
✅ **Comprehensive Documentation** - Full guide in `PRODUCTION_SMOKE_TESTS.md`

## Run Your First Test (3 Steps)

### 1. Install Playwright Browsers (One-Time Setup)

```bash
cd frontend
npx playwright install
```

### 2. Run the Tests

```bash
npm run test:smoke
```

This will:
- Test your live production site at `https://tributestream.live`
- Run 10 tests (8 user journeys + 2 API checks)
- Take ~2-3 minutes
- Generate HTML report

### 3. View Results

```bash
npm run test:smoke:report
```

Opens an interactive HTML report showing:
- ✅ All passed tests
- ❌ Any failures with screenshots
- 📹 Video recordings of failures
- ⏱️ Performance metrics

## What Gets Tested?

### Critical User Journeys
1. **Homepage & Search** - Can visitors find memorials?
2. **Registration** - Can users sign up?
3. **Login** - Can users log in?
4. **Marketing Pages** - Do landing pages work?
5. **Contact Form** - Can users reach support?
6. **Navigation** - Does site navigation work?
7. **Performance** - Does homepage load < 10 seconds?
8. **Blog** - Is content accessible?

### API Health Checks
- Contact form API
- Memorial search API

## Safe for Production ✅

These tests:
- **Read data only** - No modifications
- **Don't create accounts** - Only validates forms
- **Don't submit forms** - Only tests validation
- **Don't send emails** - Validation only
- **Don't delete anything** - Read-only

## When to Run

### Manually
```bash
npm run test:smoke          # Run all tests
npm run test:smoke:ui       # Interactive debugging
npm run test:smoke:report   # View results
```

### Automatically (Already Set Up!)
Your GitHub Actions workflow runs:
- ⏰ **Every 6 hours** - Continuous monitoring
- 🚀 **After deployments** - Verify changes
- 👆 **Manually** - On-demand via GitHub UI

## Interpreting Results

### All Tests Pass ✅
Your MVP is operational! All critical paths working.

### Some Tests Fail ❌
1. Run `npm run test:smoke:report`
2. Click on failed test
3. View screenshots/video
4. Fix the issue
5. Re-run tests

### Common Issues

#### ❌ Test: "Homepage loads within acceptable time"
- **Cause:** Slow server or network
- **Action:** Check production server performance

#### ❌ Test: "Navigation works"
- **Cause:** Broken links or JS errors
- **Action:** Review navigation code

#### ❌ Test: "Memorial discovery"
- **Cause:** No public memorials or search broken
- **Action:** Verify search functionality

## Next Steps

### 1. Run Your First Test
```bash
cd frontend
npm run test:smoke
```

### 2. Review the Report
```bash
npm run test:smoke:report
```

### 3. Add Tests for New Features
Edit `frontend/e2e/production-smoke.spec.ts` to add:
- Payment flow validation
- Stream creation checks
- Admin portal access
- Calculator functionality

Example:
```typescript
test('Journey 9: Calculator loads', async ({ page }) => {
  await page.goto('/calculator');
  await expect(page.locator('h1')).toContainText(/Calculator/i);
  await expect(page.locator('text=Essential')).toBeVisible();
});
```

### 4. Enable GitHub Actions
The workflow is already created at `.github/workflows/production-smoke-tests.yml`

To enable:
1. Push to GitHub
2. Go to **Actions** tab
3. Enable workflows
4. Tests will run automatically every 6 hours

### 5. Set Up Notifications (Optional)

Add Slack notification to GitHub Actions:
```yaml
- name: Notify Slack
  if: failure()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
    -H 'Content-Type: application/json' \
    -d '{"text":"🚨 Production smoke tests failed!"}'
```

## Troubleshooting

### "Executable doesn't exist" Error
```bash
cd frontend
npx playwright install
```

### Tests Hang or Timeout
- Check internet connection
- Verify production site is accessible
- Increase timeout in `playwright.production.config.ts`

### All Tests Fail
- Verify `PRODUCTION_URL` is correct
- Check if site is down: `curl https://tributestream.live`
- Run with headed browser: `npm run test:smoke -- --headed`

## Resources

- **Full Documentation:** `PRODUCTION_SMOKE_TESTS.md`
- **Test File:** `frontend/e2e/production-smoke.spec.ts`
- **Config:** `frontend/playwright.production.config.ts`
- **Playwright Docs:** https://playwright.dev

## Questions?

Run tests with UI for debugging:
```bash
npm run test:smoke:ui
```

This opens Playwright's interactive UI where you can:
- Step through tests
- See live browser
- Inspect elements
- Debug failures

---

**You're all set!** Run `npm run test:smoke` to verify your production site is working. 🚀
