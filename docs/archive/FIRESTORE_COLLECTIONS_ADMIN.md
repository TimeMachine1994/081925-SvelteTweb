# Tributestream Firestore Collections - Admin, Audit & Security

This document covers collections related to administration, auditing, security, and the demo system.

---

## Admin & Audit Collections

### 1. `admin_actions`

**Purpose:** Log administrative actions for basic accountability and tracking.

**Structure:**
```typescript
{
  action: string;                   // Action type
  targetId: string;                 // ID of affected resource
  targetType: string;               // Type of resource
  adminId: string;                  // Admin who performed action
  timestamp: Timestamp;
  details?: Record<string, any>;    // Additional context
}
```

**Example Actions:**
- `create_memorial` - Admin creates memorial
- `funeral_director_auto_approved` - FD account auto-approved
- `suspend_user` - Admin suspends user account
- `toggle_payment_status` - Admin marks memorial as paid/unpaid

**Used In:**
- `/register/funeral-home/+page.server.ts` - Log auto-approval of funeral directors
- `/api/admin/create-memorial/+server.ts` - Log memorial creation by admin

**Key Operations:**
- Simple action logging without detailed context
- Tracks who did what to which resource
- Basic audit trail for admin operations

---

### 2. `admin_audit_logs`

**Purpose:** Comprehensive audit logging for all admin operations with full context.

**Structure:**
```typescript
{
  adminId: string;
  action: string;
  timestamp: Timestamp;
  details: Record<string, any>;     // Full operation details
  ipAddress?: string;
  userAgent?: string;
}
```

**Used In:**
- `/lib/server/admin.ts` - AdminService audit logging

**Key Operations:**
- Detailed audit trail with IP and user agent
- Stores complete operation context
- Used by AdminService for all operations

**Difference from `admin_actions`:**
- More detailed than `admin_actions`
- Includes request metadata (IP, user agent)
- Used by centralized AdminService

---

### 3. `audit_logs`

**Purpose:** System-wide operation auditing for security and compliance.

**Structure:**
```typescript
{
  action: string;                   // Action performed
  resourceType: string;             // Type of resource affected
  resourceId: string;               // ID of affected resource
  userId: string;                   // User who performed action
  userRole: string;                 // Role of user
  timestamp: Timestamp;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
}
```

**Example Actions:**
- `mark_paid` / `mark_unpaid` - Payment status changes
- `schedule_edit_request_updated` - Edit request approved/denied
- `memorial_created` - New memorial created
- `stream_started` - Stream went live

**Used In:**
- `/api/admin/toggle-payment-status/+server.ts` - Log payment status changes
- `/api/admin/schedule-edit-requests/[requestId]/+server.ts` - Log edit request updates
- `/lib/server/auditLogger.ts` - Centralized audit logging service

**Key Operations:**
- Track all significant system operations
- Security event logging
- Payment and financial transaction auditing
- Resource modification tracking
- Capture both success and failure events

**Important Notes:**
- More comprehensive than `admin_actions` and `admin_audit_logs`
- Includes status and error tracking
- Used across the entire system, not just admin operations
- Centralized logging service via `auditLogger.ts`

---

### 4. `schedule_edit_requests`

**Purpose:** Workflow for memorial owners to request schedule changes after payment.

