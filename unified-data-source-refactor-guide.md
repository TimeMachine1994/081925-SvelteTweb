# Complete Website Refactoring Guide: Unified Data Source Architecture

## Executive Summary

This guide outlines a comprehensive refactoring strategy to transform our current multi-collection Firestore architecture into a unified, user-centric data model. By consolidating `users`, `memorials`, and `bookings` collections into a single hierarchical structure, we will achieve improved data integrity, simplified queries, and better maintainability.

## Current Architecture Analysis

### Existing Collections
1. **`users`** - User profiles and authentication data
2. **`memorials`** - Memorial pages and metadata
3. **`bookings`** - Service bookings and calculator state

### Key Relationships
- Memorials are linked to users via `createdByUserId`
- Bookings are linked to users via `userId`
- Bookings can be linked to memorials via `memorialId`

## Target Architecture: Unified User-Centric Model

### Hierarchical Structure
```
users/
├── {userId}/
│   ├── profile (document fields)
│   ├── memorials/
│   │   └── {memorialId}/
│   │       ├── memorial data
│   │       ├── photos/
│   │       ├── embeds/
│   │       └── followers/
│   └── bookings/
│       └── {bookingId}/
│           └── booking data
```

## Step-by-Step Implementation Guide

### Phase 1: Schema Design and Type Definitions

#### Step 1.1: Update TypeScript Interfaces
Create new unified type definitions that reflect the hierarchical structure:

```typescript
// lib/types/unified.ts
export interface UnifiedUser {
  // User profile fields
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  role: 'owner' | 'admin' | 'user';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Subcollections (not stored, but referenced)
  memorials?: Memorial[];  // subcollection
  bookings?: Booking[];    // subcollection
}

export interface UnifiedMemorial extends Memorial {
  // All existing Memorial fields
  // Plus reference to parent user
  parentUserId: string;
}

export interface UnifiedBooking extends Booking {
  // All existing Booking fields
  // Plus reference to parent user
  parentUserId: string;
}
```

#### Step 1.2: Create Data Access Layer
Implement a new data access pattern that abstracts the hierarchical structure:

```typescript
// lib/server/unified-db.ts
export class UnifiedDataAccess {
  async getUserWithMemorials(userId: string) { /* ... */ }
  async getUserBookings(userId: string) { /* ... */ }
  async createMemorial(userId: string, data: Memorial) { /* ... */ }
  async createBooking(userId: string, data: Booking) { /* ... */ }
}
```

### Phase 2: Migration Script Development

#### Step 2.1: Create Migration Utilities
```javascript
// scripts/migrate-to-unified.js
const migrationSteps = {
  1: 'Backup existing data',
  2: 'Migrate memorials to user subcollections',
  3: 'Migrate bookings to user subcollections',
  4: 'Verify data integrity',
  5: 'Update security rules',
  6: 'Delete old collections (after verification)'
};
```

#### Step 2.2: Implement Migration Logic
```javascript
async function migrateMemorials() {
  const memorialsSnapshot = await db.collection('memorials').get();
  const batch = db.batch();
  
  for (const doc of memorialsSnapshot.docs) {
    const memorial = doc.data();
    const userId = memorial.createdByUserId;
    
    if (userId) {
      const newRef = db
        .collection('users')
        .doc(userId)
        .collection('memorials')
        .doc(doc.id);
      
      batch.set(newRef, {
        ...memorial,
        parentUserId: userId,
        migratedAt: Timestamp.now()
      });
    }
  }
  
  await batch.commit();
}
```

### Phase 3: Code Refactoring

#### Step 3.1: Update Data Access Patterns

**Before (Old Pattern):**
```typescript
// Old: Direct collection access
const memorials = await db.collection('memorials')
  .where('createdByUserId', '==', userId)
  .get();
```

**After (New Pattern):**
```typescript
// New: Hierarchical access
const memorials = await db.collection('users')
  .doc(userId)
  .collection('memorials')
  .get();
```

#### Step 3.2: Refactor Key Components

##### Registration Flows
- `frontend/src/routes/register/funeral-director/+page.server.ts`
- `frontend/src/routes/register/loved-one/+page.server.ts`

##### Calculator and Booking System
- `frontend/src/routes/app/calculator/+page.server.ts`
- `frontend/src/routes/api/bookings/**/*.ts`

##### My Portal
- `frontend/src/routes/my-portal/+page.server.ts`
- `frontend/src/routes/my-portal/tributes/**/*.ts`

#### Step 3.3: Update API Endpoints
All API routes need to be updated to use the new hierarchical paths:

```typescript
// Example: Update booking API
// frontend/src/routes/api/bookings/[bookingId]/+server.ts

export async function GET({ params, locals }) {
  const { bookingId } = params;
  const userId = locals.user?.uid;
  
  if (!userId) {
    return error(401, 'Unauthorized');
  }
  
  // New hierarchical query
  const bookingDoc = await db
    .collection('users')
    .doc(userId)
    .collection('bookings')
    .doc(bookingId)
    .get();
    
  // ... rest of the logic
}
```

### Phase 4: Security Rules Update

