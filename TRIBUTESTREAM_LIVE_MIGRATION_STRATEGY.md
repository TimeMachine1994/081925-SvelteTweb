# Tributestream Live - Migration Strategy

**Date**: November 4, 2025  
**Status**: Planning Phase

## Overview

This document outlines the strategy for migrating existing memorial-focused data and users to the new Tributestream Live multi-event platform while maintaining 100% backwards compatibility.

---

## Migration Philosophy

### Core Principles
1. **Zero Data Loss**: Every memorial becomes an event
2. **URL Preservation**: All existing memorial URLs continue working
3. **Feature Parity**: Memorials retain all current functionality
4. **Graceful Transition**: Users opt-in to new features at their pace
5. **Backwards Compatibility**: Old code paths supported during transition

---

## Data Migration Strategy

### Phase 1: Dual Collection Approach

```
Current State:
memorials/ → All memorial data

Target State:
memorials/ → Legacy (read-only after migration)
events/ → All event data (including migrated memorials)
```

### Migration Workflow

#### Step 1: Parallel Collections (Weeks 1-3)
- Create `events` collection
- Leave `memorials` collection intact
- All new writes go to BOTH collections
- All reads check BOTH collections

```typescript
// Dual-write pattern
async function createEvent(data: EventData) {
  // Write to new collection
  const eventRef = await eventsCollection.add(transformToEvent(data));
  
  // Also write to old collection for backwards compat
  if (data.eventType === 'memorial') {
    await memorialsCollection.add(transformToMemorial(data));
  }
  
  return eventRef;
}

// Dual-read pattern
async function getEventBySlug(slug: string) {
  // Try events collection first
  let event = await eventsCollection.where('fullSlug', '==', slug).get();
  
  // Fallback to memorials
  if (event.empty) {
    const memorial = await memorialsCollection.where('fullSlug', '==', slug).get();
    if (!memorial.empty) {
      event = transformMemorialToEvent(memorial.docs[0].data());
    }
  }
  
  return event;
}
```

#### Step 2: Bulk Migration (Week 13)
```typescript
// Migration script
async function migrateMemorialsToEvents() {
  const memorials = await memorialsCollection.get();
  const batchSize = 500;
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < memorials.docs.length; i += batchSize) {
    const batch = firestore.batch();
    const slice = memorials.docs.slice(i, i + batchSize);
    
    for (const memorial of slice) {
      try {
        const eventData = transformMemorialToEvent(memorial.data());
        const eventRef = eventsCollection.doc(memorial.id);
        batch.set(eventRef, eventData);
        successCount++;
      } catch (error) {
        console.error(`Failed to migrate ${memorial.id}:`, error);
        errorCount++;
      }
    }
    
    await batch.commit();
    console.log(`Migrated batch ${i / batchSize + 1}: ${successCount} success, ${errorCount} errors`);
  }
  
  return { successCount, errorCount };
}
```

#### Step 3: Verification (Week 13)
```typescript
// Verify migration accuracy
async function verifyMigration() {
  const memorials = await memorialsCollection.get();
  const discrepancies = [];
  
  for (const memorial of memorials.docs) {
    const event = await eventsCollection.doc(memorial.id).get();
    
    if (!event.exists) {
      discrepancies.push({
        id: memorial.id,
        issue: 'Event not found'
      });
      continue;
    }
    
    // Verify key fields
    const memorialData = memorial.data();
    const eventData = event.data();
    
    if (memorialData.lovedOneName !== eventData.eventName) {
      discrepancies.push({
        id: memorial.id,
        issue: 'Name mismatch',
        expected: memorialData.lovedOneName,
        actual: eventData.eventName
      });
    }
    
    // ... verify other critical fields
  }
  
  return discrepancies;
}
```

#### Step 4: Switch to Events (Week 14)
- Update all read operations to use `events` collection
- Keep `memorials` as read-only backup
- Stop writing to `memorials` collection
- Archive old code paths

---

## Data Transformation

### Memorial → Event Mapping

