# Stream Arming System - Implementation Plan

## Overview
Add stream "arming" functionality to prepare streams for different types of live broadcasting methods. This allows admins to configure how a stream will be broadcast before going live.

---

## UI Changes

### StreamCard Component (Admin View Only)

**New Controls to Add:**
- **Dropdown menu** with three options:
  - Arm Mobile Input
  - Arm Mobile Streaming
  - Arm Stream Key
- **"Arm" button** next to the dropdown
- **Edit Start Time** capability (should work regardless of armed status)

**Display Changes:**
- Show "Armed" badge when stream is armed
- Display which arm type is active (Mobile Input / Mobile Streaming / Stream Key)
- Show appropriate credentials/instructions based on arm type

---

## Arm Types & Behavior

### 1. Arm Mobile Input
**Purpose:** Browser-based WHIP streaming

**What It Does:**
- Prepares stream manager to use WHIP (WebRTC-HTTP Ingestion Protocol)
- Displays WHIP URL for browser-based streaming
- User can stream directly from browser (camera/microphone)

**Stream Manager Sees:**
- WHIP URL
- Instructions to use browser streaming
- "Go Live" button that opens browser streaming interface

---

### 2. Arm Mobile Streaming
**Purpose:** Enhanced mobile streaming with WHIP + additional features

**What It Does:**
- Uses WHIP as base protocol
- **Additional functionality to be defined:**
  - Mobile-optimized streaming settings?
  - Special mobile app integration?
  - Enhanced mobile features?

**Stream Manager Sees:**
- WHIP URL
- Mobile-specific instructions
- Additional mobile streaming controls (TBD)

---

### 3. Arm Stream Key
**Purpose:** Traditional OBS/encoder streaming via RTMP

**What It Does:**
- Generates RTMP credentials for external streaming software
- Stream goes live on memorial page when OBS connects
- Integrates with existing scheduled stream display

**Stream Manager Sees:**
- **RTMP URL** (e.g., `rtmp://live.cloudflare.com/live/`)
- **Stream Key** (unique per stream)
- Instructions for OBS setup

**Technical Flow:**
1. Admin arms stream with "Stream Key" option
2. System generates/retrieves RTMP credentials
3. Stream manager copies credentials into OBS
4. User starts streaming in OBS
5. **Stream status updates from 'scheduled' → 'live'**
6. **Memorial page automatically switches from countdown to live player**
7. Viewers can watch the live stream

---

## Memorial Page Integration

### Existing Components (Already Working)
- **CountdownVideoPlayer.svelte** - Shows countdown before stream
- **MemorialStreamDisplay.svelte** - Handles stream categorization
  - Filters by status: 'scheduled', 'live', 'completed'
  - Shows countdown for scheduled streams
  - Shows live player for active streams

### What Changes
- Stream status must update to 'live' when OBS connects
- Playback URL must be set (from Cloudflare Stream)
- Memorial page automatically picks up status change

**No changes needed to countdown/display logic - already handles this!**

---

## Database Schema Changes

### Stream Document Fields to Add
```typescript
{
  // Existing fields...
  status: 'scheduled' | 'ready' | 'live' | 'completed',
  scheduledStartTime?: string,
  
  // NEW FIELDS
  armStatus?: {
    isArmed: boolean,
    armType: 'mobile_input' | 'mobile_streaming' | 'stream_key' | null,
    armedAt?: string,
    armedBy?: string // user uid
  },
  
  streamCredentials?: {
    // For WHIP (Mobile Input & Mobile Streaming)
    whipUrl?: string,
    whepUrl?: string, // For playback
    
    // For RTMP (Stream Key)
    rtmpUrl?: string,
    streamKey?: string,
    
    // Cloudflare identifiers
    cloudflareInputId?: string,
    cloudflareStreamId?: string
  }
}
```

---

## API Endpoints Needed

### 1. Arm Stream Endpoint
**POST** `/api/streams/[streamId]/arm`

**Request Body:**
```json
{
  "armType": "mobile_input" | "mobile_streaming" | "stream_key"
}
```

**Response:**
```json
{
  "success": true,
  "stream": {
    "id": "...",
    "armStatus": { ... },
    "streamCredentials": { ... }
  }
}
```

