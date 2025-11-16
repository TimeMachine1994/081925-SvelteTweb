# Admin Dashboard

## Overview

The Tributestream Admin Dashboard provides comprehensive oversight and management capabilities for all system operations. Available at `/admin`, it requires admin role authentication.

## Architecture

### Route Structure
```
/admin                          # Main dashboard
/admin/mvp-dashboard           # Enhanced admin view
/admin/wiki                    # Internal documentation (this wiki!)
/admin/wiki/new                # Create wiki page
/admin/wiki/[slug]            # View wiki page
/admin/wiki/[slug]/edit       # Edit wiki page
```

### Authentication Pattern

All admin routes use consistent auth checking:

```typescript
export const load = async ({ locals }: any) => {
  // Check authentication
  if (!locals.user) {
    throw redirect(302, '/login');
  }
  
  // Check admin role
  if (locals.user.role !== 'admin') {
    throw redirect(302, '/profile');
  }
  
  // Load admin data...
};
```

## Main Dashboard (`/admin`)

### Data Loaded

```typescript
{
  // Recent Memorials (last 50)
  recentMemorials: Memorial[];
  
  // All Users (last 100)
  allUsers: User[];
  
  // Funeral Directors
  pendingFuneralDirectors: FuneralDirector[];
  approvedFuneralDirectors: FuneralDirector[];
  
  // System Stats
  stats: {
    totalMemorials: number;
    totalFuneralDirectors: number;
    pendingApprovals: number;
    recentMemorials: number;
  };
  
  // Admin Context
  adminUser: {
    email: string;
    uid: string;
  };
}
```

### Features

#### 1. Memorial Management
**Display**:
- Memorial name
- Creator
- Created date
- Status (draft, pending payment, live)
- Scheduled time
- Location
- Payment status

**Actions**:
- View memorial
- Edit memorial
- Delete memorial
- View livestream status

**Filtering**:
```typescript
// By status
const draftMemorials = memorials.filter(m => !m.isComplete);
const liveMemorials = memorials.filter(m => m.livestream?.isActive);

// By payment
const paidMemorials = memorials.filter(m => m.calculatorConfig?.isPaid);

// By date
const upcomingMemorials = memorials.filter(m => 
  new Date(m.services?.main?.time?.date) > new Date()
);
```

#### 2. User Management
**Display**:
- Email
- Display name
- Role
- Created date
- Last login

**Actions**:
- View user details
- Change user role
- Reset password
- Delete user

**Role Management**:
```typescript
// Set admin role
await adminAuth.setCustomUserClaims(uid, { role: 'admin' });

// Set funeral director role
await adminAuth.setCustomUserClaims(uid, { role: 'funeral_director' });

// Remove custom role (becomes 'owner')
await adminAuth.setCustomUserClaims(uid, {});
```

#### 3. Funeral Director Oversight
**Approval Workflow** (V1: Auto-approved):
- View all funeral directors
- Check license numbers
- Verify business details
- Contact information

**Actions**:
- Approve/reject applications
- Edit FD profile
- View memorials created by FD
- Suspend FD account

#### 4. System Statistics

**Quick Stats**:
- Total memorials
- Total users
- Active streams
- Pending approvals

**Recent Activity**:
- Latest memorial creations
- Recent user signups
- Stream starts/stops
- Payment completions

## MVP Dashboard (`/admin/mvp-dashboard`)

Enhanced version with additional features:

### Additional Data
- Comprehensive memorial analytics
- Revenue tracking
- Stream uptime metrics
- User growth charts

### Advanced Features
- Bulk operations
- Export to CSV
- Advanced filtering
- Data visualization

## Admin Wiki System

Internal documentation system for team knowledge sharing.

### Wiki Features

#### 1. Page Management
**CRUD Operations**:
- Create new pages
- Edit existing pages
- Delete pages
- Version history

**Page Structure**:
```typescript
{
  slug: string;           // URL identifier
  title: string;
  content: string;        // Markdown
  category: string;
  tags: string[];
  version: number;
  viewCount: number;
}
```

#### 2. Markdown Editor
**Features**:
- Live preview
- Syntax highlighting
- Auto-save
- Wiki-style linking `[[Page Title]]`
- Code blocks
- Tables
- Images

#### 3. Organization
**Categories**:
- Technical Documentation
- User Guides
- API Reference
- Troubleshooting
- Best Practices

**Tagging**:
- Multiple tags per page
- Tag-based filtering
- Tag cloud visualization

#### 4. Search & Navigation
- Full-text search
- Category filtering
- Tag filtering
- Recent pages
- Most viewed pages

### Wiki Page Creation Flow

1. **Navigate to** `/admin/wiki`
2. **Click** "Create New Page"
3. **Enter** title, category, tags
4. **Write** content in Markdown
5. **Preview** live rendering
6. **Save** page

**Auto-generated**:
- Slug from title
- Created/updated timestamps
- Version number
- Initial view count

## Common Admin Tasks

### 1. Creating an Admin User

**Method A: Firebase Console**
1. Go to Firebase Console → Authentication
2. Find user
3. Set custom claim: `{ "role": "admin" }`