```typescript
function transformMemorialToEvent(memorial: Memorial): Event {
  return {
    // Identity
    id: memorial.id,
    eventName: memorial.lovedOneName,
    eventType: EventType.MEMORIAL, // All existing are memorials
    fullSlug: memorial.fullSlug,
    
    // Ownership
    ownerUid: memorial.ownerUid,
    createdByUserId: memorial.ownerUid,
    
    // Dates
    eventDate: memorial.services?.main?.time?.date 
      ? new Date(memorial.services.main.time.date)
      : memorial.createdAt,
    createdAt: memorial.createdAt,
    updatedAt: new Date(),
    
    // Event details
    eventDetails: {
      description: `Memorial service for ${memorial.lovedOneName}`,
      location: memorial.services?.main?.location || null,
      tags: ['memorial', 'celebration-of-life'],
      coverImage: memorial.coverImage || null,
      customFields: {
        // Preserve memorial-specific fields
        obituary: memorial.obituary,
        lifeStory: memorial.lifeStory,
        birthDate: memorial.birthDate,
        passedDate: memorial.passedDate
      }
    },
    
    // Privacy
    privacy: {
      isPublic: memorial.isPublic,
      requirePassword: !!memorial.password,
      password: memorial.password,
      allowComments: true,
      allowSharing: true,
      allowDownload: memorial.allowDownload !== false
    },
    
    // Payment
    isPaid: memorial.isPaid || false,
    
    // Fundraising (if exists)
    fundraising: memorial.fundraising || null,
    
    // Legacy flag
    isLegacyMemorial: true,
    migratedFrom: 'memorials',
    migratedAt: new Date()
  };
}
```

### Streams Migration
```typescript
// Update stream references
async function updateStreamReferences() {
  const streams = await streamsCollection
    .where('memorialId', '!=', null)
    .get();
    
  const batch = firestore.batch();
  
  for (const stream of streams.docs) {
    const streamRef = streamsCollection.doc(stream.id);
    batch.update(streamRef, {
      eventId: stream.data().memorialId, // Same ID
      eventType: EventType.MEMORIAL,
      // Keep memorialId for backwards compat
      memorialId: stream.data().memorialId
    });
  }
  
  await batch.commit();
}
```

---

## URL & Routing Migration

### Current Routes
```
/memorials/[id]
/memorials/[id]/streams
/memorials/[id]/schedule
/[fullSlug]  (public memorial page)
```

### New Routes
```
/events/[id]
/events/[id]/streams
/events/[id]/schedule
/[fullSlug]  (public event page - works for memorials too)
```

### Backwards Compatibility
```typescript
// SvelteKit route: /memorials/[id]/+page.server.ts
export async function load({ params }) {
  // Redirect to new route
  throw redirect(308, `/events/${params.id}`);
}

// OR maintain both routes
// /memorials/[id]/+page.server.ts
export async function load({ params }) {
  // Load from events collection
  const event = await getEvent(params.id);
  
  // Show same UI
  return { event };
}
```

### SEO-Friendly Redirects
```javascript
// vercel.json or netlify.toml
{
  "redirects": [
    {
      "source": "/memorials/:id",
      "destination": "/events/:id",
      "permanent": true
    },
    {
      "source": "/memorials/:id/streams",
      "destination": "/events/:id/streams",
      "permanent": true
    }
  ]
}
```

---

## User Role Migration

### Current Roles
```typescript
enum UserRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  FUNERAL_DIRECTOR = 'funeral_director',
  VIEWER = 'viewer'
}
```

### New Roles
```typescript
enum UserRole {
  ADMIN = 'admin',
  EVENT_OWNER = 'event_owner',        // Renamed from 'owner'
  PROFESSIONAL_STREAMER = 'professional_streamer', // Renamed from 'funeral_director'
  VIEWER = 'viewer'
}
```

### Role Migration Script
```typescript
async function migrateUserRoles() {
  const users = await usersCollection.get();
  const batch = firestore.batch();
  
  for (const user of users.docs) {
    const userData = user.data();
    const userRef = usersCollection.doc(user.id);
    
    let newRole = userData.role;
    
    // Map old roles to new roles
    if (userData.role === 'owner') {
      newRole = 'event_owner';
    } else if (userData.role === 'funeral_director') {
      newRole = 'professional_streamer';
    }
    
    // Keep old role for backwards compatibility
    batch.update(userRef, {
      role: newRole,
      legacyRole: userData.role, // Preserve original
      roleUpdatedAt: new Date()
    });
  }
  
  await batch.commit();
}
```

