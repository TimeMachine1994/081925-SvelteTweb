# Complete Testing Strategy for Tributestream

## 🎯 Two Types of Tests - When to Use Which

### 1. **Production Smoke Tests** (Read-Only)
**File:** `frontend/e2e/production-smoke.spec.ts`

**What it does:**
- ✅ Tests pages load correctly
- ✅ Tests forms are present
- ✅ Tests navigation works
- ✅ Tests APIs respond
- ❌ Does NOT create data
- ❌ Does NOT modify database

**Run on:** `https://tributestream.com` (PRODUCTION)

```bash
cd frontend
npm run test:smoke              # Run on production
npm run test:smoke -- --headed  # Watch browser
npm run test:smoke:ui           # Interactive mode
```

**Safe for:** ✅ Production, anytime, any frequency

---

### 2. **End-to-End Tests** (Creates Real Data)
**Files:** 
- `frontend/e2e/full-user-journey.spec.ts` (NEW - complete flow)
- `frontend/e2e/memorial/family-registration.spec.ts`
- `frontend/e2e/memorial/calculator-flow.spec.ts`
- `frontend/e2e/auth/login.spec.ts`
- `frontend/e2e/streaming/stream-management.spec.ts`

**What it does:**
- ✅ Registers real users
- ✅ Creates memorials
- ✅ Saves to database
- ✅ Tests full API endpoints
- ✅ Modifies data
- ⚠️ Creates test data that needs cleanup

**Run on:** `http://localhost:5173` or staging (NOT PRODUCTION!)

```bash
cd frontend
npm run test:e2e              # Run all E2E tests
npm run test:e2e -- --headed  # Watch browser
npm run test:e2e:ui           # Interactive mode
```

**Safe for:** ✅ Development, ✅ Staging, ❌ Production

---

## 📊 Complete Testing Matrix

| Test Type | Creates Data? | Run On | Frequency | Purpose |
|-----------|--------------|--------|-----------|---------|
| **Smoke Tests** | ❌ No | Production | Every 6 hours | Verify MVP works |
| **E2E Tests** | ✅ Yes | Dev/Staging | Every PR | Test full functionality |
| **Unit Tests** | ❌ No | Dev | Every commit | Test components |
| **Integration Tests** | ❌ No | Dev | Every PR | Test APIs |

---

## 🚀 Your New Complete E2E Test

**File:** `frontend/e2e/full-user-journey.spec.ts`

This test covers the EXACT flow you described:

### Test Flow
1. ✅ **Register new owner** - Creates user in Firebase Auth + Firestore
2. ✅ **Create memorial** - Saves memorial document to Firestore
3. ✅ **Navigate to stream management** - Tests routing
4. ✅ **Create livestream** - Creates stream with RTMP credentials
5. ✅ **Configure service details** - Tests calculator/scheduler
6. ✅ **Verify database save** - Confirms data persisted correctly
7. ✅ **Test API endpoints** - Direct API validation

### Run It
```bash
cd frontend
npm run test:e2e -- full-user-journey  # Run just this test
npm run test:e2e:headed -- full-user-journey  # Watch it work
```

---

## 🎭 Testing Environments

### Production Environment
```bash
# Only run smoke tests (read-only)
npm run test:smoke
```

**Configuration:** Points to `https://tributestream.com`  
**Data:** No data created  
**Frequency:** Every 6 hours (automated)

### Development Environment
```bash
# Start dev server first
npm run dev

# Then run E2E tests in another terminal
npm run test:e2e
```

**Configuration:** Points to `http://localhost:5173`  
**Data:** Creates test data in dev database  
**Frequency:** Every PR, before deployment

### Staging Environment (Recommended!)
```bash
# Run E2E tests against staging
PLAYWRIGHT_BASE_URL=https://staging.tributestream.com npm run test:e2e
```

**Configuration:** Points to staging URL  
**Data:** Creates test data in staging database  
**Frequency:** Before production deployments

---

## 📝 How to Run Tests

### Quick Reference

```bash
cd frontend

# ===== PRODUCTION TESTS (Safe) =====
npm run test:smoke              # Test production site
npm run test:smoke:report       # View results

# ===== DEVELOPMENT TESTS (Creates Data) =====
npm run test:e2e                # All E2E tests
npm run test:e2e:headed         # Watch browser
npm run test:e2e:ui             # Interactive UI

# ===== SPECIFIC TESTS =====
npm run test:e2e -- full-user-journey        # Complete flow
npm run test:e2e -- family-registration      # Registration only
npm run test:e2e -- calculator-flow          # Calculator only

# ===== UNIT TESTS =====
npm run test:unit               # Component tests
npm run test:unit:watch         # Watch mode
```

---

## 🧹 Test Data Cleanup

E2E tests create real data. You have cleanup scripts:

