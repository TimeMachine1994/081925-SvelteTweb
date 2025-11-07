# WHIP + Cloudflare + Mux Recording Refactor Plan

**Created:** November 6, 2025  
**Goal:** Implement WHIP streaming via Cloudflare with Mux recording backup  
**Architecture:** Browser WHIP → Cloudflare Live → Dual Recording (Cloudflare + Mux)

---

## 🎯 Executive Summary

Enable **browser-based WHIP streaming** with **dual recording** for maximum reliability:
- **Primary Stream**: Cloudflare Live Input (WHIP protocol)
- **Primary Recording**: Cloudflare Stream (automatic)
- **Backup Recording**: Mux Video (optional, enterprise-grade)

### Key Benefits
- ✅ Zero Setup - Users stream from phone browser, no OBS required
- ✅ Dual Recording - Cloudflare + Mux redundancy for critical services
- ✅ Graceful Degradation - Works without Mux (Cloudflare-only mode)
- ✅ Enterprise Reliability - 99.9%+ uptime for memorial services

---

## 🏗️ Architecture

```
Phone Browser (WHIP)
         │
         ↓
Cloudflare Live Input
    ├──→ Live Viewers (HLS)
    ├──→ Cloudflare Recording (Primary)
    └──→ Simulcast to Mux (Backup - Optional)
              └──→ Mux VOD Asset
```

---

## 📋 Implementation Phases

### Phase 1: Backend Infrastructure (Days 1-3)

#### Files to Create/Modify:

**1. Create `src/lib/server/mux.ts`**
- Mux SDK integration
- Functions: `createMuxLiveStream()`, `getMuxAsset()`, `isMuxConfigured()`
- Returns: MuxLiveStream interface with id, streamKey, rtmpsUrl

**2. Update `src/lib/server/cloudflare-stream.ts`**
- Add `createLiveOutput()` function for simulcast
- Add `getWHIPUrl()` helper
- Output API: POST to `/live_inputs/{id}/outputs`

**3. Update `src/lib/server/streaming-methods.ts`**
- Add `setupWHIPStreaming()` function
- Creates Mux stream (if enabled)
- Creates Cloudflare live input
- Sets up simulcast output
- Returns: WHIPStreamConfig with all URLs

**4. Create `src/routes/api/streams/create-whip/+server.ts`**
- POST endpoint for WHIP stream creation
- Calls `setupWHIPStreaming()`
- Saves stream to Firestore with dual recording fields

**5. Create `src/routes/api/webhooks/mux/+server.ts`**
- Handles Mux webhook events
- Event types: `video.asset.ready`, `video.live_stream.active/idle`
- Updates stream with Mux recording info

**6. Update `src/lib/types/stream.ts`**
- Ensure fields exist: `whipUrl`, `muxLiveStreamId`, `muxAssetId`, `muxPlaybackUrl`
- Add `recordingSources.mux` structure
- Already has most fields from previous implementation

#### Environment Variables:
```env
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret
MUX_WEBHOOK_SECRET=your_webhook_secret
```

#### NPM Package:
```bash
npm install @mux/mux-node
```

---

### Phase 2: Frontend Components (Days 4-6)

#### Files to Create:

**1. Create `src/lib/utils/whip-client.ts`**
- WHIPClient class for browser WebRTC streaming
- Methods: `start()`, `stop()`, `getState()`
- Handles: getUserMedia, PeerConnection, WHIP protocol
- States: idle, requesting-media, connecting, streaming, stopped, error

**2. Create `src/lib/components/BrowserStreamer.svelte`**
- Video preview component
- Start/Stop streaming buttons
- Status indicators (loading, live, error)
- Uses WHIPClient utility
- Props: streamId, whipUrl, onStreamStart/Stop callbacks

**3. Create `src/lib/components/WHIPMethodUI.svelte`**
- UI for WHIP streaming method
- Shows architecture diagram
- Displays recording sources (Cloudflare + Mux status)
- Integrates BrowserStreamer component
- Shows streaming instructions