### Role Compatibility Layer
```typescript
// Helper function for backwards compat
function checkUserRole(user: User, requiredRole: string): boolean {
  // Check new role
  if (user.role === requiredRole) return true;
  
  // Check legacy mappings
  const legacyMapping = {
    'owner': 'event_owner',
    'funeral_director': 'professional_streamer'
  };
  
  if (user.legacyRole && legacyMapping[user.legacyRole] === requiredRole) {
    return true;
  }
  
  return false;
}
```

---

## User Communication Strategy

### Timeline

**Week 11: Pre-Announcement**
- Blog post: "Exciting changes coming to Tributestream"
- Email to active users: "We're growing beyond memorials"
- Social media teaser campaign

**Week 13: Migration Week**
- Email: "Your memorial is now part of our expanded platform"
- In-app banner: "New features available"
- Tutorial videos

**Week 14: Launch**
- Major announcement: "Introducing Tributestream Live"
- Press release
- User onboarding flows for new features

**Week 15+: Ongoing**
- Monthly newsletter with tips
- Feature spotlight emails
- Success stories

### Email Templates

#### Migration Announcement
```
Subject: Important Update: Your Memorial Page

Hi [User Name],

We have exciting news! Tributestream is expanding beyond memorials to help you 
celebrate all of life's important moments.

What's Changing:
✓ Your memorial page stays exactly the same
✓ Your existing URL continues to work
✓ All your content is preserved
✓ NEW: You can now create events for weddings, birthdays, and more
✓ NEW: Enable fundraising on any event

What You Need to Do:
Nothing! Your memorial works exactly as before. When you're ready, explore 
our new features in your dashboard.

Questions? Reply to this email or visit our help center.

Best regards,
The Tributestream Live Team
```

#### Feature Introduction
```
Subject: New Feature: Fundraising for Your Events

Hi [User Name],

You can now enable fundraising on your events to support causes that matter.

How It Works:
1. Go to your event dashboard
2. Click "Enable Fundraising"
3. Set your goal and describe your cause
4. Share your event link
5. Receive donations directly to your bank account

Perfect for:
• Memorial funds and scholarship endowments
• Celebration contributions (weddings, birthdays)
• Medical expenses and emergency support
• Charitable causes and community projects

[Enable Fundraising] button

Questions? Watch our tutorial video or contact support.

Tributestream Live Team
```

---

## Testing Strategy

### Pre-Migration Testing (Week 12)

#### Data Integrity Tests
```typescript
describe('Memorial to Event Migration', () => {
  it('should preserve all memorial data', async () => {
    const memorial = createTestMemorial();
    const event = transformMemorialToEvent(memorial);
    
    expect(event.eventName).toBe(memorial.lovedOneName);
    expect(event.fullSlug).toBe(memorial.fullSlug);
    expect(event.eventType).toBe(EventType.MEMORIAL);
    // ... test all critical fields
  });
  
  it('should handle missing optional fields', async () => {
    const minimalMemorial = { id: '123', lovedOneName: 'Test' };
    const event = transformMemorialToEvent(minimalMemorial);
    
    expect(event).toBeDefined();
    expect(event.eventName).toBe('Test');
  });
});
```

#### URL Compatibility Tests
```typescript
describe('URL Backwards Compatibility', () => {
  it('should redirect /memorials/:id to /events/:id', async () => {
    const response = await fetch('/memorials/test-123');
    expect(response.status).toBe(308); // Permanent redirect
    expect(response.headers.get('location')).toBe('/events/test-123');
  });
  
  it('should load memorial via old slug', async () => {
    const memorial = await createTestMemorial();
    const response = await fetch(`/${memorial.fullSlug}`);
    expect(response.status).toBe(200);
    expect(response.body).toContain(memorial.lovedOneName);
  });
});
```

#### Performance Tests
```typescript
describe('Dual-Read Performance', () => {
  it('should retrieve from events collection in <100ms', async () => {
    const start = Date.now();
    await getEventBySlug('test-slug');
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
  
  it('should handle fallback to memorials in <200ms', async () => {
    const start = Date.now();
    await getEventBySlug('legacy-memorial-slug');
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(200);
  });
});
```

### Post-Migration Testing (Week 13)

