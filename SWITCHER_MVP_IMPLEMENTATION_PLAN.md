# Switcher MVP Implementation Plan

## 🎯 Goal
Build a functional video switcher using Daily.co API that matches the `SwitcherMockup.html` design, with admin-only access and QR code phone connections (no auth required for sources).

---

## Phase 1: Foundation & Setup (Day 1)
**Focus**: Get Daily API integrated and create basic route structure

### 1.1 Install Dependencies
```bash
npm install @daily-co/daily-js
npm install qrcode  # For QR code generation
```

### 1.2 Create Environment Variables
Add to `.env`:
```
DAILY_API_KEY=your_daily_api_key
DAILY_DOMAIN=your_domain.daily.co
```

### 1.3 Create Route Structure
```
frontend/src/routes/memorials/[id]/switcher/[streamId]/
├── +page.svelte           # Main switcher UI
├── +page.server.ts        # Auth check, Daily room creation
└── +layout.svelte         # Optional: Fullscreen layout
```

### 1.4 Server-Side Setup (`+page.server.ts`)
**Tasks**:
- ✅ Verify user is admin (`locals.user.role === 'admin'`)
- ✅ Load memorial and stream data
- ✅ Create Daily room via REST API (`POST https://api.daily.co/v1/rooms`)
- ✅ Generate owner token for admin (is_owner: true)
- ✅ Generate 4 guest tokens for phone sources (is_owner: false)
- ✅ Return room URL, tokens, and WHIP endpoint

**Key API Call**:
```typescript
const roomResponse = await fetch('https://api.daily.co/v1/rooms', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${DAILY_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: `memorial-${memorialId}-${streamId}`,
    privacy: 'private',
    properties: {
      max_participants: 6,  // 1 admin + 4 sources + 1 buffer
      enable_recording: 'cloud',
      enable_chat: false,
      enable_knocking: false
    }
  })
});
```

**Generate Tokens**:
```typescript
const ownerToken = await fetch('https://api.daily.co/v1/meeting-tokens', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${DAILY_API_KEY}` },
  body: JSON.stringify({
    properties: {
      room_name: roomName,
      is_owner: true,
      enable_recording: 'cloud',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4 // 4 hours
    }
  })
});

// Generate 4 guest tokens for sources
const guestTokens = await Promise.all([1,2,3,4].map(i => 
  fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: `Source ${i}`,
        is_owner: false
      }
    })
  })
));
```

---

## Phase 2: Daily Client Integration (Day 2)
**Focus**: Initialize Daily call object and render participant videos

### 2.1 Create Daily Store (`$lib/stores/daily-switcher.ts`)
```typescript
import Daily from '@daily-co/daily-js';
import { writable } from 'svelte/store';

export const dailyCall = writable<any>(null);
export const participants = writable<any[]>([]);
export const activeParticipant = writable<string | null>(null);
```

### 2.2 Initialize Call Object in Switcher Page
```typescript
import Daily from '@daily-co/daily-js';

const call = Daily.createCallObject({
  subscribeToTracksAutomatically: false,  // CRITICAL for bandwidth
  audioSource: false,  // Admin doesn't send audio
  videoSource: false   // Admin doesn't send video
});

// Join room
await call.join({ 
  url: data.roomUrl, 
  token: data.ownerToken 
});