---

### Phase 3: Stream Manager Integration (Days 7-8)

#### Files to Modify:

**1. Update Stream Creation Modal**
- Add streaming method selection: OBS vs Browser (WHIP)
- Checkbox for "Enable Mux Backup Recording"
- Call `/api/streams/create-whip` for browser method

**2. Update StreamCard Component**
- Conditional rendering based on `streamingMethod`
- If 'obs': Show RTMP credentials
- If 'whip_browser': Show "Go Live" button → Opens BrowserStreamer
- Display recording sources status

**3. Update Stream Management Page**
- Support both OBS and WHIP streams
- Show appropriate UI for each method
- Recording source indicators (Cloudflare/Mux)

---

## 🔧 Technical Details

### WHIP Protocol Flow:
1. Browser calls `getUserMedia()` → Get camera/mic
2. Create RTCPeerConnection → Add media tracks
3. Create SDP offer → Send via POST to WHIP URL
4. Receive SDP answer → Set as remote description
5. WebRTC connection established → Stream flows to Cloudflare

### Dual Recording Logic:
```typescript
// Stream creation
const muxStream = await createMuxLiveStream(title); // Optional
const cfInput = await createLiveInput({ name: title, recording: 'automatic' });
if (muxStream) {
  await createLiveOutput(cfInput.uid, muxStream.rtmpsUrl, muxStream.streamKey);
}

// Recording sources
recordingSources: {
  cloudflare: { available: false }, // Updated by Cloudflare webhook
  mux: { available: false }         // Updated by Mux webhook
}
```

### Webhook Configuration:
- **Mux Dashboard**: Add webhook URL: `https://yourdomain.com/api/webhooks/mux`
- **Cloudflare**: Existing webhook at `/api/webhooks/stream-status`

---

## 📝 Testing Plan

### Local Testing:
1. Create WHIP stream with Mux backup enabled
2. Click "Go Live" in browser
3. Allow camera/microphone access
4. Verify streaming starts (live indicator)
5. Check Cloudflare dashboard (stream active)
6. Check Mux dashboard (simulcast active)
7. Stop stream
8. Wait for webhooks (recordings ready)
9. Verify both recordings available

### Edge Cases:
- Mux disabled (Cloudflare-only recording)
- Camera permission denied
- Connection failure/retry
- Mobile browser compatibility
- Network interruption handling

---

## 🚀 Deployment Checklist

- [ ] Install `@mux/mux-node` package
- [ ] Add Mux env vars to .env and Vercel
- [ ] Create mux.ts utility
- [ ] Update cloudflare-stream.ts (Output API)
- [ ] Update streaming-methods.ts (WHIP setup)
- [ ] Create /api/streams/create-whip endpoint
- [ ] Create /api/webhooks/mux endpoint
- [ ] Configure Mux webhook URL in dashboard
- [ ] Create whip-client.ts utility
- [ ] Create BrowserStreamer.svelte component
- [ ] Create WHIPMethodUI.svelte component
- [ ] Update stream creation modal (method selection)
- [ ] Update StreamCard component (conditional UI)
- [ ] Test WHIP streaming end-to-end
- [ ] Test on mobile browsers (iOS Safari, Android Chrome)
- [ ] Deploy to production
- [ ] Monitor first production streams

---

## 📊 Success Metrics

- **Stream Creation Time**: < 3 seconds
- **WHIP Connection Time**: < 2 seconds
- **Recording Reliability**: 99.9% (dual sources)
- **Mobile Browser Support**: iOS 14+, Android Chrome 90+
- **User Experience**: Zero-click streaming (vs OBS setup)

---

**Timeline:** 8 days for complete implementation  
**Priority:** High - Enables mobile streaming without OBS  
**Risk Level:** Low - Builds on existing Cloudflare infrastructure
