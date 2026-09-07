# Production Integration Tests

## ⚠️ Critical Information

**These tests CREATE and DELETE real data on your production site!**

### Why We Need This

Your APIs don't work properly in localhost because they depend on:
- ✅ Firebase Auth (production credentials)
- ✅ Firestore (production database)
- ✅ Cloudflare Stream (production RTMP)
- ✅ SendGrid Email (production API keys)
- ✅ Other third-party services

**Solution:** Test on production with automatic cleanup.

---

## 🎯 What Gets Tested

### Complete User Journeys
1. **User Registration** - Firebase Auth + Firestore
2. **Memorial Creation** - Database writes, slug generation
3. **Stream Management** - Cloudflare RTMP integration
4. **Service Scheduling** - Calculator/scheduler data persistence
5. **API Endpoints** - Direct API testing

### What Makes It Safe

✅ **Test data is clearly marked**: `test-automated-{timestamp}@example.com`  
✅ **Unique timestamps**: Prevents conflicts between test runs  
✅ **Automatic cleanup**: Deletes data after tests  
✅ **Manual cleanup guide**: If automatic cleanup fails  

---

## 🚀 How to Run

### Basic Usage

```bash
cd frontend

# Run production integration tests
npm run test:prod

# Watch browser in action (recommended first time)
npm run test:prod:headed

# Interactive UI mode
npm run test:prod:ui
```

### What Happens

1. **Opens browser** (headed mode) or runs headless
2. **Navigates to** `https://tributestream.com`
3. **Registers test user** - Creates Firebase Auth account
4. **Creates memorial** - Saves to Firestore
5. **Creates stream** - Generates RTMP credentials via Cloudflare
6. **Schedules service** - Tests calculator/scheduler
7. **Tests APIs** - Direct endpoint validation
8. **Cleanup** - Deletes all test data

**Duration:** ~3-5 minutes

---

## 📊 Test Coverage

### Journey 1: User Registration
```
✅ Navigate to registration page
✅ Fill form with test data
✅ Select owner role
✅ Submit and verify redirect
✅ Verify user authenticated
```
**Tests:** Firebase Auth, Firestore user document, Session creation

### Journey 2: Memorial Creation
```
✅ Login as test user
✅ Click create memorial
✅ Fill memorial details
✅ Verify memorial created
✅ Verify unique slug generated
```
**Tests:** Memorial API, Firestore writes, Slug generation, Algolia indexing

### Journey 3: Stream Management
```
✅ Navigate to stream management
✅ Create new stream
✅ Verify RTMP credentials generated
✅ Verify stream visible
```
**Tests:** Cloudflare integration, RTMP generation, Database persistence

### Journey 4: Service Scheduling
```
✅ Navigate to scheduler
✅ Fill service details
✅ Save service data
✅ Verify data persists on reload
```
**Tests:** Calculator/scheduler, Database updates, Data persistence

### Journey 5: API Health Checks
```
✅ Test memorial search API
✅ Test contact form API
✅ Verify response codes
```
**Tests:** Direct API endpoints

---

## 🧹 Automatic Cleanup

After all tests complete, cleanup automatically:

```javascript
test.afterAll('Cleanup: Delete test data', async () => {
  // Delete memorial
  // Delete user account
  // Clean up streams
});
```

### What Gets Deleted
- ✅ Test user account (`test-automated-{timestamp}@example.com`)
- ✅ Test memorial (`Test Memorial {timestamp}`)
- ✅ Test streams
- ✅ Any associated data

### If Cleanup Fails

Test data is easy to identify:
- **Emails start with:** `test-automated-`
- **Memorial names:** `Test Memorial {timestamp}`
- **Stream titles:** `Test Stream`

**Manual cleanup:**
1. Go to Firebase Console → Authentication
2. Search for `test-automated-`
3. Delete matching users

---

## 🔐 Safety Measures

### Test Data Identification
All test data uses clear prefixes:
```javascript
const testUser = {
  email: `test-automated-${timestamp}@example.com`,
  name: `Test User ${timestamp}`
};

const testMemorial = {
  lovedOneName: `Test Memorial ${timestamp}`
};
```

### Unique Timestamps
Each test run uses `Date.now()` to ensure no conflicts:
```javascript
const timestamp = Date.now(); // e.g., 1700000000000
```

### Cleanup Verification
Console logs show cleanup status:
```
🧹 Starting cleanup of test data...
✅ Deleted memorial: test-memorial-1700000000000
✅ Deleted user account: test-automated-1700000000000@example.com
✅ Cleanup complete
```

---

## 📝 Best Practices

### ✅ DO
- Run tests before major deployments
- Review cleanup logs after each run
- Run with `--headed` first time to see what happens
- Check Firebase for leftover test data weekly
- Run during off-peak hours if concerned about production impact