**Structure:**
```typescript
{
  id: string;                       // Document ID
  memorialId: string;
  requestedBy: string;              // User ID of requester
  status: 'pending' | 'approved' | 'denied' | 'completed';
  
  // Original Schedule
  originalSchedule: {
    main: {
      location: { name, address, isUnknown },
      time: { date, time, isUnknown },
      hours: number
    },
    additional: Array<{
      type: 'location' | 'day',
      location: { name, address, isUnknown },
      time: { date, time, isUnknown },
      hours: number
    }>
  },
  
  // Requested Changes
  requestedChanges: {
    main: { /* same structure */ },
    additional: [ /* same structure */ ]
  },
  
  // Review Tracking
  reviewedBy?: string;              // Admin who reviewed
  reviewedAt?: Timestamp;
  reviewNotes?: string;             // Admin notes
  
  // Request Details
  reason?: string;                  // Why changes are needed
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

**Used In:**
- `/api/memorials/[memorialId]/schedule/request-edit/+server.ts` - Create edit requests
- `/api/admin/schedule-edit-requests/+server.ts` - List all requests for admin
- `/api/admin/schedule-edit-requests/[requestId]/+server.ts` - Approve/deny individual requests

**Key Operations:**

1. **Request Submission**
   - Memorial owners submit change requests
   - Includes original schedule and desired changes
   - Reason field explains why changes needed
   - Rate limited to 1 request per memorial per 24 hours

2. **Admin Review Workflow**
   - Admins see all pending requests
   - Can filter by status (pending, approved, denied, completed)
   - Add review notes when approving/denying
   - Timestamp tracks when review occurred

3. **Status Lifecycle**
   - `pending` - Awaiting admin review
   - `approved` - Admin approved, ready to apply changes
   - `denied` - Admin rejected the request
   - `completed` - Changes have been applied to memorial

4. **Audit Integration**
   - All status changes logged to `audit_logs`
   - Tracks who made changes and when
   - Full history of request lifecycle

**Important Notes:**
- Prevents unauthorized schedule changes after payment
- Ensures admin oversight of service modifications
- Preserves original schedule for reference
- Rate limiting prevents spam requests

---

## Security & Authentication Collections

### 5. `passwordResetTokens`

**Purpose:** Temporary tokens for secure password reset functionality.

**Structure:**
```typescript
{
  token: string;                    // Document ID (the token itself)
  userId: string;                   // User requesting reset
  email: string;                    // User's email
  createdAt: Timestamp;
  expiresAt: Timestamp;             // 1 hour from creation
  used: boolean;
  usedAt?: Timestamp;
}
```

**Used In:**
- `/api/password-reset/+server.ts` - Create reset tokens and send email
- `/api/validate-reset-token/+server.ts` - Validate token before showing reset form
- `/api/reset-password-confirm/+server.ts` - Consume token and update password

**Key Operations:**

1. **Token Generation**
   - Random secure token generated via crypto
   - Stored with 1-hour expiry
   - Email sent to user with reset link
   - One token per user (old ones deleted)

2. **Token Validation**
   - Check if token exists and not expired
   - Check if token already used
   - Return valid/invalid status

3. **Password Reset**
   - Verify token is valid
   - Update Firebase Auth password
   - Mark token as used
   - Update user's `passwordChangedAt` timestamp

**Security Notes:**
- Tokens expire after 1 hour
- Tokens are single-use only
- Server-side only (no client SDK access)
- Old tokens deleted when new one requested
- Recommended: Cron job to clean up expired tokens weekly

---

## Demo System Collections

### 6. `demoSessions`

**Purpose:** Manage time-boxed demo environments with pre-created users for product demonstrations and sales.

**Structure:**
```typescript
{
  id: string;                       // Session ID (document ID)
  
  // Session Lifecycle
  createdAt: Timestamp;
  expiresAt: Timestamp;             // Default: 2 hours from creation
  status: 'active' | 'expired' | 'ended';
  createdBy: string;                // Admin UID who created session
  
  // Pre-created Demo Users (All 4 Roles)
  users: {
    admin: {
      uid: string,
      email: string,                // e.g., demo-admin-{sessionId}@tributestream.com
      displayName: string,
      role: 'admin',
      customToken?: string
    },
    funeral_director: {
      uid: string,
      email: string,
      displayName: string,
      role: 'funeral_director',
      customToken?: string
    },
    owner: {
      uid: string,
      email: string,
      displayName: string,
      role: 'owner',
      customToken?: string
    },
    viewer: {
      uid: string,
      email: string,
      displayName: string,
      role: 'viewer',
      customToken?: string
    }
  },
  
  // Session State
  currentRole: 'admin' | 'funeral_director' | 'owner' | 'viewer';
  lastRoleSwitch?: Timestamp;
  
  // Demo Data References
  memorialId?: string;              // Created demo memorial
  memorialSlug?: string;            // Memorial URL slug
  
  // Session Metadata
  metadata?: {
    ipAddress?: string,
    userAgent?: string,
    entryPoint?: 'landing_page' | 'sales_portal' | 'magic_link',
    scenario?: string               // Demo scenario name
  },
  
  // Cleanup Tracking
  endedAt?: Timestamp;
}
```

**Used In:**
- `/api/demo/session/+server.ts` - Create new demo sessions
- `/api/demo/session/[id]/+server.ts` - Get session status
- `/api/demo/switch-role/+server.ts` - Switch between demo user roles
- `/api/demo/cleanup/+server.ts` - Clean up expired demo data
- `/lib/server/demo/seedData.ts` - Seed realistic demo data

**Key Operations:**

1. **Session Creation**
   - Creates 4 pre-authenticated demo users (one per role)
   - Generates custom tokens for instant login
   - Sets 2-hour expiry (configurable)
   - Creates demo memorial with sample data
   - All entities tagged with `isDemo: true` and `demoSessionId`

2. **Role Switching**
   - Users can switch between all 4 roles seamlessly
   - New custom token generated for selected role
   - Session updated with current role
   - No logout/login required

3. **Demo Data Seeding**
   - Pre-populates memorial with realistic data
   - Creates sample streams and slideshows
   - Uses demo templates for consistency
   - All data auto-expires with session

4. **Automatic Cleanup**
   - Cron job runs daily to find expired sessions
   - Deletes all demo entities:
     - Demo users from Firebase Auth
     - Demo users from `users` collection
     - Demo memorials from `memorials` collection
     - Demo streams from `streams` collection
     - Demo slideshows from subcollections
   - Session marked as `status: 'expired'`

5. **Analytics Tracking**
   - Entry point tracking (landing page, sales portal, etc.)
   - User agent and IP for analytics
   - Scenario selection tracking
   - Time spent in demo

**Demo Entity Tagging:**
All entities created during demo have these fields:
```typescript
{
  isDemo: true,
  demoSessionId: string,
  demoExpiresAt: string
}
```

**Used In Collections:**
- `users` - Demo user accounts
- `memorials` - Demo memorial pages
- `streams` - Demo livestreams
- `memorials/{id}/slideshows` - Demo slideshows
- `funeral_directors` - Demo FD profiles

**Cleanup Process:**
```typescript
// Daily cron job finds expired sessions
const expiredSessions = await adminDb
  .collection('demoSessions')
  .where('status', '==', 'active')
  .where('expiresAt', '<', now)
  .get();

