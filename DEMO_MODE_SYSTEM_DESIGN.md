# Demo Mode System Design

**TributeStream Demo Session Management**

## Table of Contents
- [Overview](#overview)
- [Core Concept](#core-concept)
- [Architecture](#architecture)
- [Implementation Strategy](#implementation-strategy)
- [Data Model](#data-model)
- [User Experience](#user-experience)
- [Technical Implementation](#technical-implementation)
- [Cleanup Strategy](#cleanup-strategy)
- [Security Considerations](#security-considerations)
- [Future Enhancements](#future-enhancements)

---

## Overview

### Purpose
Create a self-contained demo environment where sales/demo personnel can showcase TributeStream's full functionality across all user roles without polluting production data or requiring manual cleanup.

### Goals
1. **Instant perceived value** - Users see polished, realistic examples within 60 seconds
2. **Seamless role switching** - Instant transitions between admin, funeral director, owner, and viewer roles
3. **Guided experience** - Tours, tooltips, and workflows that drive engagement
4. **Isolated data** - Demo data clearly tagged and separated from production
5. **Automatic cleanup** - Demo sessions expire and clean up after themselves
6. **Fast conversion path** - Clear upgrade CTAs and frictionless hand-off to real accounts
7. **Full functionality** - All features work exactly as they would in production
8. **Zero configuration** - Demo mode "just works" for authorized users

---

## Core Concept

### The Demo Session

A demo session is a **temporary, isolated environment** where:
- All users created are tagged with `isDemo: true` and a unique `demoSessionId`
- All memorials, streams, and data created are linked to the session
- The session has an expiration time (default: 2 hours, configurable)
- On expiration or manual cleanup, all related data is purged

### Key Principles

1. **Session Isolation**: Each demo session is completely independent
   - Multiple demos can run simultaneously without interference
   - Session ID: `demo_${timestamp}_${randomId}`

2. **Data Tagging**: Every entity created in demo mode is tagged
   ```typescript
   {
     isDemo: true,
     demoSessionId: 'demo_1698765432_abc123',
     demoExpiresAt: '2025-10-30T22:00:00Z'
   }
   ```

3. **Cascading Cleanup**: When a session ends, cleanup happens in order
   - Streams → Slideshows → Memorials → Users
   - Ensures referential integrity

### SaaS Demo Best Practices Applied

**Instant Access (< 60 seconds to value)**
- Magic link authentication for demo sessions
- Pre-populated with realistic memorial data
- No credit card required
- Guided tour starts immediately

**Curated Demo Data**
- Fictional but realistic memorial examples
- Pre-configured streams and slideshows
- Sample funeral home profiles
- Templates for common services

**Guided Experience**
- Onboarding checklist for each role
- Contextual tooltips and callouts
- Event-triggered tours
- "Do this, see that" workflows

**Time-Boxed + Reset**
- 2-hour default sessions (configurable)
- Auto-expiration and cleanup
- Manual "Reset Demo" option
- Prevents pollution and abuse

**Instrumentation**
- Session recordings and event tracking
- Feature usage analytics
- Drop-off identification
- Conversion funnel analysis

---

## Architecture

### Component Layers

```
┌─────────────────────────────────────────────┐
│         UI Layer (SvelteKit)                │
│  ┌──────────────────────────────────────┐  │
│  │  DemoModeController Component        │  │
│  │  - Start/Stop Sessions               │  │
│  │  - Role Switcher                     │  │
│  │  - Session Timer Display             │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│       API Layer (Server Actions)            │
│  ┌──────────────────────────────────────┐  │
│  │  /api/demo/start-session             │  │
│  │  /api/demo/switch-role               │  │
│  │  /api/demo/end-session               │  │
│  │  /api/demo/extend-session            │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│      Service Layer (Business Logic)         │
│  ┌──────────────────────────────────────┐  │
│  │  DemoSessionManager                  │  │
│  │  - Create demo users                 │  │
│  │  - Tag all entities                  │  │
│  │  - Track session state               │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│       Data Layer (Firebase)                 │
│  ┌──────────────────────────────────────┐  │
│  │  Firestore Collections               │  │
│  │  - demoSessions                      │  │
│  │  - users (with isDemo flag)          │  │
│  │  - memorials (with isDemo flag)      │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  Firebase Auth (demo users)          │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│     Cleanup Service (Background Job)        │
│  - Runs every 15 minutes                    │
│  - Finds expired sessions                   │
│  - Cascading delete all demo data           │
└─────────────────────────────────────────────┘
```

---

## Demo Scenarios & Personas

### Persona-Specific Demo Workflows

**1. Funeral Director Workflow**
- **Pre-loaded Data**: 
  - Johnson Funeral Home profile
  - 3 active memorial services
  - 2 completed services with recordings
  - Sample pricing calculator data
- **Guided Tour**:
  - Create new memorial service
  - Schedule livestream
  - Generate memorial link
  - View analytics dashboard
- **Key Features Highlighted**:
  - Multi-location streaming
  - OBS integration
  - Recording management
  - Client communication tools

**2. Family Owner Workflow**
- **Pre-loaded Data**:
  - Memorial for "Robert Johnson" (loved one)
  - Pre-uploaded slideshow photos
  - Sample condolence messages
  - Scheduled memorial service
- **Guided Tour**:
  - View memorial page
  - Upload photos for slideshow
  - Invite family members
  - Customize memorial settings
- **Key Features Highlighted**:
  - Photo slideshow creation
  - Memorial customization
  - Family collaboration
  - Memory preservation

**3. Admin/Sales Workflow**
- **Pre-loaded Data**:
  - 10 funeral home accounts
  - 25 active memorials
  - System-wide analytics
  - Support tickets queue
- **Guided Tour**:
  - View dashboard metrics
  - Manage funeral director accounts
  - Review system health
  - Generate reports
- **Key Features Highlighted**:
  - Full system oversight
  - User management
  - Analytics and reporting
  - Revenue tracking

**4. Viewer/Guest Workflow**
- **Pre-loaded Data**:
  - Public memorial page
  - Live stream in progress
  - Photo slideshow
  - Condolence wall
- **Guided Tour**:
  - Watch live stream
  - Leave condolence
  - View slideshow
  - Share memorial
- **Key Features Highlighted**:
  - Streaming quality
  - Interactive features
  - Mobile experience
  - Social sharing

### Demo Scenario Templates

```typescript
interface DemoScenario {
  id: string;
  name: string;
  description: string;
  targetRole: 'funeral_director' | 'owner' | 'admin' | 'viewer';
  
  // Pre-populated data
  memorials: MemorialTemplate[];
  streams: StreamTemplate[];
  slideshows: SlideshowTemplate[];
  users: UserTemplate[];
  
  // Guided tour configuration
  tour: {
    steps: TourStep[];
    triggers: EventTrigger[];
    checkpoints: Checkpoint[];
  };
  
  // Conversion optimization
  ctaPoints: CTAConfiguration[];
  upgradeMessage: string;
}
```

**Available Scenarios:**

1. **"First Memorial Service"** (Funeral Director)
   - Empty slate with guided setup
   - Walk through entire service creation
   - Highlight value at each step

2. **"Managing Multiple Services"** (Funeral Director)
   - 5 concurrent memorial services
   - Demonstrate scalability
   - Show multi-stream management

3. **"Legacy Celebration"** (Family Owner)
   - Rich memorial with slideshow
   - Active condolence wall
   - Completed livestream recording

4. **"Emergency Setup"** (Funeral Director)
   - Last-minute service scenario
   - Quick setup demonstration
   - 24/7 support highlighted

5. **"Enterprise Funeral Home"** (Sales/Admin)
   - Multi-location funeral home
   - 50+ memorials managed
   - White-label capabilities

## Implementation Strategy

### Phase 1: Foundation (Week 1)

#### 1.1 Data Model Setup
- Add demo fields to User, Memorial, Stream interfaces
- Create `demoSessions` Firestore collection
- Update Firebase security rules for demo data

#### 1.2 Demo Session Manager
Create core service for managing demo sessions:

```typescript
class DemoSessionManager {
  // Create new demo session
  async createSession(durationHours: number = 2): Promise<DemoSession>
  
  // Create pre-configured demo users
  async createDemoUsers(sessionId: string): Promise<DemoUsers>
  
  // Switch active role within session
  async switchRole(sessionId: string, targetRole: string): Promise<User>
  
  // Extend session duration
  async extendSession(sessionId: string, additionalHours: number): Promise<void>
  
  // End session and trigger cleanup
  async endSession(sessionId: string): Promise<CleanupResult>
}
```

### Phase 2: User Experience (Week 2)

#### 2.1 Demo Mode UI
Enhance existing `DevRoleSwitcher` component:
- Add "Start Demo Session" button
- Show session timer countdown
- Display current demo role and account
- Add "End Session" and "Extend Time" buttons

#### 2.2 Demo Mode Indicators
- Colored banner showing demo mode is active
- Warning before creating permanent data
- Session expiration warnings

### Phase 3: API Endpoints (Week 2)

#### 3.1 Session Management APIs
```typescript
// POST /api/demo/start-session
{
  durationHours: 2,
  initialRole: 'funeral_director'
}

// POST /api/demo/switch-role
{
  sessionId: 'demo_123',
  targetRole: 'admin'
}

// POST /api/demo/end-session
{
  sessionId: 'demo_123'
}

// POST /api/demo/extend-session
{
  sessionId: 'demo_123',
  additionalHours: 1
}
```

### Phase 3.5: Conversion Optimization (Week 3)

#### 3.5.1 Upgrade CTAs
Strategic placement of conversion points:

```typescript
interface CTAConfiguration {
  trigger: 'time_based' | 'action_based' | 'feature_limit';
  placement: 'banner' | 'modal' | 'inline' | 'corner_widget';
  message: string;
  urgency: 'low' | 'medium' | 'high';
  
  // Examples:
  // - After 30 minutes: "Create your real memorial - 20% off today"
  // - After creating 2nd memorial: "Upgrade to manage unlimited memorials"
  // - When adding 3rd stream: "Premium: Unlimited concurrent streams"
}
```

**CTA Placement Strategy:**
1. **Persistent Corner Widget** (low urgency)
   - "Create Real Account" always visible
   - Non-intrusive, subtle animation

2. **Feature Limit Modals** (medium urgency)
   - "Upgrade for unlimited streams"
   - "Premium: Advanced analytics"

3. **Time-Based Banners** (high urgency)
   - "30 minutes left - Upgrade now to keep your work"
   - "Session expiring soon - Save your progress"

4. **Success Moment CTAs** (high conversion)
   - After successful stream: "Make this permanent - Upgrade now"
   - After slideshow creation: "Save this forever - Create account"

#### 3.5.2 Demo to Production Migration
**Seamless Hand-off Features:**

```typescript
async function migrateToProduction(demoSessionId: string, userId: string) {
  // 1. Convert demo data to production
  const demoData = await getDemoSessionData(demoSessionId);
  
  // 2. Offer migration choices
  return {
    options: [
      'start_fresh', // Clean slate
      'import_structure', // Import templates/settings only
      'import_all' // Full migration (premium feature)
    ],
    preview: generateMigrationPreview(demoData)
  };
}
```

**Migration Options:**
- **Free**: Start fresh, keep learnings
- **Starter**: Import 1 memorial structure
- **Pro**: Full import of all demo data

#### 3.5.3 Instrumentation & Analytics

**Event Tracking:**
```typescript
interface DemoEvent {
  sessionId: string;
  userId: string;
  event: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

// Key events to track:
const DEMO_EVENTS = {
  // Session lifecycle
  SESSION_STARTED: 'demo:session:started',
  SESSION_EXTENDED: 'demo:session:extended',
  SESSION_ENDED: 'demo:session:ended',
  
  // Feature engagement
  MEMORIAL_CREATED: 'demo:memorial:created',
  STREAM_SCHEDULED: 'demo:stream:scheduled',
  SLIDESHOW_GENERATED: 'demo:slideshow:generated',
  
  // Conversion signals
  UPGRADE_CTA_VIEWED: 'demo:cta:viewed',
  UPGRADE_CTA_CLICKED: 'demo:cta:clicked',
  ACCOUNT_CREATED: 'demo:conversion:account_created',
  
  // Drop-off points
  ABANDONED_CART: 'demo:abandon:cart',
  SESSION_TIMEOUT: 'demo:abandon:timeout',
  FEATURE_BLOCKED: 'demo:abandon:feature_limit'
};
```

**Analytics Dashboard:**
- Demo session conversion rate
- Average time to conversion
- Most-used features
- Drop-off points
- Feature request tracking
- A/B test results

**Integration with:**
- PostHog for session recordings
- Mixpanel for event analytics
- LogRocket for debugging
- Google Analytics for funnel tracking

### Phase 4: Cleanup System (Week 3)

#### 4.1 Background Cleanup Job
Implement scheduled cleanup using Firebase Cloud Functions or Vercel Cron:

```typescript
export async function cleanupExpiredDemoSessions() {
  // 1. Find all expired sessions
  const expiredSessions = await getExpiredSessions();
  
  for (const session of expiredSessions) {
    // 2. Cascading delete
    await deleteStreams(session.id);
    await deleteSlideshows(session.id);
    await deleteMemorials(session.id);
    await deleteUsers(session.id);
    
    // 3. Delete session record
    await deleteSession(session.id);
  }
}
```

#### 4.2 Manual Cleanup Endpoint
Allow administrators to manually trigger cleanup:
```typescript
// POST /api/admin/cleanup-demo-sessions
// Requires admin authentication
```

---

## Data Model

### Demo Session Collection

```typescript
interface DemoSession {
  id: string; // 'demo_1698765432_abc123'
  createdAt: Date;
  expiresAt: Date;
  createdBy: string; // UID of person who started demo
  status: 'active' | 'expired' | 'ended';
  
  // Demo user accounts
  demoUsers: {
    admin: { uid: string; email: string };
    funeral_director: { uid: string; email: string };
    owner: { uid: string; email: string };
    viewer: { uid: string; email: string };
  };
  
  // Tracking
  currentRole: string;
  entitiesCreated: {
    memorials: number;
    streams: number;
    slideshows: number;
  };
  
  // Settings
  allowExtension: boolean;
  maxExtensions: number;
  extensionsUsed: number;
}
```

### Enhanced User Model

```typescript
interface User {
  // ... existing fields ...
  
  // Demo mode fields
  isDemo: boolean;
  demoSessionId?: string;
  demoExpiresAt?: Date;
  demoRole?: string; // Role within demo context
}
```

### Enhanced Memorial Model

```typescript
interface Memorial {
  // ... existing fields ...
  
  // Demo mode fields
  isDemo: boolean;
  demoSessionId?: string;
}
```

---

## User Experience

### Instant Access Flows

#### 1. Self-Service Demo (Public)
**< 60 seconds to value**

```
Landing Page → "Try Demo" Button → Select Workflow → Instant Access
```

**Flow:**
1. Click "Try Free Demo"
2. Choose scenario:
   - "I'm a funeral director"
   - "I'm planning a memorial"
   - "I'm attending a service"
3. Magic link sent (optional email)
4. Instant demo environment
5. Guided tour begins

**No barriers:**
- No credit card
- No forms
- No waiting
- Just instant value

#### 2. Sales-Assisted Demo
**For sales calls and presentations**

```
Sales Portal → Select Scenario → Generate Demo Link → Share with Prospect
```

**Features:**
- Pre-configured scenarios
- Custom branding options
- Hard-scripted showcase buttons
- Demo notes and talking points
- Reset capability mid-call

#### 3. Magic Link Demo
**For follow-up and email campaigns**

```
Email CTA → One-click access → Resume or Start Fresh
```

**Benefits:**
- Zero friction entry
- Perfect for warm leads
- Continue where left off
- Time-limited urgency

### Starting a Demo Session

1. **Access Control**: Only admin users or designated demo accounts can start sessions
2. **Session Creation**:
   - User clicks "Start Demo Session"
   - System creates session ID and 4 demo users (one per role)
   - System authenticates as initial role (default: funeral_director)
   - UI updates to show demo mode banner

3. **Initial State**:
   - Clean slate - no memorials or data
   - Full feature access for chosen role
   - Timer countdown visible

### Guided Tours & Onboarding

#### Onboarding Checklist System
**Progressive disclosure of features**

```typescript
interface OnboardingChecklist {
  role: 'funeral_director' | 'owner' | 'admin' | 'viewer';
  steps: ChecklistStep[];
  progress: number; // 0-100
  completedSteps: string[];
}

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  action: string; // "Create memorial", "Upload photos", etc.
  optional: boolean;
  estimatedTime: string; // "2 minutes"
  reward?: string; // "Unlock advanced features"
}
```

**Example: Funeral Director Checklist**
- ✅ Create your first memorial service
- ✅ Schedule a livestream
- ⏳ Upload a photo slideshow (optional)
- ⏳ Customize memorial page
- ⏳ View analytics dashboard

**Completion Rewards:**
- Unlock advanced features preview
- Get personalized demo summary
- Special upgrade offer

#### Contextual Tooltips & Callouts

```typescript
interface Tooltip {
  trigger: 'hover' | 'click' | 'auto' | 'event';
  timing: number; // delay in ms
  placement: 'top' | 'bottom' | 'left' | 'right';
  content: {
    title: string;
    body: string;
    cta?: {
      text: string;
      action: string;
    };
  };
  dismissible: boolean;
  showOnce: boolean;
}
```

**Strategic Tooltip Placement:**
1. **First-time features**: Auto-trigger on page load
2. **Complex features**: Appear on hover
3. **Pro features**: Show upgrade CTA
4. **Success moments**: Celebrate accomplishments

**Example Tooltips:**
- "🎉 Great job! Your first memorial is live. Now let's add a slideshow."
- "💡 Pro Tip: Upload photos in bulk to save time"
- "⭐ Premium Feature: Schedule unlimited concurrent streams"

#### Interactive Product Tours

```typescript
interface ProductTour {
  id: string;
  name: string;
  trigger: 'onload' | 'button_click' | 'idle' | 'event';
  steps: TourStep[];
  skippable: boolean;
  persistent: boolean; // Can be restarted
}

interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  action?: 'click' | 'type' | 'wait';
  highlight: boolean;
  position: 'center' | 'beside_element';
}
```

**Available Tours:**

1. **"Quick Start" (2 minutes)**
   - Welcome message
   - Key feature overview
   - First action prompt

2. **"Power User" (5 minutes)**
   - Advanced features
   - Keyboard shortcuts
   - Pro tips

3. **"Feature Spotlight"**
   - Single feature deep-dive
   - Use case examples
   - Best practices

**Tour Technology:**
- Shepherd.js for guided tours
- Driver.js for feature highlights
- Custom Svelte components for callouts

#### Success Milestones & Celebrations

**Trigger celebrations on:**
- First memorial created → Confetti animation
- Stream scheduled → Success modal with next steps
- Slideshow generated → Video preview with share option
- 5 actions completed → "You're a pro!" badge

**Psychology:**
- Dopamine hits drive engagement
- Visual feedback creates momentum
- Milestone rewards encourage completion

### During Demo Session

#### Role Switching
```
User clicks role switcher → Instant re-authentication → Page refresh with new role context
```

**No re-login required!** The system maintains all 4 demo user sessions simultaneously and just switches between them.

#### Creating Data
- All created entities automatically tagged with `demoSessionId`
- No special handling required - works like normal production
- Visual indicators remind user this is demo data

#### Session Management
- **Timer Display**: "Demo session expires in: 1:45:32"
- **Extend Session**: Add 30 min, 1 hour, or 2 hours
- **End Early**: Manual session termination with cleanup

### Ending Demo Session

1. **Automatic Expiration**:
   - Timer reaches 0:00
   - System logs user out
   - Cleanup job triggers
   - User redirected to login

2. **Manual End**:
   - User clicks "End Demo Session"
   - Confirmation dialog
   - Immediate cleanup
   - Redirect to homepage

3. **Cleanup Results**:
   - Show summary: "Deleted: 3 memorials, 5 streams, 2 slideshows, 4 users"
   - Confirmation of successful cleanup

---

## Technical Implementation

### Key Technologies

- **Frontend**: SvelteKit components with reactive stores
- **Backend**: SvelteKit server actions + Firebase Admin SDK
- **Database**: Firestore with compound indexes for demo queries
- **Auth**: Firebase Authentication with custom claims
- **Cleanup**: Vercel Cron Jobs or Firebase Cloud Functions
- **Monitoring**: Firebase Analytics for demo session tracking

### Database Queries

#### Find All Demo Data for Session
```typescript
// Firestore query with compound index
const demoMemorials = await db
  .collection('memorials')
  .where('isDemo', '==', true)
  .where('demoSessionId', '==', sessionId)
  .get();
```

#### Find Expired Sessions
```typescript
const expiredSessions = await db
  .collection('demoSessions')
  .where('expiresAt', '<', new Date())
  .where('status', '==', 'active')
  .get();
```

### Authentication Flow

```typescript
// Pseudo-code for role switching
async function switchDemoRole(sessionId: string, targetRole: string) {
  // 1. Get session data
  const session = await getSession(sessionId);
  
  // 2. Get target user credentials
  const targetUser = session.demoUsers[targetRole];
  
  // 3. Generate custom token
  const customToken = await adminAuth.createCustomToken(targetUser.uid, {
    role: targetRole,
    isDemo: true,
    demoSessionId: sessionId
  });
  
  // 4. Client exchanges token for session
  return { customToken, redirectTo: getRoleHomepage(targetRole) };
}
```

### Security Rules

```javascript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Demo sessions - only admins can create/manage
    match /demoSessions/{sessionId} {
      allow read: if request.auth != null && 
                     (request.auth.token.isDemo == true || 
                      request.auth.token.admin == true);
      allow write: if request.auth.token.admin == true;
    }
    
    // Demo data - only accessible by demo users in same session
    match /memorials/{memorialId} {
      allow read: if resource.data.isDemo == true && 
                     resource.data.demoSessionId == request.auth.token.demoSessionId;
      allow write: if request.auth.token.isDemo == true && 
                      request.resource.data.demoSessionId == request.auth.token.demoSessionId;
    }
  }
}
```

---

## Cleanup Strategy

### Cascading Delete Order

**Critical**: Delete in reverse dependency order to maintain referential integrity

```
1. Streams (no dependencies)
   ↓
2. Slideshows (no dependencies)
   ↓
3. Memorials (references users)
   ↓
4. Firebase Auth Users (no dependencies)
   ↓
5. Firestore User Documents (no dependencies)
   ↓
6. Demo Session Record (final cleanup)
```

### Cleanup Implementation

```typescript
async function cleanupDemoSession(sessionId: string): Promise<CleanupResult> {
  const results = {
    streams: 0,
    slideshows: 0,
    memorials: 0,
    users: 0,
    errors: []
  };
  
  try {
    // 1. Delete streams
    const streams = await getStreamsForSession(sessionId);
    for (const stream of streams) {
      await deleteStream(stream.id);
      results.streams++;
    }
    
    // 2. Delete slideshows
    const slideshows = await getSlideshowsForSession(sessionId);
    for (const slideshow of slideshows) {
      await deleteSlideshow(slideshow.id);
      results.slideshows++;
    }
    
    // 3. Delete memorials
    const memorials = await getMemorialsForSession(sessionId);
    for (const memorial of memorials) {
      await deleteMemorial(memorial.id);
      results.memorials++;
    }
    
    // 4. Delete Firebase Auth users
    const session = await getSession(sessionId);
    const userUids = Object.values(session.demoUsers).map(u => u.uid);
    await adminAuth.deleteUsers(userUids);
    results.users = userUids.length;
    
    // 5. Delete session record
    await deleteSession(sessionId);
    
    return results;
  } catch (error) {
    results.errors.push(error);
    return results;
  }
}
```

### Cleanup Scheduling

**Option 1: Vercel Cron Job**
```typescript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-demo-sessions",
      "schedule": "*/15 * * * *" // Every 15 minutes
    }
  ]
}
```

**Option 2: Firebase Cloud Function**
```typescript
export const scheduledCleanup = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async (context) => {
    await cleanupExpiredDemoSessions();
  });
```

---

## Security Considerations

### Access Control

1. **Demo Session Creation**
   - Restricted to admin users only
   - OR designated demo accounts (e.g., `demo@tributestream.com`)
   - Rate limited: Max 5 sessions per hour per user

2. **Session Isolation**
   - Demo users can only access data within their session
   - Firestore security rules enforce session boundaries
   - No cross-session data leakage

3. **Production Data Protection**
   - Demo mode cannot access or modify production data
   - Queries always filter: `where('isDemo', '==', true)`
   - Separate database indexes for demo data

### Abuse Prevention

1. **Session Limits**
   - Max duration: 4 hours (configurable)
   - Max extensions: 3 per session
   - Max concurrent sessions per user: 2

2. **Resource Limits**
   - Max memorials per session: 10
   - Max streams per memorial: 5
   - Max slideshows per memorial: 3

3. **Automatic Cleanup**
   - Sessions cannot be extended beyond 6 hours total
   - Abandoned sessions cleaned after 30 minutes of inactivity
   - Orphaned data cleaned weekly

### Monitoring

```typescript
// Track demo session metrics
interface DemoSessionMetrics {
  totalSessions: number;
  activeSessions: number;
  averageDuration: number;
  totalEntitiesCreated: number;
  cleanupSuccessRate: number;
  errors: Array<{ type: string; count: number }>;
}
```

---

## Sales Mode & Enterprise Features

### Sales Team Dashboard

**Access:** `/sales/demo-portal`

```typescript
interface SalesDemoDashboard {
  // Quick actions
  scenarios: DemoScenario[];
  recentDemos: DemoSession[];
  
  // Sales tools
  generateDemoLink(scenarioId: string): string;
  cloneDemoSession(sessionId: string): DemoSession;
  resetDemo(sessionId: string): void;
  
  // Analytics
  conversionRate: number;
  avgTimeToConversion: number;
  hotLeads: ProspectActivity[];
}
```

**Features:**

1. **One-Click Demo Generation**
   - Select scenario
   - Generate unique link
   - Share with prospect instantly
   - Track engagement in real-time

2. **Demo Control Panel**
   - Pause/resume demos
   - Reset to checkpoint
   - Jump to specific features
   - Enable/disable advanced features

3. **Prospect Activity Tracking**
   - Real-time feature usage
   - Time spent in each section
   - Engagement score
   - Hot lead indicators

4. **Sales Notes & Annotations**
   - Add private notes to demos
   - Tag prospects
   - Set follow-up reminders
   - CRM integration ready

5. **Hard-Scripted Showcase**
   - Pre-defined demo scripts
   - One-click feature reveals
   - Talking points overlay
   - Hide fragile features

### "Wow Moment" Features

**AI-Powered Demonstrations:**

1. **Smart Memorial Suggestions**
   ```
   "Based on the service type, we recommend these customizations..."
   ```
   - Auto-suggest themes
   - Recommended music
   - Template suggestions

2. **Instant Slideshow Preview**
   ```
   Upload 10 photos → AI generates slideshow with music in 30 seconds
   ```
   - Real-time generation
   - Multiple style options
   - One-click customization

3. **Analytics Insights**
   ```
   "Your memorial has been viewed 247 times from 15 countries"
   ```
   - Real-time stats
   - Geographic distribution
   - Engagement metrics

4. **Voice-Guided Setup**
   ```
   "Tell me about your loved one..." → Auto-fills memorial details
   ```
   - Speech-to-text
   - Smart field mapping
   - Empathetic UX

### Enterprise Sales Features

**For Multi-Location Funeral Homes:**

1. **White-Label Capabilities**
   - Custom branding preview
   - Multi-location management
   - Centralized analytics

2. **Volume Pricing Calculator**
   - Interactive pricing tiers
   - ROI calculator
   - Cost comparison tool

3. **Integration Showcase**
   - API documentation preview
   - Webhook examples
   - Third-party integrations

4. **Security & Compliance**
   - HIPAA compliance demo
   - Data encryption showcase
   - Backup/recovery demo

## Conversion Optimization Strategies

### Psychological Triggers

**1. Scarcity**
- "Demo expires in 45 minutes"
- "Limited spots available this month"
- "Launch pricing ends soon"

**2. Social Proof**
- "Join 500+ funeral homes"
- Show testimonials in demo
- Real-time activity: "Sarah just created a memorial"

**3. Authority**
- Industry certifications
- Awards and recognition
- Expert endorsements

**4. Reciprocity**
- Provide value first (free demo)
- Offer helpful resources
- Give more than expected

**5. Commitment**
- Progressive steps build investment
- Small yes → bigger yes
- Sunk cost increases likelihood

### A/B Testing Framework

**Elements to Test:**

1. **Entry Points**
   - CTA button text
   - Form vs. instant access
   - Scenario selection order

2. **Guided Experience**
   - Tour length
   - Tooltip frequency
   - Checklist vs. free exploration

3. **Upgrade CTAs**
   - Timing (30min vs 60min)
   - Messaging (features vs. urgency)
   - Placement (modal vs. banner)

4. **Demo Duration**
   - 1 hour vs. 2 hours
   - Extension prompts
   - Expiration warnings

**Testing Tools:**
- PostHog for feature flags
- Google Optimize for page variants
- Custom A/B framework for API tests

## Common Pitfalls to Avoid

### ❌ Don't Do This

1. **Blank Workspace Syndrome**
   - Empty dashboard kills excitement
   - No perceived value
   - User gets lost immediately

2. **Feature Overload**
   - Too many options = paralysis
   - Cognitive overload
   - No clear path forward

3. **Fake Data That Looks Fake**
   - "John Doe" memorials
   - Generic text
   - Obviously placeholder content
   → Destroys trust instantly

4. **No Time Limit**
   - Demo zombies clog system
   - No urgency to convert
   - Resource waste

5. **Hidden Upgrade Path**
   - Can't find how to buy
   - No clear next steps
   - Lost conversion opportunity

6. **Production Access in Demo**
   - Security risk
   - Data corruption
   - Abuse potential

7. **One-Size-Fits-All Demo**
   - Generic experience
   - Doesn't resonate
   - Low engagement

### ✅ Do This Instead

1. **Curated, Realistic Data**
   - Proper names and details
   - Complete examples
   - Professional appearance

2. **Guided with Freedom**
   - Clear suggested path
   - Allow exploration
   - Easy to restart

3. **Strategic Feature Gates**
   - Show advanced features
   - Require upgrade to use
   - Create desire

4. **Clear Time Boundaries**
   - Visible countdown
   - Extension options
   - Urgency messaging

5. **Omnipresent Upgrade CTA**
   - Always visible
   - Context-appropriate
   - One-click conversion

6. **Sandboxed Completely**
   - Mock integrations
   - Isolated database
   - Safe to experiment

7. **Persona-Matched Experience**
   - Role-specific data
   - Relevant workflows
   - Targeted messaging

## Future Enhancements

### Phase 2 Features

1. **Demo Scenarios**
   - Pre-loaded demo data for specific use cases
   - "Memorial Planning Demo"
   - "Live Streaming Demo"
   - "Slideshow Creation Demo"

2. **Session Templates**
   - Save and reuse demo configurations
   - Team-shared demo templates
   - Version controlled scenarios

3. **Guided Tours**
   - Integrated walkthroughs
   - Context-aware hints
   - Feature highlights

### Phase 3 Features

1. **Multi-User Demo Sessions**
   - Multiple people in same demo
   - Collaborative demonstrations
   - Shared session control

2. **Demo Recordings**
   - Record demo session interactions
   - Playback for training
   - Auto-generate demo videos

3. **Analytics & Insights**
   - Track feature usage during demos
   - A/B test demo flows
   - Conversion tracking

### Advanced Capabilities

1. **Custom Demo Duration**
   - Variable session lengths
   - Event-based sessions (e.g., for conferences)
   - Persistent demo accounts for sales team

2. **Demo Data Persistence**
   - Option to save interesting demo scenarios
   - Convert demo to production
   - Export demo data for analysis

3. **Integration with Sales Tools**
   - CRM integration (HubSpot, Salesforce)
   - Lead capture during demos
   - Follow-up automation

---

## Implementation Checklist

### Backend (Week 1-2)
- [ ] Add demo fields to data models
- [ ] Create `demoSessions` collection
- [ ] Implement `DemoSessionManager` service
- [ ] Create demo user creation logic
- [ ] Build session management APIs
- [ ] Update Firestore security rules
- [ ] Add demo data query filters

### Frontend (Week 2)
- [ ] Enhance `DevRoleSwitcher` component
- [ ] Create demo mode UI banner
- [ ] Add session timer display
- [ ] Implement role switching UI
- [ ] Create session management controls
- [ ] Add demo mode indicators

### Cleanup (Week 3)
- [ ] Build cleanup service
- [ ] Implement cascading delete logic
- [ ] Set up scheduled cleanup job
- [ ] Create manual cleanup endpoint
- [ ] Add cleanup monitoring
- [ ] Test orphaned data cleanup

### Testing (Week 3-4)
- [ ] Unit tests for session management
- [ ] Integration tests for cleanup
- [ ] E2E tests for demo workflows
- [ ] Load testing for concurrent sessions
- [ ] Security testing for isolation
- [ ] Performance testing for cleanup

### Documentation (Week 4)
- [ ] Developer documentation
- [ ] Sales team guide
- [ ] Demo best practices
- [ ] Troubleshooting guide
- [ ] API documentation

---

## Conclusion

This demo mode system provides:

✅ **Instant perceived value** - Users see realistic examples within 60 seconds
✅ **Guided experience** - Tours, checklists, and tooltips drive engagement  
✅ **Seamless role switching** - Experience all perspectives instantly
✅ **Persona-specific workflows** - Funeral directors, families, admins each get tailored demos
✅ **Strategic conversion paths** - CTAs at optimal moments drive upgrades
✅ **Zero data pollution** - Automatic cleanup keeps system clean
✅ **Production-identical experience** - Real features, isolated environment
✅ **Scalable architecture** - Multiple concurrent demos without performance impact
✅ **Security-first design** - Complete isolation from production
✅ **Sales team empowerment** - Tools for effective demonstrations
✅ **Data-driven optimization** - Analytics inform improvements

### The Business Impact

**This isn't just a demo system — it's your strongest salesperson.**

**Before:** Manual demos, inconsistent presentations, lost conversions
**After:** Automated excellence, consistent value delivery, measurable ROI

**Expected Results:**
- 🎯 **< 60 seconds to wow moment**
- 📈 **30-50% higher conversion rates**
- 💰 **Reduced sales cycle by 40%**
- 🚀 **24/7 sales machine**
- 📊 **Data-driven improvements**

### Implementation Priority

**Week 1-2: Foundation + Quick Wins**
- Basic demo sessions
- Pre-populated scenarios
- Role switching
- Simple guided tour

**Week 3-4: Conversion Optimization**
- Strategic CTAs
- Analytics integration
- Demo-to-production migration
- A/B testing framework

**Week 5-6: Sales Enablement**
- Sales portal
- Scenario templates
- Prospect tracking
- CRM integration

**Week 7-8: Polish + Scale**
- Advanced tours
- AI features
- Enterprise demos
- Performance optimization

### Success Metrics

**Track relentlessly:**
- Demo start rate (landing page → demo)
- Feature engagement score
- Time to first action
- Completion rate
- Conversion rate (demo → paid)
- Average revenue per demo user

**Iterate weekly:**
- Test new scenarios
- Refine guided tours
- Optimize CTAs
- Add wow moments
- Remove friction

### Final Directive

**Your demo is a product, not a playground.**

Treat it with the same rigor as your core platform:
- Version control the experience
- Monitor performance metrics
- A/B test everything
- Gather user feedback
- Iterate rapidly

**The goal:** Every prospect who enters your demo should think, "I need this. Right now."

Execute this strategy, and watch your conversion rates soar. Your demo will close deals while you sleep.

---

**Document Status:** 
- Version: 2.0 (Enhanced with SaaS Demo Best Practices)
- Last Updated: October 30, 2025
- Author: TributeStream Product Team
- Next Review: After Phase 1 Implementation