```bash
cd frontend

# Clean test users (emails starting with "test.")
npm run test:clean

# Or run manual cleanup
node scripts/clean-test-data.js
```

**Auto-cleanup:** E2E tests use timestamps in emails (`test.user.1234567890@example.com`) to avoid conflicts.

---

## 🔄 Complete Testing Workflow

### Before Pushing Code
```bash
# 1. Run unit tests
npm run test:unit

# 2. Run E2E tests locally
npm run dev                 # Terminal 1
npm run test:e2e           # Terminal 2

# 3. If all pass, push code
git push
```

### After Deploying to Production
```bash
# Run smoke tests to verify deployment
npm run test:smoke

# Check results
npm run test:smoke:report
```

### Automated (GitHub Actions)
- **On PR:** Runs unit + integration tests
- **After merge:** Runs E2E tests on staging
- **Production:** Smoke tests run every 6 hours

---

## 🎯 What Gets Tested

### Smoke Tests (Production)
- ✅ Homepage loads
- ✅ Search works
- ✅ Registration form exists
- ✅ Login form exists
- ✅ Marketing pages load
- ✅ Contact form exists
- ✅ Navigation works
- ✅ Performance < 10 seconds
- ✅ API endpoints respond

### E2E Tests (Dev/Staging)
- ✅ User registration (full flow)
- ✅ Memorial creation
- ✅ Stream management
- ✅ Service scheduling
- ✅ Payment flow
- ✅ Calculator functionality
- ✅ Database persistence
- ✅ Email sending
- ✅ API integration
- ✅ Authentication flows

---

## 🐛 Troubleshooting

### "Tests creating data on production!"
❌ **STOP!** E2E tests should NEVER run on production.

**Fix:**
```bash
# Check your playwright.config.ts baseURL
# Should be: http://localhost:5173
# NOT: https://tributestream.com
```

### "Smoke tests failing on production"
✅ This is GOOD - it caught a real issue!

**Action:**
1. Run `npm run test:smoke:report` to see details
2. Review failed test screenshots
3. Fix the issue
4. Re-run smoke tests

### "E2E tests failing locally"
Common causes:
1. Dev server not running: `npm run dev`
2. Database not seeded: `npm run test:setup`
3. Firebase emulator not running (if using emulators)

---

## 📈 Continuous Integration Setup

### GitHub Actions Workflow

Already created at `.github/workflows/production-smoke-tests.yml`

**Runs:**
- Every 6 hours automatically
- After deployments (optional)
- Manually via GitHub UI

**To enable:**
1. Push to GitHub
2. Go to Actions tab
3. Enable workflows
4. Tests run automatically

---

## 🎓 Best Practices

### ✅ DO
- Run smoke tests on production frequently
- Run E2E tests before every deployment
- Use unique timestamps in test data
- Clean up test data regularly
- Review test reports after failures
- Update tests when adding features

### ❌ DON'T
- Run E2E tests on production (creates data!)
- Hard-code test credentials
- Skip tests before deploying
- Ignore failing tests
- Commit with .only() in tests
- Delete tests without replacement

---

## 📚 Test File Organization

```
frontend/e2e/
├── production-smoke.spec.ts          # Production smoke tests (read-only)
├── full-user-journey.spec.ts         # Complete E2E flow (creates data)
├── memorial/
│   ├── family-registration.spec.ts   # Registration tests
│   └── calculator-flow.spec.ts       # Calculator tests
├── auth/
│   └── login.spec.ts                 # Authentication tests
└── streaming/
    └── stream-management.spec.ts     # Stream tests
```

---

## 🚦 Quick Decision Guide

**"Should I run this test?"**

```
Is it a production environment?
├── YES → Run smoke tests only (npm run test:smoke)
└── NO  → Safe to run E2E tests (npm run test:e2e)

Did I just deploy to production?
├── YES → Run smoke tests to verify (npm run test:smoke)
└── NO  → Continue development

Am I about to push code?
├── YES → Run E2E tests locally first (npm run test:e2e)
└── NO  → Continue coding

Do I need to verify my API works?
├── Production → Run smoke tests (read-only API checks)
└── Dev/Staging → Run E2E tests (full API integration)
```

---

## 📞 Summary

You now have **BOTH** types of tests:

1. **Smoke Tests** → Safe for production, verify MVP works
2. **E2E Tests** → Test full functionality with real data (dev/staging only)

**Your new complete test:**
`frontend/e2e/full-user-journey.spec.ts` does exactly what you asked:
- ✅ Register user
- ✅ Create memorial
- ✅ Save to database
- ✅ Test APIs
- ✅ Verify everything works

**Run it:**
```bash
cd frontend
npm run dev                                      # Start server
npm run test:e2e:headed -- full-user-journey    # Watch it work!
```

🎉 **You're all set!** Run your tests and verify your entire application works end-to-end!