### ❌ DON'T
- Run tests during high-traffic periods (optional precaution)
- Modify test data prefixes (makes cleanup harder)
- Skip reviewing cleanup logs
- Run tests too frequently (creates unnecessary load)
- Use real user emails for testing

---

## 🔄 Test vs Production Smoke Tests

| Feature | Smoke Tests | Production Integration Tests |
|---------|-------------|------------------------------|
| **Creates Data** | ❌ No | ✅ Yes |
| **Tests APIs** | Partial | ✅ Full |
| **Tests Database** | ❌ No | ✅ Yes |
| **Cleanup Needed** | ❌ No | ✅ Yes |
| **Run Frequency** | Every 6 hours | Before deployments |
| **Duration** | ~2 minutes | ~5 minutes |
| **Safety** | 100% safe | 99% safe (cleanup required) |

### When to Use Which

**Smoke Tests** (`npm run test:smoke`)
- ✅ Continuous monitoring
- ✅ After every deployment
- ✅ Automated schedule
- ✅ Quick health checks

**Production Integration Tests** (`npm run test:prod`)
- ✅ Before major releases
- ✅ After API changes
- ✅ When localhost APIs don't work
- ✅ Full end-to-end validation

---

## 🐛 Troubleshooting

### Tests Fail at Registration
**Possible causes:**
- reCAPTCHA blocking automation
- Firebase Auth rules changed
- Email already exists (cleanup failed)

**Solutions:**
```bash
# Check for existing test users
# Firebase Console → Authentication → Search "test-automated-"

# Run with visible browser to see what's happening
npm run test:prod:headed
```

### Cleanup Fails
**What to do:**
1. Check console output for error details
2. Manually delete test data from Firebase Console
3. Review cleanup logs

**Prevention:**
Tests use unique timestamps, so failed cleanup won't block future runs.

### APIs Return 401/403
**Possible causes:**
- User not authenticated properly
- Session expired
- Permissions issue

**Debug:**
```bash
# Run in UI mode to step through
npm run test:prod:ui
```

### Cloudflare RTMP Not Generated
**Check:**
- Cloudflare Stream API credentials configured
- Stream creation permissions
- Cloudflare account limits

---

## 📈 Continuous Integration

### GitHub Actions (Optional)

```yaml
name: Production Integration Tests

on:
  workflow_dispatch:  # Manual trigger only

jobs:
  prod-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd frontend && npm ci
      - run: cd frontend && npx playwright install chromium
      - run: cd frontend && npm run test:prod
        env:
          PRODUCTION_URL: https://tributestream.com
```

**Recommendation:** Only run manually, not on every commit.

---

## 🎯 Example Test Output

```
Running 5 tests using 1 worker

✓ Journey 1: Register owner and verify database save (15s)
  ✅ User registered: test-automated-1700000000000@example.com
  ✅ User authenticated and redirected correctly

✓ Journey 2: Create memorial and verify database persistence (12s)
  ✅ Memorial creation submitted
  ✅ Memorial created and visible in profile
  ✅ Memorial slug: test-memorial-1700000000000

✓ Journey 3: Create stream and verify RTMP credentials (10s)
  ✅ Stream creation submitted
  ✅ RTMP credentials generated (Cloudflare integration working)

✓ Journey 4: Schedule service and verify data saves (8s)
  ✅ Service details saved
  ✅ Data persisted after reload

✓ Journey 5: Test API endpoints directly (3s)
  ✅ Search API responding: 200
  ✅ Contact API responding: 200

🧹 Starting cleanup of test data...
✅ Deleted memorial: test-memorial-1700000000000
✅ Deleted user account: test-automated-1700000000000@example.com
✅ Cleanup complete

5 passed (48s)
```

---

## 🔧 Configuration

Tests automatically use production URL:
```typescript
test.use({ 
  baseURL: process.env.PRODUCTION_URL || 'https://tributestream.com' 
});
```

**To test different environment:**
```bash
PRODUCTION_URL=https://staging.tributestream.com npm run test:prod
```

---

## 📚 Related Documentation

- **Smoke Tests:** `PRODUCTION_SMOKE_TESTS.md` (read-only)
- **E2E Tests:** `TESTING_STRATEGY.md` (localhost/staging)
- **Quick Start:** `SMOKE_TESTS_QUICK_START.md`

---

## ✨ Summary

You now have **production integration tests** that:
- ✅ Test your full API stack (Firebase, Cloudflare, SendGrid)
- ✅ Work where localhost doesn't (production services)
- ✅ Create and clean up test data automatically
- ✅ Verify end-to-end functionality
- ✅ Safe for production use

**Run your first test:**
```bash
cd frontend
npm run test:prod:headed
```

Watch it create a user, memorial, and stream on your live site, then clean everything up! 🚀