// Listen for participants
call.on('participant-joined', updateParticipants);
call.on('participant-left', updateParticipants);
call.on('participant-updated', updateParticipants);
```

### 2.3 Track Subscription Logic
**Subscribe to all sources for multiview**:
```typescript
function subscribeToSource(sessionId: string, quality: 'high' | 'low') {
  call.updateParticipant(sessionId, {
    setSubscribedTracks: {
      audio: true,
      video: quality === 'high' ? true : { layer: 0 }, // Simulcast low layer
      screenVideo: false
    }
  });
}
```

### 2.4 Render Video Elements
```svelte
{#each $participants as participant}
  <video
    id="video-{participant.session_id}"
    autoplay
    playsinline
    muted
  />
{/each}
```

**Attach tracks**:
```typescript
call.on('track-started', (event) => {
  const videoEl = document.getElementById(`video-${event.participant.session_id}`);
  if (videoEl && event.track.kind === 'video') {
    videoEl.srcObject = new MediaStream([event.track]);
  }
});
```

---

## Phase 3: Switcher UI (Day 3)
**Focus**: Convert mockup HTML to Svelte components

### 3.1 Copy Mockup Styles
- Port Tailwind classes from mockup
- Add custom animations (pulse, transitions)
- Use Lucide Svelte icons

### 3.2 Component Structure
```
$lib/components/switcher/
├── SwitcherHeader.svelte       # Live indicator, clock, QR button
├── ProgramMonitor.svelte       # Main output display
├── AudioMonitor.svelte         # Audio level overlay
├── SourceBus.svelte            # Scrollable source previews
├── SourceCard.svelte           # Individual source with controls
└── QRModal.svelte              # QR code display modal
```

### 3.3 Main Page Layout
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import SwitcherHeader from '$lib/components/switcher/SwitcherHeader.svelte';
  import ProgramMonitor from '$lib/components/switcher/ProgramMonitor.svelte';
  import AudioMonitor from '$lib/components/switcher/AudioMonitor.svelte';
  import SourceBus from '$lib/components/switcher/SourceBus.svelte';
  import QRModal from '$lib/components/switcher/QRModal.svelte';
  
  export let data;
  
  let showQRModal = false;
  let activeSourceId = $state<string | null>(null);
</script>

<div class="h-screen w-screen flex flex-col bg-black text-gray-100 overflow-hidden">
  <SwitcherHeader bind:showQRModal sessionId={data.stream.id} />
  
  <main class="flex-1 relative">
    <ProgramMonitor {activeSourceId} />
    <AudioMonitor {activeSourceId} />
  </main>
  
  <SourceBus 
    sources={$participants} 
    {activeSourceId}
    on:switch={(e) => switchToSource(e.detail.id)}
  />
  
  <QRModal 
    show={showQRModal} 
    qrCodes={data.sourceQRCodes}
    on:close={() => showQRModal = false}
  />
</div>
```

---

## Phase 4: Video Switching Logic (Day 4)
**Focus**: Implement VCS composition and switching

### 4.1 Start Live Streaming to WHIP
```typescript
async function startOutput() {
  await call.startLiveStreaming({
    rtmpUrl: data.whipUrl,  // Your Cloudflare WHIP endpoint
    layout: {
      preset: 'custom',
      composition_id: 'daily:baseline',
      composition_params: {
        mode: 'single',  // Single camera view for MVP
        videoSettings: {
          preferredParticipantIds: []  // Will update when switching
        }
      }
    }
  });
}
```

### 4.2 Switching Function
```typescript
function switchToSource(sessionId: string) {
  activeSourceId = sessionId;
  
  // Update cloud composition
  call.updateLiveStreaming({
    layout: {
      composition_params: {
        mode: 'single',
        videoSettings: {
          preferredParticipantIds: [sessionId]  // Switch to this source
        }
      }
    }
  });
  
  // Update local UI
  updateSourceBorders();
  
  // Send tally light signal
  call.sendAppMessage({ 
    type: 'TALLY_LIGHT', 
    active: sessionId 
  });
}
```

### 4.3 Audio Pin/Mute Logic
```typescript
function toggleAudioPin(sessionId: string) {
  if (pinnedAudioId === sessionId) {
    pinnedAudioId = null;
    activeAudioId = activeSourceId; // Follow video
  } else {
    pinnedAudioId = sessionId;
    activeAudioId = sessionId;
  }
}

function toggleMute(sessionId: string) {
  call.updateParticipant(sessionId, {
    setAudio: !muteMap[sessionId]
  });
  muteMap[sessionId] = !muteMap[sessionId];
}
```

---

## Phase 5: QR Code System (Day 5)
**Focus**: Generate QR codes and create phone join experience

### 5.1 Generate QR Codes (Server-Side)
```typescript
import QRCode from 'qrcode';

const sourceQRCodes = await Promise.all(
  data.guestTokens.map(async (token, index) => {
    const joinUrl = `${data.roomUrl}?t=${token}`;
    const qrDataUrl = await QRCode.toDataURL(joinUrl);
    return {
      slot: index + 1,
      url: joinUrl,
      qrCode: qrDataUrl
    };
  })
);
```

### 5.2 QR Modal Component
```svelte
<script lang="ts">
  export let show = false;
  export let qrCodes = [];
</script>

{#if show}
<div class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
  <div class="bg-gray-900 p-6 rounded-2xl max-w-2xl">
    <h3 class="text-lg font-bold mb-4">Connect Phone Sources</h3>
    
    <div class="grid grid-cols-2 gap-4">
      {#each qrCodes as source}
        <div class="bg-gray-800 p-4 rounded-lg">
          <h4 class="text-sm font-medium mb-2">Source {source.slot}</h4>
          <img src={source.qrCode} alt="QR Code" class="w-full bg-white p-2 rounded" />
          <div class="mt-2 flex items-center gap-2">
            <input 
              value={source.url} 
              readonly 
              class="text-xs bg-black/50 px-2 py-1 rounded flex-1 truncate"
            />
            <button onclick={() => navigator.clipboard.writeText(source.url)}>
              Copy
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
{/if}
```

### 5.3 Phone Join Page (Optional Lightweight Page)
**Route**: `/join/[roomToken]`
```svelte
<!-- Ultra-simple phone interface -->
<script>
  import Daily from '@daily-co/daily-js';
  export let data;
  
  onMount(async () => {
    const call = Daily.createCallObject();
    await call.join({ url: data.roomUrl, token: data.token });
  });
</script>

<div class="h-screen flex flex-col items-center justify-center bg-black text-white">
  <h1 class="text-2xl font-bold mb-4">Connected to Switcher</h1>
  <p class="text-gray-400">Your camera is now live</p>
  <button onclick={() => call.leave()} class="mt-8 px-6 py-3 bg-red-600 rounded">
    Disconnect
  </button>
</div>
```

---

## Phase 6: Stream Management Integration (Day 6)
**Focus**: Add "Launch Switcher" button to existing stream management

### 6.1 Update StreamCard Component
Add button to `StreamCard.svelte`:
```svelte
{#if stream.status === 'scheduled' || stream.status === 'ready'}
  {#if $user.role === 'admin'}
    <a
      href="/memorials/{memorialId}/switcher/{stream.id}"
      target="_blank"
      class="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-medium transition"
    >
      <i data-lucide="video" class="w-4 h-4"></i>
      Launch Switcher
    </a>
  {/if}
{/if}
```

### 6.2 Update Stream Status When Live
When switcher starts streaming:
```typescript
// In switcher page after startLiveStreaming succeeds
await fetch(`/api/streams/${streamId}`, {
  method: 'PATCH',
  body: JSON.stringify({ 
    status: 'live',
    startedAt: new Date().toISOString()
  })
});
```

---

## Phase 7: Testing & Polish (Day 7)
**Focus**: Test full workflow and fix issues

### 7.1 Test Checklist
- [ ] Admin can launch switcher from stream management
- [ ] Switcher opens in new window
- [ ] Daily room created successfully
- [ ] QR codes display correctly
- [ ] Phone can scan and join (no login required)
- [ ] Phone video appears in multiview
- [ ] Switching updates program output
- [ ] WHIP output reaches Cloudflare Stream
- [ ] Memorial page shows live feed
- [ ] Audio follows video by default
- [ ] Pin/mute controls work
- [ ] Tally light signals work

### 7.2 Error Handling
Add error states for:
- Daily room creation failure
- Token generation failure
- Connection drops
- No sources available
- WHIP connection failure

### 7.3 Loading States
- Room initialization spinner
- "Waiting for sources..." state
- Connection status indicators

---

## 🚀 MVP Feature Scope

### ✅ Included
- Admin-only access
- QR code phone connections (no auth)
- 4 video source inputs
- Single-camera program output
- Cut-based switching (instant)
- Audio follow video
- Audio pin/mute controls
- Live status indicator
- Basic multiview
- WHIP output to Cloudflare

### ❌ Excluded (Post-MVP)
- Fade transitions
- Picture-in-picture mode
- Split-screen layouts
- Graphics/overlays/lower thirds
- Recording to file
- Source labeling/naming
- Screen sharing sources
- Audio level metering (visual only for MVP)
- Multi-admin collaboration
- Automated switching logic

---

## 📁 Files to Create

### New Files (24 files)
```
routes/memorials/[id]/switcher/[streamId]/
  +page.svelte                   # Main switcher interface
  +page.server.ts                # Room creation, auth

lib/components/switcher/
  SwitcherHeader.svelte          # Header with live/QR
  ProgramMonitor.svelte          # Main output
  AudioMonitor.svelte            # Audio overlay
  SourceBus.svelte               # Source grid
  SourceCard.svelte              # Individual source
  QRModal.svelte                 # QR code modal

lib/stores/
  daily-switcher.ts              # Daily state management

lib/utils/
  daily-room.ts                  # Room creation helpers
  qr-generator.ts                # QR code generation

api/daily/
  create-room/+server.ts         # Room API endpoint
  generate-tokens/+server.ts     # Token generation

routes/join/[roomToken]/
  +page.svelte                   # Simple phone join page
  +page.server.ts                # Token validation
```

### Modified Files (2 files)
```
routes/memorials/[id]/streams/+page.svelte   # Add launch button
lib/components/streams/StreamCard.svelte     # Add switcher button
```

---

## 🔧 Daily API Calls Summary

### Room Management
1. **Create Room**: `POST /v1/rooms`
2. **Delete Room** (cleanup): `DELETE /v1/rooms/:name`

### Tokens
3. **Generate Owner Token**: `POST /v1/meeting-tokens` (is_owner: true)
4. **Generate Guest Tokens**: `POST /v1/meeting-tokens` (x4, is_owner: false)

### Client SDK Methods
5. **Join Room**: `call.join({ url, token })`
6. **Start Streaming**: `call.startLiveStreaming({ rtmpUrl, layout })`
7. **Update Composition**: `call.updateLiveStreaming({ layout })`
8. **Update Participant**: `call.updateParticipant(id, { setSubscribedTracks })`
9. **Send Message**: `call.sendAppMessage({ type, data })`
10. **Leave Room**: `call.leave()`

---

## ⚡ Performance Considerations

### Bandwidth Optimization
- Use `subscribeToTracksAutomatically: false`
- Request simulcast layer 0 for multiview thumbnails
- Request full quality only for program monitor
- Limit to 4-6 total participants

### Latency Management
- WebRTC multiview: <200ms
- WHIP output: 10-30s delay (expected)
- Don't watch RTMP output for switching decisions
- Use WebRTC multiview as source of truth

---

## 🎯 Success Criteria

1. ✅ Admin clicks "Launch Switcher" → Opens in <3 seconds
2. ✅ Phone scans QR → Joins in <10 seconds
3. ✅ Switching takes <100ms on multiview
4. ✅ Memorial page shows live feed within 30s of first switch
5. ✅ System supports 4 simultaneous sources without lag
6. ✅ No authentication friction for phone sources
7. ✅ Room auto-cleanup on switcher close

---

## 📊 Implementation Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1. Foundation | 1 day | Routes, auth, Daily room creation |
| 2. Daily Client | 1 day | Call object, participant rendering |
| 3. Switcher UI | 1 day | Full UI matching mockup |
| 4. Switching Logic | 1 day | VCS composition, cutting |
| 5. QR System | 1 day | QR codes, phone join |
| 6. Integration | 1 day | Stream management button |
| 7. Testing | 1 day | Full workflow validation |
| **Total** | **7 days** | **MVP Ready** |

---

## 🚨 Critical Path Items

**Day 1-2**: Must get Daily API working with real video
**Day 3-4**: Must implement switching that updates both UI and cloud
**Day 5**: Must get QR codes working for phone sources
**Day 6-7**: Polish and testing

---

## 🔐 Security Notes

- Admin verification happens server-side in `+page.server.ts`
- Daily tokens expire after 4 hours
- Room names include memorial/stream IDs for traceability
- Guest tokens have minimal permissions (video/audio only)
- Rooms auto-delete after session ends
- WHIP credentials never exposed to phone sources

---

**Document Status**: MVP Implementation Plan  
**Last Updated**: 2025-01-29  
**Estimated Completion**: 7 working days
