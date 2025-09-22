# TributeStream V1 - Refactor Guide for Remaining Discrepancies

## Overview
This guide identifies remaining discrepancies between documentation and implementation that require code refactoring to achieve full alignment. These are areas where the codebase should be updated to match the documented architecture.

## Priority 1: Critical Discrepancies (Immediate Action Required)

### 1. **API Endpoint Verification & Standardization**

#### Issue
Documentation lists many API endpoints that may not exist or have inconsistent implementations.

#### Required Actions
```bash
# Audit all documented endpoints
/api/admin/users                    # Verify implementation
/api/admin/stats                    # Check response format
/api/admin/audit-logs               # Validate filtering
/api/funeral-director/profile       # Confirm CRUD operations
/api/memorials/[id]/livestream      # Check all methods
/api/memorials/[id]/stream/mobile   # Verify mobile streaming
```

#### Refactor Steps
1. **Audit Phase**: Check each documented endpoint against actual files
2. **Implementation Phase**: Create missing endpoints with proper TypeScript interfaces
3. **Standardization Phase**: Ensure consistent response formats
4. **Testing Phase**: Add endpoint tests for all APIs

#### Expected Files to Create/Update
```
/routes/api/admin/users/+server.ts
/routes/api/admin/stats/+server.ts
/routes/api/funeral-director/profile/+server.ts
/routes/api/memorials/[memorialId]/stream/mobile/+server.ts
```

### 2. **Memorial Interface Legacy Field Cleanup**

#### Issue
Memorial interface contains many legacy fields that create confusion and potential bugs.

#### Current Legacy Fields
```typescript
// DEPRECATED - Should be removed after migration
memorialDate?: string;
memorialTime?: string;
memorialLocationName?: string;
memorialLocationAddress?: string;
serviceDate?: string;
serviceTime?: string;
location?: string;
duration?: number;
```

#### Refactor Steps
1. **Data Migration Script**: Convert legacy fields to `services` structure
2. **Component Updates**: Remove references to legacy fields
3. **API Updates**: Update all endpoints to use `services` structure only
4. **Database Cleanup**: Remove legacy fields from Firestore documents

#### Migration Script Template
```typescript
// scripts/migrate-memorial-services.ts
export async function migrateMemorialServices() {
  const memorials = await db.collection('memorials').get();
  
  for (const doc of memorials.docs) {
    const data = doc.data();
    
    if (data.memorialDate || data.memorialTime || data.memorialLocationName) {
      const services = {
        main: {
          location: {
            name: data.memorialLocationName || '',
            address: data.memorialLocationAddress || '',
            isUnknown: !data.memorialLocationName
          },
          time: {
            date: data.memorialDate || data.serviceDate || null,
            time: data.memorialTime || data.serviceTime || null,
            isUnknown: !data.memorialDate && !data.serviceDate
          },
          hours: data.duration || 2
        },
        additional: []
      };
      
      await doc.ref.update({
        services,
        // Remove legacy fields
        memorialDate: admin.firestore.FieldValue.delete(),
        memorialTime: admin.firestore.FieldValue.delete(),
        memorialLocationName: admin.firestore.FieldValue.delete(),
        memorialLocationAddress: admin.firestore.FieldValue.delete(),
        serviceDate: admin.firestore.FieldValue.delete(),
        serviceTime: admin.firestore.FieldValue.delete(),
        location: admin.firestore.FieldValue.delete(),
        duration: admin.firestore.FieldValue.delete()
      });
    }
  }
}
```

### 3. **Component Test Coverage Gaps**

#### Issue
Documentation references test files that may not exist or have incomplete coverage.

#### Required Test Files (To Verify/Create)
```
/lib/components/AdminPortal.test.ts
/lib/components/DevRoleSwitcher.test.ts
/lib/components/Login.test.ts
/lib/components/Profile.test.ts
/lib/components/calculator/Calculator.test.ts
/lib/components/calculator/Calculator.simple.test.ts
/lib/components/portals/OwnerPortal.test.ts
```

#### Refactor Steps
1. **Audit Existing Tests**: Check which test files actually exist
2. **Create Missing Tests**: Implement tests for undocumented components
3. **Update Test Patterns**: Ensure all tests use Svelte 5 testing patterns
4. **Coverage Analysis**: Verify test coverage meets standards

## Priority 2: Important Discrepancies (Next Sprint)

### 4. **Firestore Security Rules Alignment**

#### Issue
Security rules may not align with documented access patterns.

