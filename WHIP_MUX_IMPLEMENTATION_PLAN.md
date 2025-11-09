# WHIP + Mux Implementation Plan (Step-by-Step)

## Phase 1: Data Model & Types

### 1.1 Create New Stream Type
**File**: `frontend/src/lib/types/stream-v2.ts`

```typescript
export interface LiveStream {
  id: string;
  memorialId: string;
  title: string;
  description?: string;
  
  // Status & Visibility
  status: 'ready' | 'live' | 'completed' | 'error';
  visibility: 'public' | 'hidden' | 'archived';
  
  // Cloudflare
  cloudflare: {
    liveInputId: string;
    whipUrl: string;
    whepUrl?: string;
  };
  
  // Mux (Source of Truth)
  mux: {
    liveStreamId: string;
    streamKey: string;
    playbackId?: string;
    assetId?: string;
  };
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
}

export interface CreateLiveSessionRequest {
  memorialId: string;
  title: string;
  description?: string;
}

export interface CreateLiveSessionResponse {
  success: true;
  stream: LiveStream;
  whipUrl: string;
}
```

### 1.2 Firestore Collection Structure
- **Collection**: `live_streams` (new, separate from old `streams`)
- **Document fields**: Match `LiveStream` interface above

---

## Phase 2: Backend API Endpoints

### 2.1 Create Live Session API
**File**: `frontend/src/routes/api/live-streams/create/+server.ts`

**Endpoint**: `POST /api/live-streams/create`

**Auth**: Require `admin` or `funeral_director` role

**Steps**:
1. Validate user role
2. Validate memorial exists and user has permission
3. Call Mux API to create live stream
4. Call Cloudflare API to create Live Input (with recording)
5. Call Cloudflare API to add Live Output → Mux
6. Save to Firestore `live_streams` collection
7. Return `{ whipUrl, stream }`

**Dependencies**:
- Mux Node SDK: `npm install @mux/mux-node`
- Cloudflare API client (use fetch)

### 2.2 Stop Stream API
**File**: `frontend/src/routes/api/live-streams/[id]/stop/+server.ts`

**Endpoint**: `POST /api/live-streams/:id/stop`

**Steps**:
1. Update Firestore: `status = 'completed'`, `endedAt = now()`
2. Optionally disable Cloudflare Live Output
3. Return success

### 2.3 Update Visibility API
**File**: `frontend/src/routes/api/live-streams/[id]/visibility/+server.ts`

**Endpoint**: `POST /api/live-streams/:id/visibility`

**Body**: `{ visibility: 'public' | 'hidden' | 'archived' }`

**Steps**:
1. Validate role
2. Update Firestore document
3. Return success

### 2.4 Get Streams for Memorial
**File**: `frontend/src/routes/api/live-streams/memorial/[memorialId]/+server.ts`

**Endpoint**: `GET /api/live-streams/memorial/:memorialId`

**Steps**:
1. Query Firestore: `live_streams` where `memorialId == :memorialId`
2. Filter by visibility based on user role
3. Return streams array

### 2.5 Mux Webhook Handler
**File**: `frontend/src/routes/api/webhooks/mux/+server.ts`

**Endpoint**: `POST /api/webhooks/mux`

**Events to Handle**:
- `video.live_stream.connected` → Update `status = 'live'`, `startedAt`
- `video.live_stream.disconnected` → Update `status = 'completed'`
- `video.asset.ready` → Update `mux.assetId`, `mux.playbackId`

**Steps**:
1. Verify Mux webhook signature
2. Parse event type
3. Find stream by `mux.liveStreamId`
4. Update Firestore accordingly

---

## Phase 3: Server-Side Utilities

### 3.1 Cloudflare Client
**File**: `frontend/src/lib/server/cloudflare-stream.ts`

```typescript
export async function createLiveInput(name: string) {
  // POST to Cloudflare API
  // Return { liveInputId, whipUrl, whepUrl }
}

export async function createLiveOutput(liveInputId: string, muxUrl: string, muxKey: string) {
  // POST to Cloudflare API
  // Return outputId
}
```

### 3.2 Mux Client
**File**: `frontend/src/lib/server/mux-client.ts`

```typescript
import Mux from '@mux/mux-node';

export async function createMuxLiveStream(name: string) {
  // Create Mux live stream with recording enabled
  // Return { liveStreamId, streamKey, playbackId }
}
```

### 3.3 Environment Variables
Add to `.env`:
```
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_STREAM_API_TOKEN=xxx
MUX_TOKEN_ID=xxx
MUX_TOKEN_SECRET=xxx
MUX_WEBHOOK_SECRET=xxx
```

---

## Phase 4: Frontend - Stream Management Page

### 4.1 Server Load Function
**File**: `frontend/src/routes/memorials/[id]/streams/+page.server.ts`

```typescript
export const load = async ({ params, locals, fetch }) => {
  // Fetch streams for this memorial
  const response = await fetch(`/api/live-streams/memorial/${params.id}`);
  const streams = await response.json();
  
  // Get memorial details
  // Check user permissions
  
  return {
    memorial,
    streams,
    canManage: isAdminOrFD
  };
};
```

### 4.2 Main Page Component
**File**: `frontend/src/routes/memorials/[id]/streams/+page.svelte`

**Layout**:
- Page header with "Create Stream" button (if `canManage`)
- List of stream cards (one per stream)
- Each card shows: title, status badge, actions