**Actions:**
- Updates stream document with arm status
- Generates appropriate credentials based on arm type
- For WHIP: Creates Cloudflare Live Input, gets WHIP/WHEP URLs
- For RTMP: Creates Cloudflare Live Input with RTMP, gets credentials

---

### 2. Update Start Time Endpoint
**PATCH** `/api/streams/[streamId]/schedule`

**Request Body:**
```json
{
  "scheduledStartTime": "2024-01-01T10:00:00Z"
}
```

**Note:** Should work regardless of armed status

---

### 3. Stream Status Webhook (Optional)
**For automatic status updates when stream goes live**

Cloudflare Stream can send webhooks when:
- Stream starts (status → 'live')
- Stream ends (status → 'completed')
- Recording ready

Alternative: Poll Cloudflare API periodically to check stream status

---

## Implementation Phases

### Phase 1: UI & Basic Arming
- [ ] Add dropdown + Arm button to StreamCard
- [ ] Add armed status display
- [ ] Create arm API endpoint (basic structure)
- [ ] Add database schema fields

### Phase 2: Stream Key Implementation
- [ ] Implement Cloudflare RTMP input creation
- [ ] Generate and store RTMP credentials
- [ ] Display credentials to stream manager
- [ ] Test OBS → Cloudflare connection

### Phase 3: Status Integration
- [ ] Implement stream status updates (manual or webhook)
- [ ] Test memorial page countdown → live transition
- [ ] Verify playback URL population

### Phase 4: Mobile Input
- [ ] Implement WHIP credential generation
- [ ] Display WHIP URL to stream manager
- [ ] Create/integrate browser streaming interface

### Phase 5: Mobile Streaming
- [ ] Define additional mobile features
- [ ] Implement mobile-specific functionality
- [ ] Test on mobile devices

### Phase 6: Edit Start Time
- [ ] Add edit start time UI to StreamCard
- [ ] Create update schedule API endpoint
- [ ] Test editing armed vs unarmed streams

---

## Testing Checklist

### Stream Key Flow
- [ ] Admin can arm stream with "Stream Key"
- [ ] Stream manager sees RTMP URL and Stream Key
- [ ] OBS can connect using credentials
- [ ] Stream status updates to 'live' when OBS connects
- [ ] Memorial page shows live player (not countdown)
- [ ] Viewers can watch live stream
- [ ] Stream ends properly, status updates to 'completed'

### Mobile Input Flow
- [ ] Admin can arm stream with "Mobile Input"
- [ ] Stream manager sees WHIP URL
- [ ] Browser streaming works
- [ ] Stream goes live on memorial page

### Mobile Streaming Flow
- [ ] Admin can arm stream with "Mobile Streaming"
- [ ] Additional mobile features work as expected
- [ ] Stream goes live on memorial page

### General
- [ ] Can edit start time while unarmed
- [ ] Can edit start time while armed
- [ ] Arm status displays correctly
- [ ] Credentials are secure and not exposed to viewers
- [ ] Multiple streams can be armed simultaneously
- [ ] Arming doesn't break existing scheduled streams

---

## Security Considerations

- **Stream credentials must be protected** - only visible to authorized users
- **RTMP stream keys** should be regenerated if compromised
- **API endpoints** must verify user permissions (admin/funeral director only)
- **Webhook endpoints** (if used) must validate Cloudflare signatures
- **Viewer access** - credentials should never be exposed to public viewers

---

## Questions to Answer

1. **Mobile Streaming vs Mobile Input** - What are the specific differences?
2. **Cloudflare Live Input** - Do we need separate inputs for WHIP vs RTMP, or can one input handle both?
3. **Status Updates** - Webhook or polling? What's more reliable?
4. **Playback URL** - How do we get the playback URL once stream is live?
5. **Recording** - Should all streams auto-record? Different settings per arm type?

---

## Notes

- Existing scheduled stream functionality remains intact
- MemorialStreamDisplay already handles countdown → live transition
- Focus on Stream Key implementation first (clearest use case)
- Mobile Input/Streaming can be iterative improvements
