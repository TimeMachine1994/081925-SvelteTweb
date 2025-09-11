# TributeStream V1 Scope Reduction Plan

**Date:** September 11, 2025  
**Objective:** Simplify application to 3 core roles (admin, owner, funeral_director) and remove incomplete features for stable V1 release

## V1 vs V2 Feature Split

### V1 Core Features (Keep & Complete)
- ✅ **Admin Role**: Full system administration capabilities
- ✅ **Owner Role**: Memorial owners (families) with full memorial management
- ✅ **Funeral Director Role**: Professional memorial creation and management
- ✅ **Memorial Creation & Management**: Core memorial functionality
- ✅ **Schedule Management**: Service scheduling and booking
- ✅ **Payment Integration**: Stripe checkout and payment processing
- ✅ **Livestream Management**: Basic livestream setup and control
- ✅ **User Authentication**: Login/logout/registration for 3 roles
- ✅ **Admin Portal**: Funeral director approval and system management

### V2 Deferred Features (Remove from V1)
- ❌ **Family Member Role**: Invitation system, family contributor management
- ❌ **Viewer Role**: Public memorial viewing, following system
- ❌ **Photo Upload System**: All photo upload/management functionality
- ❌ **Invitation System**: Email invitations and role assignments
- ❌ **Public Memorial Access**: Anonymous/public viewing capabilities

## Removal Strategy

### 1. Role System Simplification

#### Remove Role Types
```typescript
// REMOVE these role types from all code:
type UserRole = 'family_member' | 'viewer';

// KEEP only these roles:
type UserRole = 'admin' | 'owner' | 'funeral_director';
```

#### Update DevRoleSwitcher
- Remove `family_member` and `viewer` test accounts
- Keep only 3 role switching options
- Update test account creation scripts

### 2. API Endpoints to Remove

#### Family Member & Viewer Related
- `/api/memorials/[memorialId]/invite` - Family member invitations
- `/api/invitations/*` - All invitation management
- `/api/memorials/[memorialId]/follow` - Memorial following for viewers
- `/api/memorials/public` - Public memorial listing
- `/register` - General viewer registration (keep funeral-director and loved-one)

#### Photo Upload Related
- `/api/memorials/[memorialId]/photos/upload` - Photo upload endpoint
- `/api/photos/*` - All photo management APIs
- Any photo moderation endpoints

### 3. Components to Remove

#### Family Member Components
- `FamilyMemberPortal.svelte`
- `InvitationManager.svelte`
- `FamilyContributorList.svelte`
- Any family invitation UI components

#### Viewer Components
- `ViewerPortal.svelte`
- `MemorialFollowing.svelte`
- `PublicMemorialBrowser.svelte`

#### Photo Components
- `PhotoUpload.svelte`
- `PhotoGallery.svelte` (if exists)
- `PhotoModerationPanel.svelte`
- Any photo management UI

### 4. Database Collections to Deprecate

#### Remove/Ignore Collections
- `invitations` - Family member invitation system
- `photos` - Photo upload and management
- `memorial_followers` - Viewer following system
- `family_contributions` - Family member contributions

#### Clean Memorial Schema
```typescript
// REMOVE these fields from Memorial type:
interface Memorial {
  // Remove:
  familyMemberUids?: string[];
  isPublic?: boolean;
  photoCount?: number;
  lastPhotoUpload?: Timestamp;
  
  // Keep core fields:
  ownerUid: string;
  funeralDirectorUid?: string;
  // ... other core fields
}
```

### 5. Pages to Remove

#### Registration Pages
- `/register/+page.svelte` - General viewer registration
- Keep: `/register/loved-one` and `/register/funeral-director`

#### Portal Pages
- `/family-portal` - Family member dashboard
- `/viewer-portal` - Viewer dashboard

#### Feature Pages
- `/photos/*` - All photo management pages
- `/invite/*` - Invitation acceptance pages
- `/public-memorials` - Public memorial browsing

### 6. Site-Wide Audit Logging Implementation

#### New Audit System Requirements

