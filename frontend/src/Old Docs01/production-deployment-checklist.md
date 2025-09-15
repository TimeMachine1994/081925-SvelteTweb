# Production Deployment Checklist
*Date: September 12, 2025*

## ✅ Completed Refactor Items

### Phase 1: Data Model Standardization
- [x] **Memorial Fields**: Updated to use `ownerUid` and `funeralDirectorUid` consistently
- [x] **User Interface**: Standardized to include `uid`, `email`, `displayName`, `role`, `isAdmin`
- [x] **Livestream Models**: Deprecated `CalculatorConfig` in favor of `LivestreamConfig`
- [x] **Type Definitions**: Updated `memorial.ts`, `auth.ts`, and `app.d.ts`

### Phase 2: Authentication Security
- [x] **Race Condition Fix**: Login now uses `window.location.href` instead of `goto()`
- [x] **Session Security**: Added `sameSite: 'lax'` attribute to session cookies
- [x] **Session Duration**: Reduced from 5 days to 24 hours
- [x] **User Context**: Standardized `locals.user` structure across all routes

### Phase 3: Firebase Configuration
- [x] **Environment Variables**: Moved Firebase config to `PUBLIC_FIREBASE_*` env vars
- [x] **Configuration File**: Updated `.env.example` with Firebase variables
- [x] **Client Setup**: Updated `firebase.ts` to use environment variables

### Phase 4: API Route Consistency
- [x] **Memorial Access**: Updated utilities to use standardized field names
- [x] **Permission Checking**: Consistent `ownerUid`/`funeralDirectorUid` checks
- [x] **Payment API**: Fixed field name inconsistencies in Stripe integration

## 🚀 Pre-Production Deployment Steps

### Environment Setup
- [ ] Copy Firebase configuration values to production `.env` file
- [ ] Verify all `PUBLIC_FIREBASE_*` environment variables are set
- [ ] Ensure Firebase Admin SDK service account key is configured
- [ ] Test Firebase emulator connections work in development

### Database Migration (If Needed)
- [ ] **Backup existing data** before any field migrations
- [ ] Run migration script to update `createdByUserId` → `ownerUid` (if needed)
- [ ] Verify all memorial documents have `ownerUid` field
- [ ] Test memorial access with new field structure

### Security Verification
- [ ] Verify session cookies have `sameSite: 'lax'` in production
- [ ] Test authentication flow end-to-end
- [ ] Confirm 24-hour session expiration works correctly
- [ ] Validate all protected routes require authentication

### Testing Checklist
- [ ] **Unit Tests**: Run all memorial access utility tests
- [ ] **Integration Tests**: Test complete login → dashboard flow
- [ ] **Role Tests**: Verify admin, owner, funeral_director permissions
- [ ] **API Tests**: Test all memorial CRUD operations
- [ ] **Payment Tests**: Verify Stripe integration with new field names

### Performance & Monitoring
- [ ] Add logging for authentication failures
- [ ] Monitor session creation/verification performance
- [ ] Set up alerts for authentication errors
- [ ] Verify Firebase connection stability

## 🔧 Configuration Files to Update

### Required Environment Variables
```bash
# Firebase Client (Public)
PUBLIC_FIREBASE_API_KEY="AIzaSyAXmTxzYRc-LhMEW75nZjjjQCZov1gpiw0"
PUBLIC_FIREBASE_AUTH_DOMAIN="fir-tweb.firebaseapp.com"
PUBLIC_FIREBASE_PROJECT_ID="fir-tweb"
PUBLIC_FIREBASE_STORAGE_BUCKET="fir-tweb.firebasestorage.app"
PUBLIC_FIREBASE_MESSAGING_SENDER_ID="509455146790"
PUBLIC_FIREBASE_APP_ID="1:509455146790:web:7ec99527214b05d7b9ebe7"

# Firebase Admin (Private)
PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY="{ ... }"
PRIVATE_FIREBASE_STORAGE_BUCKET="fir-tweb.firebasestorage.app"

# Other existing variables
SENDGRID_API_KEY="..."
STRIPE_SECRET_KEY="..."
# etc.
```

### Files Modified in Refactor
- `src/lib/auth.ts` - Standardized User interface
- `src/lib/types/memorial.ts` - Updated field names
- `src/lib/types/livestream.ts` - Deprecated CalculatorConfig
- `src/hooks.server.ts` - Updated user object creation
- `src/lib/components/Login.svelte` - Fixed race condition
- `src/routes/api/session/+server.ts` - Added security headers
- `src/lib/firebase.ts` - Environment variable configuration
- `src/app.d.ts` - Standardized type definitions
- `src/lib/utils/memorialAccess.ts` - Updated field references

## 🎯 Success Metrics

### Authentication
- Zero login failures due to race conditions
- Session persistence across page reloads
- Proper role-based access control

### Performance
- Fast Firebase connection establishment
- Efficient session verification
- Minimal authentication overhead

### Security
- All session cookies have security attributes
- No unauthorized access to protected resources
- Proper session invalidation

## 🚨 Rollback Plan

If issues arise after deployment:

1. **Immediate**: Revert to previous deployment
2. **Database**: Restore from backup if field migrations cause issues
3. **Configuration**: Switch back to hardcoded Firebase config if env vars fail
4. **Authentication**: Increase session duration back to 5 days if 24h causes UX issues

## 📋 Post-Deployment Verification

- [ ] Test login flow with all three user roles
- [ ] Verify memorial creation and access permissions
- [ ] Check livestream functionality works correctly
- [ ] Confirm payment processing uses correct field names
- [ ] Monitor error logs for authentication issues
- [ ] Validate session security headers in browser dev tools

## 🔄 Future Improvements

### Session Management
- Implement session refresh before expiration
- Add "Remember Me" option for longer sessions
- Consider JWT tokens for stateless authentication

### Data Model
- Add database indexes for `ownerUid` and `funeralDirectorUid`
- Implement soft deletes for memorials
- Add audit trail for memorial modifications

### Security
- Add rate limiting to authentication endpoints
- Implement CSRF protection
- Consider multi-factor authentication for admin users

---

**Deployment Status**: Ready for production with standardized naming conventions and improved security.
