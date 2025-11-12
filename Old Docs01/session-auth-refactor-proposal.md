# Session & Authentication Refactor Proposal
*Date: September 12, 2025*

## Overview
This document outlines a comprehensive refactor to standardize session management, authentication, and data model consistency across the Tributestream application.

## Current Issues Identified

### 1. Inconsistent Field Names
- Mixed usage of `ownerId` vs `ownerUid`
- Mixed usage of `createdByUserId` vs `ownerUid`
- Inconsistent role checking patterns
- Multiple ways to access user role information

### 2. Race Condition in Authentication
- Client-side navigation after login can occur before session cookie is processed
- Results in authentication failures on subsequent requests

### 3. Firebase Configuration Inconsistencies
- Client-side config hardcoded instead of using environment variables
- Complex emulator detection logic with multiple fallback paths

### 4. Session Security Concerns
- Missing `sameSite` attribute on session cookies
- 5-day session duration may be excessive

## Proposed Standardized Naming Conventions

### User Object Structure
```typescript
interface StandardUser {
  uid: string;                    // Firebase user ID (primary key)
  email: string | null;           // User email address
  displayName?: string;           // User display name
  role: 'admin' | 'owner' | 'funeral_director';  // Primary role
  isAdmin: boolean;               // Admin privileges flag
}
```

### Memorial Object Structure
```typescript
interface StandardMemorial {
  id: string;                     // Memorial document ID
  ownerUid: string;              // Memorial owner's Firebase UID
  funeralDirectorUid?: string;   // Assigned funeral director's UID
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
  // ... other memorial fields
}
```

### Session Context Structure
```typescript
interface SessionContext {
  user: StandardUser | null;     // Authenticated user or null
}
```

## Refactor Implementation Plan

### Phase 1: Data Model Standardization

#### 1.1 Memorial Field Migration
- [ ] Update all Firestore queries to use `ownerUid` consistently
- [ ] Update all Firestore queries to use `funeralDirectorUid` consistently
- [ ] Remove references to deprecated `ownerId`, `createdByUserId` fields
- [ ] Update memorial access utilities to use standard field names

#### 1.2 User Role Standardization
- [ ] Consolidate role checking to use `locals.user.role` as primary source
- [ ] Update custom claims structure to be consistent
- [ ] Remove redundant role checking patterns

### Phase 2: Authentication Flow Improvements

#### 2.1 Fix Race Condition
- [ ] Replace client-side `goto()` with server-side redirects after login
- [ ] Update `/api/session` endpoint to handle redirects server-side
- [ ] Test authentication flow to ensure session persistence

#### 2.2 Session Security Enhancements
- [ ] Add `sameSite: 'lax'` to session cookie options
- [ ] Reduce session duration from 5 days to 24 hours
- [ ] Implement session refresh mechanism
- [ ] Add session invalidation on logout

### Phase 3: Firebase Configuration Cleanup

#### 3.1 Environment Variable Migration
- [ ] Move client-side Firebase config to environment variables
- [ ] Simplify server-side initialization logic
- [ ] Create consistent dev/prod configuration patterns

#### 3.2 Emulator Connection Standardization
- [ ] Standardize emulator detection and connection logic
- [ ] Add proper error handling for emulator connection failures
- [ ] Document emulator setup requirements

### Phase 4: API Route Consistency

#### 4.1 Authentication Middleware
- [ ] Ensure all protected routes use consistent auth checking
- [ ] Standardize error responses for authentication failures
- [ ] Add consistent logging for auth events

#### 4.2 Permission Checking
- [ ] Update all memorial access checks to use `MemorialAccessVerifier`
- [ ] Remove duplicate permission checking logic
- [ ] Ensure consistent access level responses

## File-by-File Changes Required

### Core Authentication Files
- `src/hooks.server.ts` - Update user object structure
- `src/lib/auth.ts` - Standardize User interface
- `src/routes/api/session/+server.ts` - Fix race condition, add security headers

### Memorial Access Files
- `src/lib/utils/memorialAccess.ts` - Update field name references
- `src/lib/server/memorialMiddleware.ts` - Standardize user context creation

### API Routes (High Priority)
- `src/routes/api/memorials/[memorialId]/**` - Update field references
- `src/routes/api/funeral-director/**` - Standardize role checking
- `src/routes/api/create-payment-intent/+server.ts` - Fix field name inconsistencies

### Component Files
- `src/lib/components/Login.svelte` - Update post-login navigation
- Profile and dashboard components - Update user object references

## Testing Requirements

### Unit Tests
- [ ] Update memorial access utility tests for new field names
- [ ] Test session creation and verification flows
- [ ] Test role-based permission checking

### Integration Tests
- [ ] Test complete authentication flow from login to protected route access
- [ ] Test session persistence across page reloads
- [ ] Test emulator vs production Firebase connections

### Security Tests
- [ ] Verify session cookie security attributes
- [ ] Test session expiration and refresh
- [ ] Validate permission checking across all protected routes

## Migration Strategy

### Database Migration
1. **Dual Field Support**: Temporarily support both old and new field names
2. **Gradual Migration**: Update code to write to new fields while reading from both
3. **Data Migration Script**: Batch update existing documents to use new field names
4. **Cleanup**: Remove old field support after migration is complete

### Deployment Strategy
1. **Feature Flag**: Use environment variable to toggle new authentication flow
2. **Staged Rollout**: Deploy to development environment first
3. **Monitoring**: Add extensive logging during transition period
4. **Rollback Plan**: Maintain ability to revert to old field names if issues arise

## Success Criteria

### Performance Metrics
- Zero authentication failures due to race conditions
- Consistent session behavior across all browsers
- Improved page load times due to reduced auth complexity

### Security Metrics
- All session cookies have proper security attributes
- No unauthorized access to protected resources
- Proper session invalidation on logout

### Developer Experience
- Single source of truth for user object structure
- Consistent patterns for permission checking
- Simplified Firebase configuration management

## Timeline Estimate

- **Phase 1**: 2-3 days (Data model standardization)
- **Phase 2**: 2-3 days (Authentication improvements)
- **Phase 3**: 1-2 days (Firebase config cleanup)
- **Phase 4**: 1-2 days (API route consistency)
- **Testing & Migration**: 2-3 days

**Total Estimated Time**: 8-13 days

## Risk Assessment

### High Risk
- Database field migrations could cause data inconsistency
- Authentication changes could lock out users temporarily

### Medium Risk
- Firebase configuration changes could affect emulator connectivity
- Session duration changes could impact user experience

### Low Risk
- Code standardization should not affect functionality
- Logging improvements are additive only

## Conclusion

This refactor will significantly improve the consistency, security, and maintainability of the authentication system while resolving the identified race condition and data model inconsistencies. The phased approach allows for careful testing and rollback capabilities at each stage.