#### Step 4.1: Update Firestore Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User document rules
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Memorial subcollection rules
      match /memorials/{memorialId} {
        allow read: if resource.data.isPublic == true || 
                      request.auth.uid == userId;
        allow create: if request.auth.uid == userId;
        allow update: if request.auth.uid == userId;
        allow delete: if request.auth.uid == userId;
      }
      
      // Booking subcollection rules
      match /bookings/{bookingId} {
        allow read: if request.auth.uid == userId;
        allow write: if request.auth.uid == userId;
      }
    }
  }
}
```

### Phase 5: Testing Strategy

#### Step 5.1: Unit Tests
Update all unit tests to reflect the new data structure:

```typescript
// Example test update
describe('Memorial Creation', () => {
  it('should create memorial in user subcollection', async () => {
    const userId = 'test-user-123';
    const memorialData = { /* ... */ };
    
    await createMemorial(userId, memorialData);
    
    const memorial = await db
      .collection('users')
      .doc(userId)
      .collection('memorials')
      .doc(memorialData.id)
      .get();
    
    expect(memorial.exists).toBe(true);
  });
});
```

#### Step 5.2: Integration Tests
Test complete user flows:
1. User registration → Memorial creation → Booking creation
2. Data retrieval from My Portal
3. Public memorial access
4. Calculator flow with booking save

#### Step 5.3: Migration Verification
```javascript
// scripts/verify-migration.js
async function verifyMigration() {
  const checks = [
    verifyUserCount(),
    verifyMemorialCount(),
    verifyBookingCount(),
    verifyDataIntegrity(),
    verifyRelationships()
  ];
  
  const results = await Promise.all(checks);
  return results.every(result => result.success);
}
```

### Phase 6: Deployment Strategy

#### Step 6.1: Pre-Deployment Checklist
- [ ] Complete backup of all Firestore collections
- [ ] Test migration script in staging environment
- [ ] Update all environment variables
- [ ] Prepare rollback plan
- [ ] Notify team of maintenance window

#### Step 6.2: Deployment Steps
1. **Enable Maintenance Mode** - Display maintenance page to users
2. **Backup Data** - Create complete Firestore export
3. **Run Migration** - Execute migration script
4. **Deploy Code** - Deploy updated application code
5. **Update Security Rules** - Apply new Firestore security rules
6. **Verify Deployment** - Run smoke tests
7. **Monitor** - Watch for errors and performance issues
8. **Disable Maintenance Mode** - Resume normal operations

#### Step 6.3: Post-Deployment Verification
```bash
# Run verification scripts
npm run verify:migration
npm run test:integration
npm run test:e2e
```

### Phase 7: Optimization and Cleanup

#### Step 7.1: Index Optimization
Create composite indexes for common queries:

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "memorials",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isPublic", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

#### Step 7.2: Performance Monitoring
Implement performance tracking:

```typescript
// lib/monitoring/performance.ts
export function trackQueryPerformance(queryName: string) {
  const start = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - start;
      console.log(`Query ${queryName} took ${duration}ms`);
      // Send to analytics service
    }
  };
}
```

## Benefits of Unified Architecture

### 1. Data Integrity
- Automatic cascade deletes when user is removed
- Stronger referential integrity
- Reduced orphaned data

### 2. Query Efficiency
- No need for complex joins or multiple queries
- Direct access to user's data
- Better performance for user-specific operations

### 3. Security
- Simplified security rules
- Clearer permission boundaries
- Easier to implement row-level security

### 4. Maintainability
- Single source of truth for user data
- Clearer data relationships
- Easier to understand and modify

### 5. Scalability
- Better data locality
- Reduced cross-collection queries
- More efficient caching strategies

## Risk Mitigation

### Potential Risks and Mitigations

1. **Data Loss During Migration**
   - Mitigation: Complete backups, staged migration, verification scripts

2. **Application Downtime**
   - Mitigation: Maintenance window, feature flags, gradual rollout

3. **Performance Degradation**
   - Mitigation: Index optimization, query monitoring, caching

4. **Backward Compatibility**
   - Mitigation: Dual-write period, compatibility layer, phased deprecation

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Schema Design | 2 days | Team review |
| Phase 2: Migration Script | 3 days | Schema approval |
| Phase 3: Code Refactoring | 5-7 days | Migration script ready |
| Phase 4: Security Rules | 1 day | Code refactoring |
| Phase 5: Testing | 3-4 days | All code complete |
| Phase 6: Deployment | 1 day | Testing complete |
| Phase 7: Optimization | 2 days | Deployment stable |

**Total Estimated Time: 17-20 days**

## Success Metrics

### Key Performance Indicators
1. **Query Performance**: 30% reduction in average query time
2. **Data Consistency**: 100% referential integrity
3. **Code Complexity**: 40% reduction in data access code
4. **Error Rate**: <0.1% migration errors
5. **User Experience**: No degradation in page load times

## Conclusion

This unified data architecture represents a significant improvement in our application's data management strategy. By centralizing around the user model and leveraging Firestore's hierarchical structure, we create a more maintainable, performant, and secure application.

The migration path is designed to be incremental and reversible, minimizing risk while maximizing the benefits of the new architecture. With proper testing and monitoring, this refactoring will provide a solid foundation for future feature development and scaling.