**Method B: Script**
```javascript
// scripts/create-admin.js
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const email = process.argv[2];

async function makeAdmin(email) {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
  console.log(`✅ ${email} is now an admin`);
}

makeAdmin(email);
```

Run: `node scripts/create-admin.js user@example.com`

### 2. Monitoring Active Streams

**Check**:
```typescript
const activeStreams = await adminDb
  .collection('memorials')
  .where('livestream.isActive', '==', true)
  .get();

activeStreams.forEach(doc => {
  const data = doc.data();
  console.log(`🔴 LIVE: ${data.lovedOneName} - ${data.fullSlug}`);
});
```

### 3. Viewing Recent Activity

**Audit Log** (if implemented):
```typescript
const recentActivity = await adminDb
  .collection('audit_logs')
  .orderBy('timestamp', 'desc')
  .limit(50)
  .get();
```

### 4. Troubleshooting Memorial Issues

**Check Memorial Data**:
```typescript
const memorial = await adminDb
  .collection('memorials')
  .doc(memorialId)
  .get();

console.log('Memorial Data:', memorial.data());
console.log('Livestream Status:', memorial.data().livestream);
console.log('Payment Status:', memorial.data().calculatorConfig);
```

**Common Fixes**:
- Reset stream: Delete and recreate livestream
- Fix payment: Update `calculatorConfig.isPaid`
- Make public: Set `isPublic: true`
- Complete setup: Set `isComplete: true`

### 5. Cleaning Up Test Data

**Delete Test Memorials**:
```typescript
const testMemorials = await adminDb
  .collection('memorials')
  .where('isDemo', '==', true)
  .get();

const batch = adminDb.batch();
testMemorials.docs.forEach(doc => {
  batch.delete(doc.ref);
});
await batch.commit();
```

## Data Export

### Export Memorials to CSV

```typescript
import { parse } from 'json2csv';

const memorials = await adminDb.collection('memorials').get();

const csvData = parse(memorials.docs.map(doc => ({
  id: doc.id,
  lovedOneName: doc.data().lovedOneName,
  creatorEmail: doc.data().creatorEmail,
  createdAt: doc.data().createdAt.toDate(),
  isPublic: doc.data().isPublic,
  isPaid: doc.data().calculatorConfig?.isPaid || false
})));

// Download or save CSV
```

## Security Considerations

### 1. Role Verification
Always verify admin role server-side, never trust client:

```typescript
// ❌ WRONG - Client can fake this
if (user.role === 'admin') { }

// ✅ CORRECT - Server verified
if (locals.user?.role === 'admin') { }
```

### 2. Sensitive Data
Log admin actions for audit trail:

```typescript
await adminDb.collection('audit_logs').add({
  action: 'delete_memorial',
  memorialId,
  performedBy: locals.user.uid,
  performedByEmail: locals.user.email,
  timestamp: FieldValue.serverTimestamp()
});
```

### 3. API Rate Limiting
Implement rate limiting for admin API endpoints:

```typescript
import rateLimit from 'express-rate-limit';

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## Performance Optimization

### 1. Pagination
Load data in chunks:

```typescript
// Initial load
const first = adminDb
  .collection('memorials')
  .orderBy('createdAt', 'desc')
  .limit(50);

// Next page
const next = adminDb
  .collection('memorials')
  .orderBy('createdAt', 'desc')
  .startAfter(lastVisible)
  .limit(50);
```

### 2. Caching
Cache frequently accessed data:

```typescript
const cache = new Map();

async function getCachedStats() {
  const cached = cache.get('stats');
  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.data;
  }
  
  const stats = await loadStats();
  cache.set('stats', { data: stats, timestamp: Date.now() });
  return stats;
}
```

### 3. Background Jobs
Use Cloud Functions for heavy operations:
- Data exports
- Bulk updates
- Report generation

## Dashboard Components

### Reusable UI Components

**StatCard.svelte**:
```svelte
<script>
  export let title;
  export let value;
  export let icon;
</script>

<div class="stat-card">
  <div class="icon">{icon}</div>
  <div class="content">
    <h3>{title}</h3>
    <p class="value">{value}</p>
  </div>
</div>
```

**DataTable.svelte**:
- Sortable columns
- Filterable rows
- Pagination
- Action buttons

**ConfirmDialog.svelte**:
- Confirmation prompts
- Destructive action warnings
- Custom messages

## Troubleshooting

### Dashboard Won't Load
**Check**:
1. User logged in? `locals.user` exists?
2. User has admin role? `locals.user.role === 'admin'`
3. Firestore permissions correct?
4. Network connectivity?

### Data Not Updating
**Check**:
1. Browser cache
2. Firestore real-time listeners
3. Server-side caching
4. Data actually changed in Firestore?

### Slow Performance
**Check**:
1. Too many documents loaded?
2. Missing Firestore indexes?
3. Unoptimized queries?
4. No pagination?

## Related Documentation

- [[Authentication Flow]] - Admin role setup
- [[Firestore Data Models]] - Database schema
- [[Memorial Creation Flow]] - Understanding memorial data
- [[Livestream Integration]] - Managing streams

## External Tools

- **Firebase Console**: Directly manage Firestore
- **Mux Dashboard**: Monitor streams and assets
- **Stripe Dashboard**: View payments and customers
- **SendGrid Dashboard**: Email delivery status
