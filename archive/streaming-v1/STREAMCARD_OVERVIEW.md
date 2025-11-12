# StreamCard System - Overview & Architecture

**Document Version:** 1.0  
**Last Updated:** October 29, 2025  
**Part 1 of 4** - [Interfaces](./STREAMCARD_INTERFACES.md) | [Components](./STREAMCARD_COMPONENTS.md) | [APIs](./STREAMCARD_APIS.md)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Key Features](#key-features)
3. [High-Level Architecture](#high-level-architecture)
4. [Component Hierarchy](#component-hierarchy)
5. [Technology Stack](#technology-stack)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Stream Lifecycle](#stream-lifecycle)

---

## System Overview

The **StreamCard** component system is the core UI infrastructure for managing livestreams in Tributestream's memorial service platform. It provides comprehensive stream management capabilities including:

- **RTMP Streaming** - Traditional streaming with OBS/external software
- **Browser Streaming** - WebRTC/WHIP streaming directly from browser
- **Recording Management** - Automatic detection and playback of recordings
- **Real-Time Status** - Live indicators with 10-second polling
- **Calculator Integration** - Bidirectional sync with service scheduling

### Primary Use Cases

1. **Funeral Directors** - Create and manage memorial livestreams
2. **Memorial Owners** - View streams created via service calculator
3. **Admins** - Full stream management and monitoring capabilities

### Component Locations

```
frontend/src/lib/ui/stream/
├── StreamCard.svelte          # Main active/scheduled stream card
├── StreamHeader.svelte         # Title, status, badges
├── StreamCredentials.svelte    # RTMP credentials, embed URLs
├── StreamActions.svelte        # Action buttons row

frontend/src/lib/components/
├── CompletedStreamCard.svelte  # Completed streams with recordings
├── BrowserStreamer.svelte      # WebRTC browser streaming UI
```

---

## Key Features

### ✅ Core Functionality

- **Multi-Protocol Streaming**
  - RTMP for external software (OBS, Streamlabs)
  - WHIP/WebRTC for browser-based streaming
  - HLS playback for viewers

- **Real-Time Management**
  - 10-second polling for live status updates
  - Automatic stream state detection
  - Viewer count tracking

- **Recording System**
  - Automatic recording detection after stream ends
  - 30-second delay before checking recordings
  - Cloudflare Stream integration for recordings

- **Calculator Integration**
  - Auto-stream creation from service scheduling
  - Bidirectional sync (stream ↔ calculator)
  - Change detection via service hashing

- **Access Control**
  - Role-based permissions (admin, funeral_director, owner)
  - Memorial ownership verification
  - Stream visibility controls (public/hidden)

### 🎨 User Experience

- **Professional UI** - Tributestream Minimal Modern design system
- **Responsive Design** - Mobile-optimized layouts
- **Real-Time Feedback** - Loading states, success/error messages
- **Copy Functions** - One-click copy for credentials
- **Visual Indicators** - Animated live badges, status colors

---

## High-Level Architecture

### System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Stream Manager Page                         │
│                  (/memorials/[id]/streams)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ├─── 10s Polling Loop
                             │    ├─ POST /api/streams/check-live-status
                             │    └─ GET /api/streams/[id]/recordings
                             │
                             ├─── Stream Creation
                             │    └─ POST /api/memorials/[id]/streams
                             │
                             └─── Stream Cards Grid
                                  ├─ StreamCard (active/scheduled)
                                  │  ├─ StreamHeader
                                  │  ├─ StreamCredentials
                                  │  ├─ StreamActions
                                  │  └─ BrowserStreamer (conditional)
                                  │
                                  └─ CompletedStreamCard (recordings)
                                     ├─ Video Player (Cloudflare iframe)
                                     ├─ Recording Metadata
                                     └─ Management Actions
```

### Data Flow

```
┌─────────────────┐
│   Calculator    │ ──[creates]──> ┌──────────────┐
│  (Schedule)     │                │   Stream     │
└─────────────────┘                │  (Firestore) │
                                   └──────┬───────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
            ┌───────────────┐     ┌──────────────┐    ┌──────────────┐
            │  Cloudflare   │     │  StreamCard  │    │   Polling    │
            │  Live Input   │     │     UI       │    │   System     │
            └───────────────┘     └──────────────┘    └──────────────┘
                    │                     │                     │
                    │                     │                     │
                    ▼                     ▼                     ▼
            ┌───────────────┐     ┌──────────────┐    ┌──────────────┐
            │  RTMP/WHIP    │     │   Actions    │    │ Live Status  │
            │   Stream      │     │  (Visibility,│    │  Updates     │
            │              │     │   Delete)    │    │              │
            └───────────────┘     └──────────────┘    └──────────────┘
```

---

## Component Hierarchy

### Visual Structure

```
┌───────────────────────────────────────────────────────────────┐
│ StreamCard (Card wrapper)                                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ StreamHeader                                             │  │
│  │  • Live indicator (animated)                             │  │
│  │  • Stream title                                          │  │
│  │  • Status badge (live/ready/scheduled/completed)         │  │
│  │  • Calculator badge (if auto-generated)                  │  │
│  │  • Metadata (scheduled time, viewer count)               │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ StreamCredentials                                        │  │
│  │  • RTMP URL (readonly input + copy button)              │  │
│  │  • Stream Key (password masked + copy button)           │  │
│  │  • Embed URL (auto-fetch when live + copy button)       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ StreamActions                                            │  │
│  │  [📹 Browser Stream] [👁️ Visibility] [⚙️ Settings] [🗑️]  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ BrowserStreamer (conditional - when toggled)             │  │
│  │  • Permission request UI                                 │  │
│  │  • Video preview                                         │  │
│  │  • Camera/Mic controls                                   │  │
│  │  • Start/Stop streaming                                  │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### Component Dependencies

```
StreamCard.svelte
├── Imports
│   ├── Card (design system)
│   ├── StreamHeader
│   ├── StreamCredentials
│   ├── StreamActions
│   └── BrowserStreamer
│
├── Props
│   ├── stream: Stream
│   ├── onToggleVisibility: (streamId, visibility) => Promise<void>
│   ├── onDelete: (streamId) => Promise<void>
│   ├── onCopy: (text, type, streamId) => Promise<void>
│   ├── copiedStreamKey: string | null
│   └── copiedRtmpUrl: string | null
│
└── State
    └── showBrowserStreamer: boolean
```

---

## Technology Stack

### Frontend Technologies

- **Framework**: SvelteKit (Svelte 5 with runes)
- **Language**: TypeScript
- **Styling**: Tributestream Minimal Modern Design System
- **Icons**: Lucide Svelte
- **WebRTC**: Native Browser APIs + Cloudflare WHIP

### Backend Technologies

- **Runtime**: Node.js
- **Framework**: SvelteKit Server
- **Database**: Firebase Firestore
- **Streaming**: Cloudflare Stream API
- **Authentication**: Firebase Auth with custom claims

### External Services

- **Cloudflare Stream**
  - Live Input creation (RTMP/WHIP)
  - Recording processing
  - HLS/DASH playback
  - Embed code generation

- **Firebase**
  - Firestore (stream data storage)
  - Authentication (user management)
  - Admin SDK (server-side operations)

---

## User Roles & Permissions

### Role Definitions

#### 1. Admin (`role: 'admin'`)
**Full Access**
- Create/edit/delete all streams
- View all streams (public & private)
- Access all memorials
- Manage stream visibility
- Access debug features

#### 2. Funeral Director (`role: 'funeral_director'`)
**Professional Access**
- Create streams manually
- Edit streams for assigned memorials
- Delete own streams
- Toggle stream visibility
- Access browser streaming
- View credentials

#### 3. Memorial Owner (`role: 'owner'`)
**Limited Access**
- View streams for owned memorials
- Cannot manually create streams (auto-created via calculator)
- Cannot delete streams
- Cannot edit credentials
- Can request stream changes through calculator

### Permission Checking Logic

```typescript
// Server-side permission check (in API endpoints)
const hasPermission = 
  locals.user.role === 'admin' ||
  memorial.ownerUid === userId ||
  memorial.funeralDirectorUid === userId;

if (!hasPermission) {
  throw SvelteKitError(403, 'Permission denied');
}
```

### UI Feature Visibility

```typescript
// Client-side UI rendering
{#if canManageStream}
  <StreamActions 
    {stream} 
    {onToggleVisibility} 
    {onDelete}
  />
{/if}

// canManageStream determined by:
// - User role (admin, funeral_director)
// - Memorial ownership
// - Funeral director assignment
```

---

## Stream Lifecycle

### State Diagram

```
        [CREATE]
           │
           ▼
    ┌─────────────┐
    │  scheduled  │ ◄──── Future scheduled stream
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │    ready    │ ◄──── Available to stream
    └──────┬──────┘
           │
           │ [Stream Connected]
           ▼
    ┌─────────────┐
    │    live     │ ◄──── Currently broadcasting
    └──────┬──────┘       • Polling detects: liveInput.status.current.state === 'connected'
           │              • WHIP streams auto-hidden (isVisible: false)
           │              • RTMP streams stay visible (isVisible: true)
           │
           │ [Stream Disconnected]
           ▼
    ┌─────────────┐
    │  completed  │ ◄──── Stream ended
    └──────┬──────┘       • recordingReady: false (initially)
           │              • 30-second delay before checking recordings
           │
           │ [Recording Processed]
           ▼
    ┌─────────────┐
    │  completed  │ ◄──── Recording ready
    └─────────────┘       • recordingReady: true
                          • recordingPlaybackUrl populated
                          • CompletedStreamCard displays video player
```

### Lifecycle Events

#### 1. Stream Creation
**Trigger:** POST `/api/memorials/[memorialId]/streams`
```typescript
{
  title: string,
  description?: string,
  scheduledStartTime?: string,
  calculatorServiceType?: 'main' | 'location' | 'day',
  calculatorServiceIndex?: number
}
```
**Result:**
- Cloudflare Live Input created
- RTMP credentials generated
- Stream document created in Firestore
- Status: `scheduled` or `ready`

#### 2. Going Live
**Trigger:** Polling detects `liveInput.status.current.state === 'connected'`
```typescript
// Automatic update
{
  status: 'live',
  startedAt: new Date().toISOString(),
  isVisible: stream.whipEnabled ? false : true  // Hide WHIP, show RTMP
}
```

#### 3. Stream Completion
**Trigger:** Polling detects disconnection
```typescript
// Automatic update
{
  status: 'completed',
  endedAt: new Date().toISOString(),
  recordingReady: false
}

// Then after 30 seconds:
// GET /api/streams/[streamId]/recordings
```

#### 4. Recording Ready
**Trigger:** Recording check finds ready recordings
```typescript
// Automatic update
{
  recordingReady: true,
  cloudflareStreamId: recording.uid,
  recordingPlaybackUrl: recording.playback.hls,
  recordingDuration: recording.duration,
  recordingSize: recording.size,
  recordingProcessedAt: new Date().toISOString()
}
```

---

## Integration Points

### 1. Calculator Integration
**Bidirectional Sync**
- Calculator creates streams with service metadata
- Stream updates sync back to calculator
- Service hash detects changes
- Prevents orphaned streams

**Fields Used:**
```typescript
{
  calculatorServiceType: 'main' | 'location' | 'day',
  calculatorServiceIndex: number | null,
  serviceHash: string,  // MD5 hash of service data
  lastSyncedAt: string,
  syncStatus: 'synced' | 'outdated' | 'orphaned'
}
```

### 2. Memorial Page Integration
- Streams loaded in `[fullSlug]/+page.server.ts`
- Public streams visible to all
- Private streams require authentication
- Embedded player for live/recorded streams

### 3. Polling System
**Located:** Stream Manager Page
**Interval:** 10 seconds
**Endpoints:**
- POST `/api/streams/check-live-status` (batch status check)
- GET `/api/streams/[streamId]/recordings` (recording detection)

---

## Performance Considerations

### Optimization Features

✅ **Efficient Polling**
- Batch status checks for multiple streams
- Only updates database when status changes
- Background updates without UI blocking

✅ **Conditional Rendering**
- BrowserStreamer only rendered when toggled
- CompletedStreamCard for finished streams
- Lazy loading of embed URLs

✅ **Smart Caching**
- Embed URLs cached after first fetch
- Copy states managed locally
- Minimal API calls through change detection

### Areas for Improvement

⚠️ **WebSocket Integration** - Replace polling with real-time updates
⚠️ **Stream Batching** - Bulk operations for multiple streams
⚠️ **Client-Side Caching** - Reduce redundant API calls

---

## Next Steps

Continue to detailed documentation:

📄 **[Part 2: Data Models & Interfaces →](./STREAMCARD_INTERFACES.md)**  
📄 **[Part 3: Component Details →](./STREAMCARD_COMPONENTS.md)**  
📄 **[Part 4: API Endpoints →](./STREAMCARD_APIS.md)**

---

**Related Documentation:**
- [Stream Type Interface](./frontend/src/lib/types/stream.ts)
- [Stream Manager Page](./frontend/src/routes/memorials/[id]/streams/+page.svelte)
- [Cloudflare Stream Integration](./frontend/src/lib/server/cloudflare-stream.ts)