// For each expired session:
// 1. Delete demo users from Firebase Auth
// 2. Delete demo users from Firestore
// 3. Delete demo memorials
// 4. Delete demo streams
// 5. Delete demo slideshows
// 6. Update session status to 'expired'
```

**Important Notes:**
- Complete sandboxing from production data
- All demo data auto-expires
- Supports sales team and self-service demos
- Role-switching enables comprehensive product exploration
- Analytics track demo effectiveness
- Cleanup ensures no demo data pollution

**Security Considerations:**
- Demo users can only access demo-tagged data
- Middleware checks prevent demo users from accessing production
- Time-boxed sessions prevent long-term demo account abuse
- Custom tokens expire with session

---

## Collection Usage Summary

### Security & Compliance:
- `audit_logs` - Comprehensive system-wide auditing
- `admin_actions` - Basic admin action logging
- `admin_audit_logs` - Detailed admin operation auditing
- `passwordResetTokens` - Secure password reset workflow

### Workflow Management:
- `schedule_edit_requests` - Post-payment schedule change approval

### Demo System:
- `demoSessions` - Time-boxed product demonstrations

---

## Indexing Requirements

### Composite Indexes:

```javascript
// schedule_edit_requests
schedule_edit_requests: [
  { fields: [{ status: 'ASC' }, { createdAt: 'DESC' }] },
  { fields: [{ memorialId: 'ASC' }, { requestedBy: 'ASC' }, { createdAt: 'DESC' }] }
]

// demoSessions
demoSessions: [
  { fields: [{ status: 'ASC' }, { expiresAt: 'ASC' }] },
  { fields: [{ createdBy: 'ASC' }, { createdAt: 'DESC' }] }
]

// audit_logs
audit_logs: [
  { fields: [{ userId: 'ASC' }, { timestamp: 'DESC' }] },
  { fields: [{ action: 'ASC' }, { timestamp: 'DESC' }] },
  { fields: [{ resourceType: 'ASC' }, { timestamp: 'DESC' }] }
]
```

---

## Cleanup & Maintenance

### Recommended Cleanup Jobs:

1. **Expired Demo Sessions** (Daily)
   - Endpoint: `/api/demo/cleanup`
   - Deletes expired demo data
   - Archives cleanup metrics

2. **Password Reset Tokens** (Weekly)
   - Delete tokens older than 24 hours
   - Cleanup unused tokens
   - Recommended: Cloud Function scheduled task

3. **Audit Logs** (Monthly)
   - Archive logs older than 90 days
   - Keep hot data for quick access
   - Store historical data in cold storage

4. **Completed Edit Requests** (Quarterly)
   - Archive completed requests older than 6 months
   - Maintain audit trail in separate collection

---

## Security Rules

### `admin_actions` & `admin_audit_logs`
```javascript
rules_version = '2';
service cloud.firestore {
  match /admin_actions/{docId} {
    allow read: if isAdmin();
    allow write: if isAdmin();
  }
  
  match /admin_audit_logs/{docId} {
    allow read: if isAdmin();
    allow write: if isAdmin();
  }
}
```

### `audit_logs`
```javascript
match /audit_logs/{docId} {
  allow read: if isAdmin() || 
                 request.auth.uid == resource.data.userId;
  allow write: if false; // Server-side only
}
```

### `schedule_edit_requests`
```javascript
match /schedule_edit_requests/{requestId} {
  allow read: if isAdmin() || 
                 request.auth.uid == resource.data.requestedBy;
  allow create: if request.auth != null;
  allow update: if isAdmin();
  allow delete: if isAdmin();
}
```

### `passwordResetTokens`
```javascript
match /passwordResetTokens/{token} {
  allow read, write: if false; // Server-side only
}
```

### `demoSessions`
```javascript
match /demoSessions/{sessionId} {
  allow read: if isDemoUser() || isAdmin();
  allow write: if isAdmin();
}

function isDemoUser() {
  return request.auth != null && 
         request.auth.token.demoSessionId != null;
}
```

---

*Last Updated: 2025-01-11*
*See also: FIRESTORE_COLLECTIONS_CORE.md and FIRESTORE_COLLECTIONS_OTHER.md*
