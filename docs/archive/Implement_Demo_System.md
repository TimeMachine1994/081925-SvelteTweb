# Tributestream Demo System Implementation Plan

**Version:** 1.0  
**Target Completion:** 3 weeks  
**Scope:** Foundation, Demo Scenarios, and Guided Experience  
**Note:** Analytics tracking covered by existing Crazy Egg implementation

---

## Table of Contents

- [Phase 1: Foundation & Session Management](#phase-1-foundation--session-management)
- [Phase 2: Demo Scenarios & Pre-populated Data](#phase-2-demo-scenarios--pre-populated-data)
- [Phase 3: Guided Experience & Tours](#phase-3-guided-experience--tours)
- [Testing Strategy](#testing-strategy)
- [Deployment Checklist](#deployment-checklist)

---

## Phase 1: Foundation & Session Management

**Timeline:** Week 1 (5-7 days)  
**Goal:** Build core demo session infrastructure with role switching

### 1.1 Update TypeScript Interfaces (2 hours)

**Create:** `frontend/src/lib/types/demo.ts`

**Tasks:**
- [ ] Create DemoSession interface
- [ ] Create DemoUser interface  
- [ ] Create DemoEntity interface
- [ ] Export from main types index
- [ ] Verify no circular dependencies

**Code Structure:**
```typescript
export interface DemoSession {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'ended';
  users: {
    admin: DemoUser;
    funeral_director: DemoUser;
    owner: DemoUser;
    viewer: DemoUser;
  };
  currentRole: string;
  metadata: Record<string, any>;
}
```

---

### 1.2 Extend Existing Interfaces with Demo Fields (1 hour)

**Modify:**
- `frontend/src/lib/types/user.ts`
- `frontend/src/lib/types/memorial.ts`
- `frontend/src/lib/types/stream.ts`

**Add to each:**
```typescript
isDemo?: boolean;
demoSessionId?: string;
demoExpiresAt?: string;
```

**Acceptance Criteria:**
- [ ] All interfaces updated
- [ ] Fields are optional (backward compatible)
- [ ] TypeScript compiles without errors

---

### 1.3 Create Firestore Collection Structure (1 hour)

**Collection:** `demoSessions`

**Setup Tasks:**
- [ ] Create collection in Firestore Console
- [ ] Add composite index: `status` + `expiresAt`
- [ ] Add index: `createdBy`
- [ ] Document schema in README

**Sample Document:**
```json
{
  "id": "demo_1730345678_abc123",
  "createdAt": "2025-10-30T20:00:00Z",
  "expiresAt": "2025-10-30T22:00:00Z",
  "status": "active",
  "createdBy": "admin_uid",
  "users": {
    "admin": { "uid": "...", "email": "...", "role": "admin" },
    "funeral_director": { "uid": "...", "email": "...", "role": "funeral_director" },
    "owner": { "uid": "...", "email": "...", "role": "owner" },
    "viewer": { "uid": "...", "email": "...", "role": "viewer" }
  },
  "currentRole": "funeral_director"
}
```

---

### 1.4 Create Demo Session Management API (4 hours)

**Create:** `frontend/src/routes/api/demo/session/+server.ts`

**Endpoints:**
- POST `/api/demo/session` - Create new session
- GET `/api/demo/session/[id]` - Get session status

**Implementation Steps:**
1. [ ] Create POST handler
2. [ ] Implement `createDemoUsers()` helper
3. [ ] Generate session ID and timestamps
4. [ ] Create 4 demo users in Firebase Auth
5. [ ] Set custom claims on each user
6. [ ] Create user documents in Firestore
7. [ ] Create session document
8. [ ] Generate custom token for initial role
9. [ ] Create GET handler for status checks
10. [ ] Add error handling and logging

**Helper Function:**
```typescript
async function createDemoUsers(sessionId: string) {
  const roles = ['admin', 'funeral_director', 'owner', 'viewer'];
  const demoUsers = {};
  
  for (const role of roles) {
    // Create Firebase Auth user
    // Set custom claims
    // Create Firestore document
    // Add to demoUsers object
  }
  
  return demoUsers;
}
```

**Security:**
- Admin-only access
- Validate session duration (max 4 hours)
- Rate limiting (max 10 sessions per admin per day)

---

### 1.5 Create Role Switching API (2 hours)

**Create:** `frontend/src/routes/api/demo/switch-role/+server.ts`

**Implementation:**
1. [ ] Verify user is in demo mode
2. [ ] Validate target role
3. [ ] Fetch demo session
4. [ ] Check session not expired
5. [ ] Get target user info
6. [ ] Generate custom token
7. [ ] Update session's currentRole
8. [ ] Return token and user data

**Validation:**
- Must be demo user
- Session must exist
- Session not expired
- Target role must be valid

---

### 1.6 Create Demo Mode Banner Component (3 hours)

**Create:** `frontend/src/lib/components/demo/DemoModeBanner.svelte`

**Features:**
- [ ] Display session time remaining
- [ ] Show current role
- [ ] Role switching buttons (4 roles)
- [ ] End demo button
- [ ] Countdown timer (updates every second)
- [ ] Expiration handling
- [ ] Responsive design

**UI Elements:**
- Purple gradient background
- Role switcher with 4 buttons
- Timer with countdown
- End demo button (red)
- Mobile-responsive layout

**Behavior:**
- Poll session status every 30 seconds
- Update timer every second
- Auto-redirect on expiration
- Confirm before ending demo

---

### 1.7 Integrate Banner into Layout (1 hour)

**Modify:** `frontend/src/routes/+layout.svelte`

**Tasks:**
- [ ] Import DemoModeBanner component
- [ ] Add conditional rendering
- [ ] Add padding to account for fixed banner
- [ ] Test across all pages

**Code:**
```svelte
{#if $page.data.user?.isDemo}
  <DemoModeBanner />
{/if}

<div class:demo-padding={$page.data.user?.isDemo}>
  <slot />
</div>
```

---

### 1.8 Create Demo Landing Page (2 hours)

**Create:** `frontend/src/routes/demo/+page.svelte`

**Features:**
- [ ] Hero section with value prop
- [ ] Scenario selection (4 options)
- [ ] Start demo button
- [ ] Feature highlights
- [ ] Duration notice

**Scenarios:**
1. **First Memorial Service** - Funeral Director
2. **Managing Multiple Services** - Funeral Director
3. **Legacy Celebration** - Owner
4. **Viewer Experience** - Viewer

**Behavior:**
- Select scenario
- Click start demo
- Create session via API
- Auto-login with custom token
- Redirect to appropriate page

---

### 1.9 Create Session Cleanup API (2 hours)

**Create:** `frontend/src/routes/api/demo/end-session/+server.ts`

**Implementation:**
1. [ ] Verify user in demo mode
2. [ ] Get session ID from user
3. [ ] Mark session as 'ended'
4. [ ] Queue cleanup job
5. [ ] Sign out user
6. [ ] Redirect to homepage

**Create:** `frontend/src/routes/api/demo/cleanup/+server.ts` (cron endpoint)

**Cleanup Logic:**
1. [ ] Find expired sessions (status = 'active', expiresAt < now)
2. [ ] For each session:
   - Delete streams (Firestore + Cloudflare)
   - Delete slideshows (Firestore + Firebase Storage)
   - Delete memorials (Firestore)
   - Delete user documents (Firestore)
   - Delete Firebase Auth users
   - Mark session as 'expired'
3. [ ] Log cleanup results

---

### Phase 1 Testing Checklist

- [ ] Session creation works
- [ ] All 4 demo users created correctly
- [ ] Custom tokens work for each role
- [ ] Role switching functions properly
- [ ] Banner displays correctly
- [ ] Timer counts down accurately
- [ ] Session expiration handled
- [ ] Demo landing page works
- [ ] Cleanup job works (manually trigger)
- [ ] No memory leaks from timers
- [ ] Mobile responsive

**Estimated Time:** 20-24 hours  
**Target:** Complete by end of Week 1

---

## Phase 2: Demo Scenarios & Pre-populated Data

**Timeline:** Week 2 (5-7 days)  
**Goal:** Create realistic, curated demo data for each persona

### 2.1 Create Demo Data Templates System (3 hours)

**Create:** `frontend/src/lib/data/demoTemplates.ts`

**Structure:**
```typescript
export interface DemoTemplate {
  scenario: string;
  memorials: MemorialTemplate[];
  streams: StreamTemplate[];
  slideshows: SlideshowTemplate[];
  users: UserTemplate[];
}

export const DEMO_TEMPLATES: Record<string, DemoTemplate> = {
  first_memorial_service: { /* ... */ },
  managing_multiple: { /* ... */ },
  legacy_celebration: { /* ... */ },
  viewer_experience: { /* ... */ }
};
```

**Tasks:**
- [ ] Define template interfaces
- [ ] Create 4 scenario templates
- [ ] Add realistic names and data
- [ ] Include sample photos/videos
- [ ] Add memorial details

---

### 2.2 Implement Data Seeding Functions (4 hours)

**Create:** `frontend/src/lib/server/demoSeeding.ts`

**Functions:**
```typescript
export async function seedMemorial(
  sessionId: string, 
  template: MemorialTemplate, 
  userId: string
): Promise<string>

export async function seedStream(
  sessionId: string,
  memorialId: string, 
  template: StreamTemplate
): Promise<string>

export async function seedSlideshow(
  sessionId: string,
  memorialId: string,
  template: SlideshowTemplate
): Promise<string>
```

**Implementation:**
1. [ ] Create memorial document with demo flags
2. [ ] Upload demo images to Firebase Storage
3. [ ] Create stream with mock Cloudflare data
4. [ ] Create slideshow with sample photos
5. [ ] Tag all entities with `isDemo: true`

---

### 2.3 Update Session Creation to Include Seeding (2 hours)

**Modify:** `frontend/src/routes/api/demo/session/+server.ts`

**Add after user creation:**
```typescript
// Seed demo data based on scenario
const template = DEMO_TEMPLATES[scenario];

if (template) {
  await seedDemoData(sessionId, template, demoUsers);
}
```

**Seeding Logic:**
1. [ ] Get template for scenario
2. [ ] Create memorials
3. [ ] Create streams for memorials
4. [ ] Create slideshows
5. [ ] Set appropriate permissions

---

### 2.4 Create Demo Assets (4 hours)

**Assets Needed:**
- [ ] 20 sample memorial photos (diverse, professional)
- [ ] 4 memorial background images
- [ ] Sample slideshow photos (10 per template)
- [ ] Mock video thumbnails
- [ ] Demo funeral home logos

**Storage:**
- Upload to `demo-assets/` folder in Firebase Storage
- Use public URLs in templates
- Optimize images (WebP format)
- Add watermark "DEMO" if needed

---

### 2.5 Scenario 1: First Memorial Service (2 hours)

**Template:** Empty slate with guidance

**Pre-populated Data:**
- Empty memorials list
- Sample funeral home profile
- Tutorial prompts

**Guided Actions:**
1. Create first memorial
2. Add loved one's information
3. Schedule livestream
4. Upload slideshow
5. Publish memorial

**Entry Point:** Funeral Director portal with empty state

---

### 2.6 Scenario 2: Managing Multiple Services (3 hours)

**Template:** Active funeral home

**Pre-populated Data:**
- 5 memorials in different states:
  - 2 upcoming services
  - 1 live service
  - 2 completed services
- 7 scheduled streams
- 3 slideshows
- Mock analytics data

**Highlights:**
- Dashboard with multiple services
- Stream management panel
- Calendar view
- Analytics overview

**Entry Point:** Funeral Director dashboard

---

### 2.7 Scenario 3: Legacy Celebration (3 hours)

**Template:** Rich memorial page

**Pre-populated Data:**
- Complete memorial for "Robert Johnson"
- Beautiful slideshow (15 photos)
- 12 condolence messages
- 1 completed stream recording
- Memorial guestbook entries

**Highlights:**
- Photo slideshow
- Condolence wall
- Stream recording playback
- Memorial customization options

**Entry Point:** Owner profile with memorial

---

### 2.8 Scenario 4: Viewer Experience (2 hours)

**Template:** Public memorial view

**Pre-populated Data:**
- Public memorial page
- Live stream in progress (mock)
- Active chat/condolences
- Photo slideshow playing
- Service information

**Highlights:**
- Stream viewing
- Leave condolence
- View photos
- Share memorial

**Entry Point:** Public memorial page

---

### 2.9 Create Demo Asset Loader (2 hours)

**Create:** `frontend/src/lib/components/demo/DemoAssetLoader.svelte`

**Purpose:** Show loading state while seeding data

**Features:**
- [ ] Progress indicator
- [ ] Current step display
- [ ] Estimated time remaining
- [ ] Fun loading messages

**Messages:**
- "Creating realistic memorial data..."
- "Uploading sample photos..."
- "Setting up livestreams..."
- "Almost ready..."

---

### Phase 2 Testing Checklist

- [ ] All 4 scenarios seed correctly
- [ ] Demo assets load properly
- [ ] Images display correctly
- [ ] Mock streams show proper UI
- [ ] Slideshows work in demo mode
- [ ] Data tagged correctly
- [ ] Realistic names and details
- [ ] No production data pollution
- [ ] Fast seeding (< 10 seconds)
- [ ] Error handling works

**Estimated Time:** 25-30 hours  
**Target:** Complete by end of Week 2

---

## Phase 3: Guided Experience & Tours

**Timeline:** Week 3 (5-7 days)  
**Goal:** Add interactive tours, tooltips, and onboarding checklists

### 3.1 Install Tour Libraries (30 mins)

**Install:**
```bash
npm install driver.js shepherd.js
npm install -D @types/shepherd.js
```

**Tasks:**
- [ ] Install packages
- [ ] Create TypeScript declarations if needed
- [ ] Test basic import

---

### 3.2 Create Tour Configuration System (3 hours)

**Create:** `frontend/src/lib/tours/tourConfig.ts`

**Structure:**
```typescript
export interface TourStep {
  element: string; // CSS selector
  popover: {
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
  action?: () => void;
}

export interface Tour {
  id: string;
  name: string;
  steps: TourStep[];
  trigger: 'onload' | 'manual' | 'event';
}

export const TOURS: Record<string, Tour> = {
  funeral_director_quickstart: { /* ... */ },
  memorial_creation: { /* ... */ },
  stream_setup: { /* ... */ },
  slideshow_creation: { /* ... */ }
};
```

---

### 3.3 Create Tour Manager Component (4 hours)

**Create:** `frontend/src/lib/components/demo/TourManager.svelte`

**Features:**
- [ ] Initialize Shepherd.js
- [ ] Load tour based on page/scenario
- [ ] Track tour progress
- [ ] Skip/restart tour
- [ ] Save completion state

**API:**
```typescript
export function startTour(tourId: string): void
export function skipTour(): void
export function restartTour(): void
export function nextStep(): void
export function previousStep(): void
```

---

### 3.4 Create Tooltip Component (2 hours)

**Create:** `frontend/src/lib/components/demo/DemoTooltip.svelte`

**Features:**
- [ ] Contextual hints
- [ ] Auto-show on first visit
- [ ] Dismissible
- [ ] Positioning logic
- [ ] Arrow pointer

**Usage:**
```svelte
<DemoTooltip 
  target="#create-memorial-btn" 
  content="Click here to create your first memorial"
  position="bottom"
  showOnce={true}
/>
```

---

### 3.5 Create Onboarding Checklist (3 hours)

**Create:** `frontend/src/lib/components/demo/OnboardingChecklist.svelte`

**Features:**
- [ ] Role-specific checklists
- [ ] Progress tracking
- [ ] Checkmark animations
- [ ] Expandable/collapsible
- [ ] Persistent state

**Checklist Items (Funeral Director):**
- [ ] Create your first memorial
- [ ] Schedule a livestream
- [ ] Upload a slideshow
- [ ] Customize memorial page
- [ ] View analytics

**UI:**
- Floating widget (bottom right)
- Progress bar at top
- Completion celebration

---

### 3.6 Implement Funeral Director Tour (3 hours)

**Tour:** "Quick Start for Funeral Directors"

**Steps:**
1. Welcome message
2. Dashboard overview
3. Create memorial button
4. Stream management
5. Analytics panel
6. Settings

**Implementation:**
- [ ] Define tour steps in config
- [ ] Add tour trigger on page load
- [ ] Add skip option
- [ ] Track completion

---

### 3.7 Implement Memorial Creation Tour (2 hours)

**Tour:** "Creating Your First Memorial"

**Steps:**
1. Memorial form overview
2. Required fields
3. Photo upload
4. Privacy settings
5. Save and publish

**Features:**
- [ ] Highlight form fields
- [ ] Explain each section
- [ ] Show best practices
- [ ] Next button navigation

---

### 3.8 Implement Stream Setup Tour (2 hours)

**Tour:** "Setting Up Your Livestream"

**Steps:**
1. Stream manager introduction
2. Create stream button
3. RTMP credentials
4. OBS setup guide
5. Test stream
6. Go live

---

### 3.9 Add Success Celebrations (2 hours)

**Create:** `frontend/src/lib/components/demo/SuccessCelebration.svelte`

**Triggers:**
- First memorial created
- First stream scheduled
- Slideshow completed
- 5 actions completed

**Animations:**
- Confetti effect
- Success modal
- Progress milestone
- Badge unlock

**Library:** Use `canvas-confetti` for effects

```bash
npm install canvas-confetti
```

---

### 3.10 Create Interactive Hints System (2 hours)

**Create:** `frontend/src/lib/components/demo/InteractiveHint.svelte`

**Features:**
- [ ] Pulse animation on clickable elements
- [ ] Inline help text
- [ ] Contextual tips
- [ ] Keyboard shortcuts display

**Examples:**
- Pulse on "Create Memorial" button
- "💡 Pro Tip" callouts
- Keyboard shortcut hints
- Feature discovery prompts

---

### 3.11 Add Tour Restart Button (1 hour)

**Add to Demo Banner:**
- [ ] "Restart Tour" button
- [ ] Tour selection dropdown
- [ ] Progress indicator

**Behavior:**
- Shows list of available tours
- Restarts selected tour
- Clears completion state

---

### Phase 3 Testing Checklist

- [ ] Tours start automatically
- [ ] All steps navigate correctly
- [ ] Skip tour works
- [ ] Restart tour works
- [ ] Tooltips position correctly
- [ ] Checklist tracks progress
- [ ] Celebrations trigger properly
- [ ] Interactive hints show
- [ ] Mobile responsive
- [ ] No performance issues
- [ ] Tours don't interfere with usage

**Estimated Time:** 24-28 hours  
**Target:** Complete by end of Week 3

---

## Testing Strategy

### Unit Tests

**Create:** `frontend/src/tests/demo/`

**Test Files:**
- `session.test.ts` - Session creation/management
- `roleSwitch.test.ts` - Role switching
- `cleanup.test.ts` - Data cleanup
- `seeding.test.ts` - Demo data seeding
- `tours.test.ts` - Tour functionality

**Coverage Target:** 80%+

---

### Integration Tests

**Test Scenarios:**
1. **Complete Demo Flow**
   - Start demo
   - Switch roles
   - Create data
   - End demo
   - Verify cleanup

2. **Session Expiration**
   - Create session
   - Wait for expiration
   - Verify auto-cleanup
   - Check user logged out

3. **Multi-Role Experience**
   - Switch between all 4 roles
   - Verify data visibility
   - Check permissions
   - Ensure data consistency

---

### E2E Tests (Playwright)

**Create:** `frontend/e2e/demo/`

**Test Files:**
- `demo-session.spec.ts`
- `role-switching.spec.ts`
- `guided-tours.spec.ts`
- `demo-cleanup.spec.ts`

**Key Tests:**
```typescript
test('can start demo and switch roles', async ({ page }) => {
  await page.goto('/demo');
  await page.click('button:has-text("Start Free Demo")');
  await expect(page.locator('.demo-banner')).toBeVisible();
  await page.click('button:has-text("Admin")');
  await expect(page).toHaveURL(/.*admin.*/);
});
```

---

### Manual Testing Checklist

**Session Management:**
- [ ] Create demo session as admin
- [ ] Verify 4 users created
- [ ] Check custom tokens work
- [ ] Test session expiration

**Role Switching:**
- [ ] Switch to each role
- [ ] Verify UI changes
- [ ] Check permissions
- [ ] Test data visibility

**Demo Data:**
- [ ] All scenarios load correctly
- [ ] Images display properly
- [ ] Streams show correctly
- [ ] Slideshows work

**Guided Tours:**
- [ ] Tours start automatically
- [ ] All steps work
- [ ] Skip/restart works
- [ ] Completion tracked

**Cleanup:**
- [ ] Manual cleanup works
- [ ] Auto cleanup triggers
- [ ] All data deleted
- [ ] No orphaned data

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] No console errors
- [ ] TypeScript compiles
- [ ] Build succeeds
- [ ] Demo assets uploaded
- [ ] Firestore indexes created
- [ ] Security rules updated
- [ ] Environment variables set

### Firestore Security Rules

**Add to `firestore.rules`:**
```javascript
// Demo sessions collection
match /demoSessions/{sessionId} {
  allow read: if request.auth != null;
  allow write: if request.auth.token.role == 'admin';
}

// Demo data access
function isDemo() {
  return resource.data.isDemo == true;
}

function isDemoUser() {
  return request.auth.token.isDemo == true;
}

function sameSession() {
  return resource.data.demoSessionId == request.auth.token.demoSessionId;
}

// Demo memorials
match /memorials/{memorialId} {
  allow read: if isDemo() && isDemoUser() && sameSession();
  allow write: if isDemo() && isDemoUser() && sameSession();
}
```

---

### Environment Variables

**Add to `.env`:**
```
DEMO_SESSION_DURATION=2
DEMO_MAX_SESSIONS_PER_DAY=10
DEMO_CLEANUP_INTERVAL=15
```

---

### Deployment Steps

1. [ ] Deploy Firestore security rules
2. [ ] Upload demo assets to Firebase Storage
3. [ ] Deploy frontend to Vercel
4. [ ] Verify demo landing page accessible
5. [ ] Test session creation
6. [ ] Test role switching
7. [ ] Test cleanup (manual trigger)
8. [ ] Set up cleanup cron job
9. [ ] Monitor error logs
10. [ ] Update documentation

---

### Post-Deployment

**Monitoring:**
- [ ] Watch error logs
- [ ] Track demo session usage
- [ ] Monitor conversion rates
- [ ] Check cleanup success rate
- [ ] Review user feedback

**Crazy Egg Tracking:**
- [ ] Verify heatmaps on demo pages
- [ ] Check session recordings
- [ ] Track conversion funnels
- [ ] Monitor feature engagement

---

### Cron Job Setup (Vercel)

**Create:** `vercel.json`
```json
{
  "crons": [{
    "path": "/api/demo/cleanup",
    "schedule": "*/15 * * * *"
  }]
}
```

**Or use:** GitHub Actions for cleanup job

---

## Success Metrics

**Track Weekly:**
- Demo sessions started
- Average session duration
- Role switches per session
- Features used in demo
- Conversion rate (demo → signup)
- Tour completion rate
- Session expiration vs manual end

**Goals:**
- 50+ demo sessions per week
- 60%+ tour completion rate
- 20%+ demo-to-signup conversion
- < 5% cleanup failures

---

## Next Steps (Phase 4+)

**After initial 3 phases complete:**

1. **Conversion Optimization** (Week 4)
   - Strategic CTA placement
   - Demo-to-production migration
   - Upgrade prompts

2. **Sales Mode** (Week 5)
   - Sales portal
   - Demo link generation
   - Prospect tracking

3. **Advanced Features** (Week 6+)
   - AI suggestions
   - Voice-guided setup
   - Multi-language support
   - White-label demos

---

## Support & Documentation

**Create documentation:**
- [ ] Developer setup guide
- [ ] API documentation
- [ ] Tour configuration guide
- [ ] Troubleshooting guide
- [ ] Demo data template guide

**Links:**
- GitHub Issues for bugs
- Slack channel for questions
- Wiki for documentation

---

**Document Version:** 1.0  
**Last Updated:** October 30, 2025  
**Owner:** Tributestream Development Team  
**Review Date:** After Phase 1 completion