**Components to create**:
- `CreateStreamModal.svelte` - Form to create new session
- `StreamCard.svelte` - Individual stream display
- `StreamPublisher.svelte` - WHIP publisher interface
- `StreamViewer.svelte` - Mux player for viewers

### 4.3 Create Stream Modal
**File**: `frontend/src/lib/components/streaming/CreateStreamModal.svelte`

**Flow**:
1. User clicks "Create Stream"
2. Modal opens with title/description inputs
3. On submit:
   - `POST /api/live-streams/create`
   - Receive `whipUrl` and stream data
   - Navigate to publisher page or show WHIP URL

### 4.4 Stream Card Component
**File**: `frontend/src/lib/components/streaming/StreamCard.svelte`

**Props**: `{ stream: LiveStream, canManage: boolean }`

**Display**:
- Title and description
- Status badge (Ready/Live/Completed)
- Visibility indicator
- Action buttons:
  - "Go Live" → Navigate to publisher
  - "Stop Stream" → Call stop API
  - "Hide" → Toggle visibility
  - "Archive" → Set archived

### 4.5 WHIP Publisher Page
**File**: `frontend/src/routes/memorials/[id]/streams/[streamId]/publish/+page.svelte`

**Requirements**:
- Camera/mic permission prompt
- Preview of local video
- "Start Broadcasting" button
- Uses WHIP client library to connect to `whipUrl`
- Shows live indicator when connected
- "Stop" button to end session

**WHIP Client**:
- Use Cloudflare's WHIPClient.js or similar
- Alternatively: `@eyevinn/whip-web-client` npm package

### 4.6 Stream Viewer Component
**File**: `frontend/src/lib/components/streaming/StreamViewer.svelte`

**Props**: `{ playbackId: string }`

**Implementation**:
- Use Mux Player: `<mux-player playback-id="${playbackId}"></mux-player>`
- Add Mux player script: `@mux/mux-player`

---

## Phase 5: Implementation Order

### Step 1: Setup & Dependencies
- [ ] Install packages: `@mux/mux-node`, `@mux/mux-player`
- [ ] Add environment variables
- [ ] Create `stream-v2.ts` type definitions

### Step 2: Server Utilities
- [ ] Create `cloudflare-stream.ts` client
- [ ] Create `mux-client.ts` client
- [ ] Test API calls manually

### Step 3: Backend APIs (in order)
- [ ] `POST /api/live-streams/create` - Create session
- [ ] `GET /api/live-streams/memorial/:id` - List streams
- [ ] `POST /api/live-streams/:id/stop` - Stop stream
- [ ] `POST /api/live-streams/:id/visibility` - Update visibility
- [ ] `POST /api/webhooks/mux` - Handle webhooks

### Step 4: Frontend Components
- [ ] Update `+page.server.ts` to load streams
- [ ] Create `StreamCard.svelte`
- [ ] Create `CreateStreamModal.svelte`
- [ ] Update `+page.svelte` to show cards and modal

### Step 5: Publisher & Viewer
- [ ] Create publisher page with WHIP client
- [ ] Create viewer component with Mux player
- [ ] Test end-to-end flow

### Step 6: Testing & Polish
- [ ] Test with Mux/Cloudflare sandbox accounts
- [ ] Verify webhook handling
- [ ] Add error states and loading indicators
- [ ] Mobile browser testing

---

## Phase 6: Testing Checklist

- [ ] Admin can create stream
- [ ] Funeral director can create stream
- [ ] Owner cannot create stream
- [ ] WHIP publisher works in mobile browser
- [ ] Cloudflare → Mux simulcast works
- [ ] Stream shows as "live" when active
- [ ] Stop button ends stream
- [ ] Mux webhook updates stream with asset
- [ ] Visibility toggle works (hide/archive)
- [ ] Viewers can watch Mux playback
- [ ] VOD available after stream ends

---

## Phase 7: Migration Notes

### Old vs New
- **Old**: `streams` collection (complex, unused)
- **New**: `live_streams` collection (clean, Mux-first)
- Keep old APIs for backward compatibility (if needed)
- New page uses only new APIs

### Rollout Strategy
1. Build new system alongside old
2. Test with single memorial
3. Migrate admins/FDs to new flow
4. Deprecate old stream management (future)

---

## Key Files Summary

### New Files to Create
```
frontend/src/lib/types/stream-v2.ts
frontend/src/lib/server/cloudflare-stream.ts
frontend/src/lib/server/mux-client.ts
frontend/src/lib/components/streaming/CreateStreamModal.svelte
frontend/src/lib/components/streaming/StreamCard.svelte
frontend/src/lib/components/streaming/StreamViewer.svelte
frontend/src/routes/api/live-streams/create/+server.ts
frontend/src/routes/api/live-streams/memorial/[memorialId]/+server.ts
frontend/src/routes/api/live-streams/[id]/stop/+server.ts
frontend/src/routes/api/live-streams/[id]/visibility/+server.ts
frontend/src/routes/api/webhooks/mux/+server.ts
frontend/src/routes/memorials/[id]/streams/[streamId]/publish/+page.svelte
```

### Files to Modify
```
frontend/src/routes/memorials/[id]/streams/+page.svelte (currently empty)
frontend/src/routes/memorials/[id]/streams/+page.server.ts (currently empty)
```

---

## Next Actions
1. Review and approve this plan
2. Set up Mux and Cloudflare sandbox accounts
3. Begin Phase 1 (types and data model)
4. Scaffold API endpoints
5. Build UI components
