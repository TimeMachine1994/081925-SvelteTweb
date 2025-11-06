# Streaming Architecture Refactor - Execution Plan

**Version:** 1.0 | **Date:** October 29, 2025 | **Status:** Planning Phase

---

## Overview

Refactor StreamCard to support three streaming methods: **OBS**, **Phone to OBS**, and **Phone to MUX**.

### Success Criteria
- [ ] Method selection UI implemented
- [ ] All three methods functional
- [ ] Recording works for all methods
- [ ] Backward compatibility maintained
- [ ] Documentation complete

---

## Phase 1: Foundation (Est. 4 hours)

### 1.1 Update Type Definitions
**File:** `frontend/src/lib/types/stream.ts`

```typescript
export interface Stream {
  // Add new fields
  streamingMethod: 'obs' | 'phone-to-obs' | 'phone-to-mux';
  phoneSourceStreamId?: string;
  phoneSourcePlaybackUrl?: string;
  muxStreamId?: string;
  muxPlaybackId?: string;
  restreamingEnabled?: boolean;
}
```

**Tasks:**
- [ ] Add streaming method fields to Stream interface
- [ ] Create `streaming-methods.ts` with method config types
- [ ] Add JSDoc documentation
- [ ] Set default values for backward compatibility

### 1.2 Server-Side Method Setup
**File:** `frontend/src/lib/server/streaming-methods.ts` (NEW)

**Tasks:**
- [ ] Create `setupOBSMethod()` - single Cloudflare stream
- [ ] Create `setupPhoneToOBSMethod()` - two Cloudflare streams
- [ ] Stub `setupPhoneToMUXMethod()` - implement in Phase 4
- [ ] Add error handling and cleanup

### 1.3 Update Stream Creation API
**File:** `frontend/src/routes/api/memorials/[memorialId]/streams/+server.ts`

**Tasks:**
- [ ] Accept `streamingMethod` parameter
- [ ] Call appropriate setup function based on method
- [ ] Return method-specific configuration
- [ ] Update response format

**Deliverables:** Types updated, server utilities created, API updated

---

## Phase 2: OBS Method (Est. 3 hours)

### 2.1 Method Selection UI
**File:** `frontend/src/lib/ui/stream/StreamCard.svelte`

```svelte
{#if !stream.methodConfigured}
  <div class="method-selection">
    <h3>Choose Streaming Method</h3>
    <button onclick={() => selectMethod('obs')}>
      💻 OBS - Professional streaming
    </button>
    <button onclick={() => selectMethod('phone-to-obs')}>
      📱➡️💻 Phone to OBS - Phone as camera
    </button>
    <button onclick={() => selectMethod('phone-to-mux')}>
      📱 Phone to MUX - Direct streaming
    </button>
  </div>
{/if}
```

**Tasks:**
- [ ] Add method selection state
- [ ] Create method selection grid
- [ ] Add loading state during configuration
- [ ] Call API to configure selected method

### 2.2 OBS Method Component
**File:** `frontend/src/lib/ui/stream/methods/OBSMethodUI.svelte` (NEW)

**Tasks:**
- [ ] Display RTMP URL and Stream Key
- [ ] Add copy-to-clipboard buttons
- [ ] Show setup instructions
- [ ] Add live status indicator
- [ ] Style to match design system

### 2.3 Testing
- [ ] Create stream with OBS method
- [ ] Configure OBS and stream
- [ ] Verify live playback on memorial page
- [ ] Verify recording after stream ends
- [ ] Test with existing streams

**Deliverables:** OBS method fully functional

---

## Phase 3: Phone to OBS Method (Est. 5 hours)

### 3.1 Two-Panel UI Component
**File:** `frontend/src/lib/ui/stream/methods/PhoneToOBSMethodUI.svelte` (NEW)

```svelte
<div class="two-panel-layout">
  <!-- Left: OBS Credentials -->
  <div class="obs-panel">
    <h5>Configure OBS</h5>
    RTMP URL: {stream.rtmpUrl}
    Stream Key: {stream.streamKey}
  </div>
  
  <!-- Right: Phone Camera -->
  <div class="phone-panel">
    <h5>Phone Camera</h5>
    <BrowserStreamer streamId={stream.phoneSourceStreamId} />
    {#if phoneActive}
      Browser Source URL: {stream.phoneSourcePlaybackUrl}
    {/if}
  </div>
</div>
```

**Tasks:**
- [ ] Create two-panel layout
- [ ] Show OBS credentials on left
- [ ] Show phone camera on right
- [ ] Display browser source URL after phone starts
- [ ] Add workflow status indicator

### 3.2 Update BrowserStreamer
**File:** `frontend/src/lib/components/BrowserStreamer.svelte`

**Tasks:**
- [ ] Accept custom streamId prop
- [ ] Make instructions optional
- [ ] Add onStreamStart callback
- [ ] Test with phone source stream

### 3.3 Testing
- [ ] Start phone camera
- [ ] Add phone to OBS as browser source
- [ ] Stream from OBS
- [ ] Verify memorial page shows OBS output
- [ ] Verify recording from OBS stream

**Deliverables:** Phone to OBS method functional

---

## Phase 4: Phone to MUX Method (Est. 6 hours)

### 4.1 MUX Setup
**Tasks:**
- [ ] Create MUX account
- [ ] Get API credentials
- [ ] Add to environment variables
- [ ] Test API authentication

### 4.2 MUX Integration
**File:** `frontend/src/lib/server/mux-integration.ts` (NEW)