#### Verification Suite
- [ ] All memorial IDs exist in events collection
- [ ] All memorial URLs resolve correctly
- [ ] All stream references updated
- [ ] All user roles migrated
- [ ] No broken foreign keys
- [ ] Public pages load successfully
- [ ] Search/discovery working
- [ ] Analytics tracking correct

#### User Acceptance Testing
- [ ] Existing users can access their memorials
- [ ] All features work as before
- [ ] New event creation works
- [ ] Fundraising can be enabled
- [ ] Professional profiles can be created
- [ ] No 404 errors on any legacy URLs

---

## Rollback Plan

### Scenario: Critical Migration Failure

**If migration fails with >5% data loss:**

#### Immediate Actions (Hour 0-1)
1. Stop all write operations
2. Disable new `events` collection
3. Revert code to use `memorials` collection
4. Deploy rollback code to production
5. Verify old system working

#### Data Recovery (Hour 1-24)
1. Identify lost/corrupted records
2. Restore from backup snapshots
3. Re-run migration for failed records
4. Verify data integrity
5. Update status page

#### Communication
- Immediate: Status page update
- 1 hour: Email to active users
- 24 hours: Detailed post-mortem
- 1 week: Re-attempt migration with fixes

### Scenario: Performance Issues

**If dual-read causes >200ms average latency:**

#### Quick Fixes
1. Add database indexes
2. Implement caching layer
3. Optimize query patterns
4. Scale database resources

#### Gradual Rollout
1. Limit to 10% of traffic
2. Monitor performance
3. Increase to 25%, 50%, 100%
4. Roll back if issues persist

---

## Success Criteria

### Data Migration
- ✅ 100% of memorials converted to events
- ✅ 0% data loss
- ✅ All URLs resolve correctly
- ✅ All foreign key relationships intact

### Performance
- ✅ Page load time < 2 seconds (no regression)
- ✅ API response time < 200ms
- ✅ Database queries < 100ms
- ✅ Zero downtime during migration

### User Experience
- ✅ User retention rate > 95%
- ✅ Support ticket increase < 10%
- ✅ User satisfaction score > 4/5
- ✅ Zero critical bugs reported

### Business
- ✅ No revenue impact from migration
- ✅ New feature adoption > 15% in Month 1
- ✅ Professional signups > 50 in Month 1
- ✅ Fundraising transactions > 100 in Month 1

---

## Post-Migration Cleanup

### Week 16+: Archive Legacy Code

```typescript
// Mark as deprecated
/**
 * @deprecated Use getEvent() instead
 * This function will be removed in v3.0
 */
async function getMemorial(id: string) {
  console.warn('getMemorial is deprecated, use getEvent');
  return getEvent(id);
}
```

### Month 3: Remove Dual-Write
- Stop writing to `memorials` collection
- All operations use `events` only
- Archive `memorials` collection (read-only)

### Month 6: Full Deprecation
- Remove all `/memorials` routes
- Remove dual-read logic
- Clean up deprecated code
- Archive `memorials` collection offline

---

## Monitoring & Alerts

### Key Metrics to Track

```typescript
const MIGRATION_METRICS = {
  // Data integrity
  'migration.records.total': 'count',
  'migration.records.success': 'count',
  'migration.records.failed': 'count',
  'migration.data_loss.percentage': 'gauge',
  
  // Performance
  'events.read.latency': 'histogram',
  'events.write.latency': 'histogram',
  'memorials.fallback.count': 'count',
  
  // User impact
  'errors.404.count': 'count',
  'user.complaints.count': 'count',
  'support.tickets.migration': 'count',
  
  // Business
  'events.created.total': 'count',
  'events.by_type.memorial': 'count',
  'events.by_type.other': 'count'
};
```

### Alert Thresholds
- Data loss > 1%: **Critical alert**
- 404 errors > 10/hour: **Warning**
- Support tickets > 50% increase: **Warning**
- API latency > 500ms: **Critical**

---

## Next Steps

1. ✅ Approve migration strategy
2. Create detailed migration runbook
3. Set up staging environment for testing
4. Run migration dry-run on copy of production data
5. Schedule migration window
6. Execute migration

---

**Document Owner**: Tech Lead + DevOps  
**Last Updated**: November 4, 2025  
**Sign-off Required**: CTO, Product Manager, Customer Success
