# WBS: Admin Profile Page

**Created:** January 30, 2026  
**Purpose:** Document the work breakdown structure for implementing an Admin Profile page - features, components, data flow, and architecture.

---

## Executive Summary

The Admin Profile Page is a **new feature** that will allow authenticated admin users to:
1. View their profile information and admin role
2. Update personal information (display name, email, phone)
3. View their permissions based on role
4. Change password
5. Manage notification preferences
6. View activity/audit log of their actions
7. Access quick links to admin sections they have access to

### Current State

| Item | Status |
|------|--------|
| Admin Profile Route (`/admin/profile`) | ❌ Does NOT exist |
| User Profile Route (`/profile`) | ✅ Exists (for owners/funeral directors) |
| Admin User Store | ✅ Exists (`$lib/stores/adminUser.ts`) |
| Admin Permissions | ✅ Exists (`$lib/admin/permissions.ts`) |
| Admin Layout | ✅ Exists (`$lib/components/admin/AdminLayout.svelte`) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ADMIN PROFILE PAGE ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────────┘

Route: /admin/profile

                              ┌─────────────────────────┐
                              │   AdminLayout.svelte    │  ← Wrapper component
                              └─────────────────────────┘
                                          │
                              ┌─────────────────────────┐
                              │  AdminProfile.svelte    │  ← Main profile page
                              │  (NEW COMPONENT)        │
                              └─────────────────────────┘
                                          │
              ┌───────────────┬───────────┼───────────────┬───────────────┐
              ▼               ▼           ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────────┐
    │ProfileHeader │ │PersonalInfo  │ │RolePermiss-  │ │Security      │ │ActivityLog    │
    │.svelte       │ │Form.svelte   │ │ions.svelte   │ │Settings.svel │ │Panel.svelte   │
    │(NEW)         │ │(NEW)         │ │(NEW)         │ │te (NEW)      │ │(NEW)          │
    └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └───────────────┘

                                          │
                                          ▼
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                            SHARED RESOURCES                              │
    ├──────────────────────────────────────────────────────────────────────────┤
    │  Stores:       $lib/stores/adminUser.ts                                  │
    │  Permissions:  $lib/admin/permissions.ts                                 │
    │  Types:        $lib/types/admin.ts (NEW)                                 │
    │  Utils:        $lib/utils/admin.ts (NEW)                                 │
    └──────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                            API ENDPOINTS                                 │
    ├──────────────────────────────────────────────────────────────────────────┤
    │  GET    /api/admin/profile           → Load admin profile data           │
    │  PATCH  /api/admin/profile           → Update profile fields             │
    │  POST   /api/admin/profile/password  → Change password                   │
    │  GET    /api/admin/profile/activity  → Load activity log                 │
    └──────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                         FIRESTORE COLLECTIONS                            │
    ├──────────────────────────────────────────────────────────────────────────┤
    │  users                   → Profile data, displayName, email, phone       │
    │  audit_logs              → Admin actions for activity panel              │
    │  admin_preferences       → Notification/UI preferences (NEW)             │
    └──────────────────────────────────────────────────────────────────────────┘
```

---

## File Inventory (Proposed)

### 1. Route Files (NEW)

| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/routes/admin/profile/+page.svelte` | Profile page wrapper | ~50 |
| `src/routes/admin/profile/+page.server.ts` | Load profile, server actions | ~200 |
| `src/routes/admin/profile/+layout.svelte` | Optional layout for profile section | ~20 |

### 2. UI Components (NEW)

| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/lib/components/admin/profile/AdminProfileHeader.svelte` | Avatar, name, role badge | ~80 |
| `src/lib/components/admin/profile/PersonalInfoForm.svelte` | Edit personal details | ~150 |
| `src/lib/components/admin/profile/RolePermissions.svelte` | Display role and permissions | ~120 |
| `src/lib/components/admin/profile/SecuritySettings.svelte` | Password change, 2FA | ~180 |
| `src/lib/components/admin/profile/ActivityLogPanel.svelte` | Recent actions log | ~100 |
| `src/lib/components/admin/profile/NotificationPrefs.svelte` | Email/notification settings | ~80 |

### 3. Existing Resources (To Leverage)

| File | What to Reuse |
|------|---------------|
| `src/lib/stores/adminUser.ts` | Admin user state, `can()` permission check |
| `src/lib/admin/permissions.ts` | `ADMIN_ROLES`, `hasPermission()`, `getUserPermissions()` |
| `src/lib/components/admin/AdminLayout.svelte` | Page wrapper with sidebar |
| `src/routes/profile/settings/+page.svelte` | UI patterns for settings form |

---

## Data Structures

### Admin User Profile

```typescript
// Firestore: users/{uid}
interface AdminUserProfile {
  // Core Fields
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  
  // Admin-specific
  role: 'admin';
  adminRole: 'super_admin' | 'content_admin' | 'financial_admin' | 'customer_support' | 'readonly_admin';
  suspended: boolean;
  