##### Audit Events to Track
```typescript
interface AuditEvent {
  id: string;
  timestamp: Timestamp;
  userId: string;
  userEmail: string;
  userRole: 'admin' | 'owner' | 'funeral_director';
  action: AuditAction;
  resourceType: 'memorial' | 'user' | 'schedule' | 'payment' | 'livestream';
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

type AuditAction = 
  // Memorial actions
  | 'memorial_created' | 'memorial_updated' | 'memorial_deleted'
  // User actions  
  | 'user_login' | 'user_logout' | 'user_created' | 'role_changed'
  // Schedule actions
  | 'schedule_updated' | 'schedule_locked' | 'payment_completed'
  // Livestream actions
  | 'livestream_started' | 'livestream_stopped' | 'livestream_configured'
  // Admin actions
  | 'funeral_director_approved' | 'funeral_director_rejected'
  | 'admin_memorial_created' | 'system_config_changed';
```

##### Implementation Plan
1. **Audit Middleware**: Create server-side middleware to capture all actions
2. **Audit Database**: New `audit_logs` Firestore collection
3. **Admin Audit Viewer**: New tab in admin portal to view/filter audit logs
4. **Automatic Logging**: Integrate into all API endpoints and user actions

#### Admin Portal Audit Tab
- **Real-time Audit Log**: Live feed of system actions
- **Filtering Options**: By user, action type, date range, resource
- **Export Functionality**: Download audit logs for compliance
- **Search Capability**: Find specific events or users
- **Dashboard Metrics**: Action counts, user activity summaries

### 7. DevRoleSwitcher Fixes

#### Current Issues to Fix
- Update test accounts to only include 3 roles
- Fix Firebase emulator connection issues
- Ensure proper role switching functionality
- Remove references to removed roles

#### Updated Test Accounts
```typescript
const testAccounts = [
  {
    role: 'admin',
    email: 'admin@test.com',
    password: 'test123',
    name: 'Admin User'
  },
  {
    role: 'funeral_director', 
    email: 'director@test.com',
    password: 'test123',
    name: 'John Director'
  },
  {
    role: 'owner',
    email: 'owner@test.com', 
    password: 'test123',
    name: 'Sarah Owner'
  }
];
```

## Implementation Phases

### Phase 1: Role System Cleanup (Priority 1)
1. Update type definitions to remove `family_member` and `viewer`
2. Clean up DevRoleSwitcher component
3. Remove viewer registration endpoint
4. Update all role-checking logic to handle only 3 roles

### Phase 2: Component & Page Removal (Priority 1)
1. Identify and remove family member components
2. Remove viewer portal and related pages
3. Clean up navigation and routing
4. Remove photo upload components

### Phase 3: API Cleanup (Priority 2)
1. Remove invitation-related endpoints
2. Remove photo upload endpoints
3. Remove public memorial endpoints
4. Clean up memorial access logic

### Phase 4: Audit Logging Implementation (Priority 2)
1. Create audit logging middleware
2. Implement audit database schema
3. Add audit logging to all endpoints
4. Build admin audit viewer interface

### Phase 5: Database Schema Updates (Priority 3)
1. Update Memorial interface
2. Clean up unused database collections
3. Remove deprecated fields from existing documents
4. Update security rules

## Testing Strategy

### Regression Testing
- [ ] Verify admin functionality remains intact
- [ ] Verify owner memorial management works
- [ ] Verify funeral director workflow functions
- [ ] Verify payment and scheduling systems work
- [ ] Verify livestream functionality operates

### Cleanup Verification
- [ ] Confirm no broken links to removed pages
- [ ] Verify no API calls to removed endpoints
- [ ] Check no references to removed role types
- [ ] Validate DevRoleSwitcher works with 3 roles

### Audit System Testing
- [ ] Verify all actions are logged correctly
- [ ] Test audit log viewer functionality
- [ ] Validate audit log filtering and search
- [ ] Confirm audit data integrity

## Success Criteria

### V1 Release Ready When:
1. ✅ Only 3 roles exist in system (admin, owner, funeral_director)
2. ✅ All photo upload functionality removed
3. ✅ All family member/viewer features removed
4. ✅ Site-wide audit logging implemented and viewable in admin
5. ✅ DevRoleSwitcher works perfectly for 3 roles
6. ✅ No broken functionality for remaining 3 user types
7. ✅ Clean, maintainable codebase with no dead code

### Benefits of V1 Scope Reduction
- **Faster Release**: Focus on core, working features
- **Better Stability**: Remove incomplete/buggy features
- **Cleaner Codebase**: Eliminate dead code and complexity
- **Easier Maintenance**: Fewer features to support and debug
- **Clear V2 Roadmap**: Deferred features become clear V2 goals

---

**Next Steps:** Begin Phase 1 implementation with role system cleanup and DevRoleSwitcher fixes.