#### Required Actions
```javascript
// firestore.rules - Update to match documented access patterns
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Memorial access rules
    match /memorials/{memorialId} {
      allow read: if isAuthenticated() && 
        (isAdmin() || isOwner(memorialId) || isFuneralDirector(memorialId) || isPublic(memorialId));
      allow write: if isAuthenticated() && 
        (isAdmin() || isOwner(memorialId) || isFuneralDirector(memorialId));
    }
    
    // User access rules
    match /users/{userId} {
      allow read: if isAuthenticated() && 
        (isAdmin() || resource.id == request.auth.uid || createdByFuneralDirector());
      allow write: if isAuthenticated() && 
        (isAdmin() || resource.id == request.auth.uid);
    }
    
    // Audit logs - admin only
    match /audit_logs/{logId} {
      allow read: if isAdmin();
      allow write: if isSystem();
    }
  }
}
```

### 5. **Environment Configuration Standardization**

#### Issue
Environment variables may not match documented configuration.

#### Required `.env` Variables
```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Stripe Configuration  
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=

# Application Configuration
PUBLIC_BASE_URL=
CLOUDFLARE_CUSTOMER_CODE=

# Email Configuration
EMAIL_SERVICE_API_KEY=
EMAIL_FROM_ADDRESS=

# Development
NODE_ENV=development
```

### 6. **Type Definition Consolidation**

#### Issue
Some type definitions may be scattered or duplicated across files.

#### Refactor Actions
1. **Audit Type Usage**: Find duplicate interfaces across files
2. **Consolidate Types**: Move shared types to appropriate files
3. **Update Imports**: Fix import statements throughout codebase
4. **Remove Duplicates**: Delete redundant type definitions

## Priority 3: Nice-to-Have Improvements (Future Sprints)

### 7. **Component Architecture Standardization**

#### Issue
Some components may not follow documented patterns consistently.

#### Standardization Checklist
- [ ] All components use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- [ ] Props are properly typed with TypeScript interfaces
- [ ] Event handling uses `onclick` instead of `on:click`
- [ ] Components follow composition over inheritance pattern
- [ ] Accessibility attributes are properly implemented

### 8. **Database Index Optimization**

#### Issue
Firestore indexes may not match documented query patterns.

#### Required Indexes
```javascript
// Composite indexes needed
memorials: [
  ['ownerUid', 'createdAt'],
  ['funeralDirectorUid', 'createdAt'],
  ['isPublic', 'createdAt'],
  ['slug', 'fullSlug']
]

users: [
  ['role', 'createdAt'],
  ['suspended', 'createdAt'],
  ['email', 'role']
]

audit_logs: [
  ['uid', 'timestamp'],
  ['action', 'timestamp'],
  ['resourceType', 'timestamp'],
  ['success', 'timestamp']
]
```

## Implementation Timeline

### Week 1: Critical Fixes
- [ ] API endpoint audit and creation
- [ ] Memorial interface legacy field cleanup
- [ ] Data migration script implementation

### Week 2: Important Updates
- [ ] Test coverage analysis and creation
- [ ] Firestore security rules update
- [ ] Environment configuration standardization

### Week 3: Quality Improvements
- [ ] Component architecture standardization
- [ ] Type definition consolidation
- [ ] Database index optimization

## Validation Checklist

### Pre-Refactor
- [ ] Create backup of current codebase
- [ ] Document current API endpoints
- [ ] Export current database structure
- [ ] Run full test suite to establish baseline

### During Refactor
- [ ] Test each change incrementally
- [ ] Maintain backward compatibility where possible
- [ ] Update documentation as changes are made
- [ ] Monitor for breaking changes

### Post-Refactor
- [ ] Run full test suite
- [ ] Verify all documented features work
- [ ] Performance testing
- [ ] Security audit
- [ ] Documentation final review

## Risk Mitigation

### High-Risk Changes
1. **Memorial Interface Changes**: Could break existing data
   - **Mitigation**: Implement migration script with rollback capability
   
2. **API Endpoint Changes**: Could break frontend integrations
   - **Mitigation**: Maintain backward compatibility during transition

3. **Database Schema Changes**: Could cause data loss
   - **Mitigation**: Test migration on copy of production data

### Rollback Plan
1. **Code Rollback**: Git branch strategy with tagged releases
2. **Database Rollback**: Firestore backup restoration procedure
3. **Configuration Rollback**: Environment variable version control

## Success Metrics

### Code Quality
- [ ] 100% of documented APIs implemented and tested
- [ ] 0 legacy fields remaining in Memorial interface
- [ ] 90%+ test coverage on critical components
- [ ] 0 TypeScript errors in production build

### Performance
- [ ] Page load times under 2 seconds
- [ ] API response times under 500ms
- [ ] Database query optimization verified

### Documentation Alignment
- [ ] All documented features implemented
- [ ] All implemented features documented
- [ ] Architecture diagrams match codebase structure
- [ ] API documentation matches actual endpoints

This refactor guide provides a systematic approach to eliminating remaining discrepancies and achieving full alignment between documentation and implementation.