  // Metadata
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  lastPasswordChange?: Timestamp;
  
  // Preferences (NEW)
  preferences?: AdminPreferences;
}
```

### Admin Preferences (NEW)

```typescript
interface AdminPreferences {
  // Notifications
  emailNotifications: {
    newMemorials: boolean;      // Alert on new memorials
    paymentReceived: boolean;   // Alert on payments
    systemAlerts: boolean;      // Critical system alerts
  };
  
  // UI Preferences
  ui: {
    sidebarCollapsed: boolean;
    dashboardLayout: 'grid' | 'list';
    itemsPerPage: 25 | 50 | 100;
    theme: 'light' | 'dark' | 'system';
  };
}
```

### Activity Log Entry

```typescript
// Firestore: audit_logs/{logId}
interface AuditLogEntry {
  id: string;
  adminUid: string;
  adminEmail: string;
  action: string;          // 'memorial.update', 'user.approve', etc.
  resource: string;        // Resource type
  resourceId?: string;     // Target resource ID
  details?: object;        // Additional context
  ipAddress?: string;
  userAgent?: string;
  timestamp: Timestamp;
}
```

---

## Admin Roles Reference

| Role | Level | Description | Key Permissions |
|------|-------|-------------|-----------------|
| `super_admin` | 1 | Full system access | All resources, all actions |
| `content_admin` | 2 | Content management | Memorials, streams, blog, users (R/W) |
| `financial_admin` | 3 | Financial operations | Payments, financial reports |
| `customer_support` | 4 | Support tasks | Limited editing, unpaid memorials only |
| `readonly_admin` | 5 | View-only access | Read all resources |

---

## Feature Breakdown

### Phase 1: Core Profile (MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Profile Header** | Display name, avatar, role badge, email | P0 |
| **Personal Info Form** | Edit display name, phone | P0 |
| **Role Display** | Show current role and description | P0 |
| **Basic Navigation** | Add to admin sidebar | P0 |

### Phase 2: Security & Permissions

| Feature | Description | Priority |
|---------|-------------|----------|
| **Password Change** | Current → New password flow | P1 |
| **Permissions View** | List what user can/cannot do | P1 |
| **Last Login Info** | Show last login timestamp | P1 |

### Phase 3: Activity & Preferences

| Feature | Description | Priority |
|---------|-------------|----------|
| **Activity Log** | Recent actions by this admin | P2 |
| **Notification Prefs** | Email notification settings | P2 |
| **UI Preferences** | Theme, items per page, etc. | P3 |
| **Two-Factor Auth** | 2FA setup (optional) | P3 |

---

## Implementation Tasks

### Task 1: Create Route Structure

```
src/routes/admin/profile/
├── +page.svelte         # Main profile page
├── +page.server.ts      # Server load + actions
└── +layout.svelte       # Optional sublayout
```

**Subtasks:**
1. Create `+page.server.ts` with:
   - Auth check (must be admin)
   - Load user profile from `users` collection
   - Load admin preferences
   - Define form actions: `updateProfile`, `changePassword`

2. Create `+page.svelte` with:
   - Import `AdminLayout`
   - Section layout (header, forms, panels)

### Task 2: Create Profile Header Component

**File:** `src/lib/components/admin/profile/AdminProfileHeader.svelte`

**Displays:**
- Avatar (or initials fallback)
- Display name
- Email
- Role badge with color coding
- Account creation date

### Task 3: Create Personal Info Form

**File:** `src/lib/components/admin/profile/PersonalInfoForm.svelte`

**Fields:**
- Display Name (text)
- Email (read-only or with change flow)
- Phone Number (optional)
- Photo URL (optional upload)

**Actions:**
- Submit via form action `?/updateProfile`

### Task 4: Create Role & Permissions Display

**File:** `src/lib/components/admin/profile/RolePermissions.svelte`

**Shows:**
- Current role name and description
- List of permissions (from `getUserPermissions()`)
- Visual indicators (✅ can / ❌ cannot)

### Task 5: Create Security Settings

**File:** `src/lib/components/admin/profile/SecuritySettings.svelte`

**Features:**
- Password change form (matches `/profile/settings` pattern)
- Last password change date
- Last login timestamp
- (Future: 2FA setup)

### Task 6: Add Navigation Link

**Location:** Admin sidebar navigation

**Update:** Add "My Profile" link to admin navigation

---

## API Design

### GET /api/admin/profile

**Response:**
```json
{
  "profile": {
    "uid": "abc123",
    "email": "admin@example.com",
    "displayName": "John Admin",
    "phone": "555-1234",
    "photoURL": null,
    "adminRole": "content_admin",
    "createdAt": "2025-01-15T...",
    "lastLoginAt": "2026-01-30T..."
  },
  "role": {
    "id": "content_admin",
    "name": "Content Administrator",
    "description": "Manage memorials, streams, blog, and users",
    "permissions": [...]
  },
  "preferences": {
    "emailNotifications": {...},
    "ui": {...}
  }
}
```

### PATCH /api/admin/profile

**Request:**
```json
{
  "displayName": "Updated Name",
  "phone": "555-9999"
}
```

### POST /api/admin/profile/password

**Request:**
```json
{
  "currentPassword": "...",
  "newPassword": "..."
}
```

---

## UI Design Reference

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  AdminLayout (with sidebar)                                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📋 My Profile                                            │  │
│  │  Manage your admin account settings                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────┐  ┌───────────────────────────┐│
│  │  Profile Header             │  │  Quick Stats              ││
│  │  [Avatar] John Admin        │  │  📊 Last Login: 2h ago    ││
│  │  admin@example.com          │  │  🔐 Role: Content Admin   ││
│  │  🏷️ Content Administrator   │  │  📝 Actions today: 12     ││
│  └─────────────────────────────┘  └───────────────────────────┘│
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Personal Information                              [Edit] │  │
│  │  ─────────────────────────────────────────────────────────│  │
│  │  Display Name: John Admin                                 │  │
│  │  Email: admin@example.com                                 │  │
│  │  Phone: (555) 123-4567                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  My Permissions                                           │  │
│  │  ─────────────────────────────────────────────────────────│  │
│  │  ✅ Memorials: Read, Create, Update, Delete               │  │
│  │  ✅ Streams: Read, Create, Update, Delete                 │  │
│  │  ✅ Users: Read, Update                                   │  │
│  │  ❌ System: No access                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Security Settings                     [Change Password]  │  │
│  │  ─────────────────────────────────────────────────────────│  │
│  │  Password last changed: 30 days ago                       │  │
│  │  Two-Factor Auth: Not enabled                             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Styling Guidelines

Follow existing admin patterns:
- Use `AdminLayout` wrapper
- Glass-morphism cards (`bg-white/70 backdrop-blur-xl`)
- Role-based accent colors (Admin = red/pink gradient)
- Lucide icons (User, Shield, Mail, Phone, Key)
- Tailwind CSS classes

---

## Validation Rules

| Field | Rules |
|-------|-------|
| Display Name | Required, 2-50 chars |
| Phone | Optional, valid format |
| Current Password | Required for password change |
| New Password | Min 8 chars, at least 1 number |
| Confirm Password | Must match new password |

---

## Security Considerations

1. **Authentication** - Must be logged in with `role: 'admin'`
2. **Password Change** - Require current password verification
3. **Session Invalidation** - Option to logout all sessions on password change
4. **Audit Logging** - Log all profile changes to `audit_logs`
5. **Rate Limiting** - Limit password change attempts

---

## Testing Plan

### Unit Tests

| Test | Coverage |
|------|----------|
| `AdminProfileHeader.test.ts` | Role badge display, avatar fallback |
| `PersonalInfoForm.test.ts` | Form validation, submit handling |
| `RolePermissions.test.ts` | Permission rendering |
| `SecuritySettings.test.ts` | Password validation |

### E2E Tests

| Test | Scenario |
|------|----------|
| `admin-profile.spec.ts` | Load profile, edit info, change password |

---

## Timeline Estimate

| Phase | Tasks | Est. Hours |
|-------|-------|------------|
| Phase 1 (MVP) | Route + Header + Info Form | 6-8 hrs |
| Phase 2 | Permissions + Security | 4-6 hrs |
| Phase 3 | Activity Log + Prefs | 4-6 hrs |
| Testing | Unit + E2E | 3-4 hrs |
| **Total** | | **17-24 hrs** |

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Admin auth system | ✅ Ready | `locals.user.role === 'admin'` |
| Admin permissions | ✅ Ready | `$lib/admin/permissions.ts` |
| Admin stores | ✅ Ready | `$lib/stores/adminUser.ts` |
| Firebase Admin SDK | ✅ Ready | `$lib/server/firebase.ts` |
| Lucide icons | ✅ Ready | Already installed |
| Tailwind CSS | ✅ Ready | Already configured |

---

## Related Documentation

- `DevDocs/WBS_CALCULATOR_SYSTEM.md` - Similar WBS format
- `ADMIN_REFACTOR_3_SAFETY.md` - Permission system docs
- `ADMIN_WIKI_IMPLEMENTATION.md` - Admin wiki patterns
- `src/routes/profile/settings/+page.svelte` - User settings reference

---

*Document Version: 1.0*  
*Last Updated: January 30, 2026*