```typescript
export async function createMUXLiveStream() {
  const response = await fetch('https://api.mux.com/video/v1/live-streams', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${encodedCredentials}` },
    body: JSON.stringify({
      playback_policy: 'public',
      new_asset_settings: { playback_policy: 'public' }
    })
  });
  return response.json();
}

export async function getMUXRecording(streamId: string) {
  // Fetch MUX asset and WHEP playback URL
}
```

**Tasks:**
- [ ] Implement createMUXLiveStream()
- [ ] Implement getMUXRecording()
- [ ] Add error handling
- [ ] Test MUX API calls

### 4.3 Cloudflare Restreaming
**File:** `frontend/src/lib/server/streaming-methods.ts`

```typescript
export async function setupPhoneToMUXMethod() {
  const muxStream = await createMUXLiveStream();
  
  const liveInput = await createLiveInput({
    name: 'Phone to MUX',
    recording: { mode: 'automatic' },
    outputs: [{
      url: `rtmps://global-live.mux.com:443/app/${muxStream.stream_key}`,
      enabled: true
    }]
  });
  
  return { cloudflareWhipUrl, muxStreamId, muxPlaybackId };
}
```

**Tasks:**
- [ ] Implement setupPhoneToMUXMethod()
- [ ] Configure Cloudflare restreaming
- [ ] Test restreaming to MUX
- [ ] Verify MUX receives stream

### 4.4 Phone to MUX UI
**File:** `frontend/src/lib/ui/stream/methods/PhoneToMUXMethodUI.svelte` (NEW)

**Tasks:**
- [ ] Show phone camera interface
- [ ] Add MUX badge/indicator
- [ ] Show "Streaming to memorial with MUX recording"
- [ ] Add live status

### 4.5 Update Recordings API
**File:** `frontend/src/routes/api/streams/playback/[streamId]/recordings/+server.ts`

```typescript
// Check both Cloudflare and MUX recordings
const recordings = {
  cloudflare: await checkCloudflareRecording(stream.cloudflareInputId),
  mux: await checkMUXRecording(stream.muxStreamId),
  preferredSource: 'mux' // for phone-to-mux method
};
```

**Tasks:**
- [ ] Add MUX recording check
- [ ] Implement multi-source logic
- [ ] Return preferred source
- [ ] Update memorial page to use preferred source

### 4.6 Testing
- [ ] Stream from phone
- [ ] Verify Cloudflare restreaming to MUX
- [ ] Check live playback on memorial
- [ ] Verify MUX recording after stream
- [ ] Test WHEP playback

**Deliverables:** Phone to MUX method fully functional

---

## Phase 5: Testing & Polish (Est. 4 hours)

### 5.1 Integration Testing
- [ ] Test all three methods end-to-end
- [ ] Test method switching (create new stream)
- [ ] Test recording availability for all methods
- [ ] Test with multiple concurrent streams
- [ ] Test error scenarios (failed setup, network issues)

### 5.2 Backward Compatibility
- [ ] Migrate existing streams to OBS method
- [ ] Test existing stream playback
- [ ] Verify existing recordings still work
- [ ] Test edit schedule with all methods

### 5.3 UI Polish
- [ ] Add loading states
- [ ] Improve error messages
- [ ] Add help tooltips
- [ ] Responsive design for mobile
- [ ] Accessibility review

### 5.4 Performance
- [ ] Optimize API calls
- [ ] Add caching where appropriate
- [ ] Test with slow connections
- [ ] Monitor Cloudflare/MUX API usage

**Deliverables:** Production-ready implementation

---

## Phase 6: Documentation (Est. 2 hours)

### 6.1 Technical Documentation
- [ ] Update STREAMCARD_OVERVIEW.md
- [ ] Update STREAMCARD_APIS.md
- [ ] Document new streaming methods
- [ ] Add troubleshooting guide

### 6.2 User Documentation
- [ ] Create streaming method comparison guide
- [ ] Write OBS setup instructions
- [ ] Write Phone to OBS instructions
- [ ] Write Phone to MUX instructions

### 6.3 Code Documentation
- [ ] Add JSDoc comments to new functions
- [ ] Update component prop documentation
- [ ] Add inline code comments
- [ ] Update API endpoint documentation

**Deliverables:** Complete documentation

---

## Migration Strategy

### Existing Streams
```typescript
// Add to migration script
existing_streams.forEach(stream => {
  if (!stream.streamingMethod) {
    stream.streamingMethod = 'obs';
    stream.methodConfigured = true;
  }
});
```

### Rollback Plan
1. Keep old StreamCredentials component as backup
2. Feature flag for new UI: `ENABLE_STREAMING_METHODS=false`
3. Database rollback script to remove new fields
4. Keep old API endpoints for 30 days

---

## Timeline Summary

| Phase | Description | Est. Time |
|-------|-------------|-----------|
| 1 | Foundation | 4 hours |
| 2 | OBS Method | 3 hours |
| 3 | Phone to OBS | 5 hours |
| 4 | Phone to MUX | 6 hours |
| 5 | Testing & Polish | 4 hours |
| 6 | Documentation | 2 hours |
| **Total** | | **24 hours** |

---

## Risk Mitigation

### Technical Risks
- **Cloudflare restreaming limits**: Test with MUX team, have backup plan
- **MUX API rate limits**: Implement request throttling
- **WebRTC reliability**: Add fallback UI and error recovery

### User Experience Risks
- **Complexity**: Add clear instructions and help text
- **Method confusion**: Add preview/demo for each method
- **Setup failures**: Provide detailed error messages and troubleshooting

---

## Next Steps

1. ✅ Review and approve this execution plan
2. Begin Phase 1: Update type definitions
3. Set up feature branch: `feature/streaming-methods`
4. Create tracking issue with checklist
5. Start implementation following phase order
