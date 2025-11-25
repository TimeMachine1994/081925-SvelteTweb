# Stream and Webhook Flow - Production Architecture

## 🎯 Architecture Overview

**System Design**: Webhook-only architecture for instant stream status updates. Streams are manually armed to generate Cloudflare credentials, then webhooks provide real-time status updates when streaming begins.

## 📊 The Complete Stream Lifecycle

### Phase 1: Stream Creation
**Location**: `/api/memorials/[memorialId]/streams` (POST)

#### What Happens When a Stream is Created:

```javascript
// Stream is created with EMPTY credentials
const streamData = {
  title: "Event Service",
  memorialId: "abc123",
  status: scheduledStartTime ? 'scheduled' : 'ready',  // ← Sets status
  isVisible: true,
  
  // ⚠️ THESE ARE EMPTY - No Cloudflare setup yet!
  streamKey: '',           // ← EMPTY
  rtmpUrl: '',            // ← EMPTY  
  cloudflareInputId: '',  // ← EMPTY
  
  createdBy: userId,
  createdAt: "2024-11-13T...",
  updatedAt: "2024-11-13T..."
};
```

#### Status Logic:
- **Has `scheduledStartTime`**: Status = `'scheduled'` 
- **No `scheduledStartTime`**: Status = `'ready'`

#### ⚠️ The Problem:
The stream is created but it **CANNOT receive video** because:
1. No Cloudflare Live Input exists
2. No RTMP URL or Stream Key
3. No WHIP URL for browser streaming
4. Webhook has nothing to monitor (no `cloudflareInputId`)

### Phase 2: Stream Arming (REQUIRED MANUAL STEP)
**Location**: `/api/streams/[streamId]/arm` (POST)

#### This is the MISSING step in your backend!

When an admin "arms" a stream in the UI:

```javascript
// 1. Creates Cloudflare Live Input
const liveInput = await createLiveInput(streamTitle);

// 2. Gets actual streaming credentials from Cloudflare
{
  liveInputId: "eb222fcca08eeb1ae84c981ebe8aeeb6",
  whipUrl: "https://customer-abc.cloudflarestream.com/...",
  whepUrl: "https://customer-abc.cloudflarestream.com/...",
  rtmpsUrl: "rtmps://live.cloudflare.com:443/live/",
  rtmpsStreamKey: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}

// 3. Updates stream in Firestore
await streamDoc.ref.update({
  armStatus: {
    isArmed: true,
    armType: 'mobile_input' | 'mobile_streaming' | 'stream_key',
    armedAt: "2024-11-13T...",
    armedBy: userId
  },
  streamCredentials: {
    cloudflareInputId: "eb222fcca...",  // ← NOW SET!
    whipUrl: "https://...",
    rtmpUrl: "rtmps://...",
    streamKey: "a1b2..."
  },
  updatedAt: "2024-11-13T..."
});
```

#### After Arming:
- Stream **still has same status** ('scheduled' or 'ready')
- But now has `armStatus.isArmed = true`
- And has `streamCredentials` with Cloudflare data
- Webhook can now monitor this stream (has `cloudflareInputId`)

### Phase 3: Going Live
**Two pathways depending on arm type:**

#### Option A: Browser Streaming (WHIP)
1. User opens stream manager page
2. Sees armed stream with WHIP URL
3. Clicks "Start Browser Streaming"
4. Browser sends video via WebRTC to Cloudflare
5. **No webhook yet** - WHIP doesn't trigger webhooks immediately

#### Option B: OBS/Encoder Streaming (RTMP)
1. User configures OBS with:
   - **Server**: `rtmps://live.cloudflare.com:443/live/`
   - **Stream Key**: From `streamCredentials.streamKey`
2. User clicks "Start Streaming" in OBS
3. OBS connects to Cloudflare RTMP server
4. **Cloudflare detects connection**
5. **Webhook triggers**: `POST /api/webhooks/cloudflare-stream`

### Phase 4: Webhook Processing
**Location**: `/api/webhooks/cloudflare-stream` (POST)

#### Webhook Payload from Cloudflare:
```json
{
  "uid": "eb222fcca08eeb1ae84c981ebe8aeeb6",
  "status": "connected",
  "meta": {
    "name": "Event Service Stream"
  },
  "created": "2024-11-13T12:00:00Z",
  "modified": "2024-11-13T12:05:00Z"
}
```

#### What the Webhook Handler Does:

```javascript
// 1. Receives webhook from Cloudflare
const { uid, status } = payload;

// 2. Finds stream by Cloudflare Input ID
const streamsSnapshot = await adminDb
  .collection('streams')
  .where('streamCredentials.cloudflareInputId', '==', uid)  // ← Looks for this!
  .limit(1)
  .get();

// 3. Updates stream status based on Cloudflare status
switch (status) {
  case 'connected':
  case 'live':
    updates.status = 'live';  // ← Changes from 'ready' to 'live'
    updates.liveStartedAt = new Date().toISOString();
    updates.playbackUrl = `https://iframe.cloudflarestream.com/${uid}`;
    break;
    
  case 'disconnected':
  case 'ended':
    updates.status = 'completed';
    updates.liveEndedAt = new Date().toISOString();
    break;
    
  case 'ready':
    updates.status = 'ready';
    break;
    
  case 'error':
    updates.status = 'error';
    updates.errorMessage = meta?.errorMessage;
    break;
}

// 4. Saves to Firestore
await streamDoc.ref.update(updates);
```

## 🔍 Why You Don't See "Ready" Anywhere

### The Confusion:

1. **Frontend (StreamCard.svelte)**:
   - Shows status as badge: `{stream.status.toUpperCase()}`
   - Status colors: 
     - `ready: 'bg-green-100 text-green-800'`
     - `scheduled: 'bg-blue-100 text-blue-800'`
     - `live: 'bg-red-100 text-red-800'`

2. **Backend Creates Streams As**:
   - `'scheduled'` if has scheduledStartTime
   - `'ready'` if no scheduledStartTime

3. **The Real Problem**:
   - Streams created from calculator **always have** `scheduledStartTime`
   - So they are **always** `status: 'scheduled'`
   - They **never** show as `'ready'` until:
     - Either the scheduled time passes
     - Or an admin manually arms them

## 📋 Step-by-Step User Journey

### Current Flow (What's Happening):

```
1. User schedules service in calculator
   └─> POST /api/memorials/{memorialId}/streams
       └─> Creates stream with status: 'scheduled'
       └─> NO Cloudflare credentials
       └─> NO streaming capability yet

2. Admin views stream in admin dashboard
   └─> Sees: [🔵 SCHEDULED] Event Service
   └─> Sees: "Arm Stream" section (purple box)
   └─> Dropdown: Mobile Input / Mobile Streaming / Stream Key

3. Admin clicks "Arm" button
   └─> POST /api/streams/{streamId}/arm
       └─> Creates Cloudflare Live Input
       └─> Gets WHIP URL, RTMP URL, Stream Key
       └─> Saves to streamCredentials
       └─> Sets armStatus.isArmed = true
   └─> Page reloads
   └─> Now sees: [🟣 ARMED: Mobile Input] credential boxes

4. Admin copies streaming credentials
   └─> WHIP URL for browser
   └─> OR RTMP URL + Stream Key for OBS

5. User starts streaming
   └─> Option A: Browser streaming (WebRTC/WHIP)
   └─> Option B: OBS streaming (RTMP)

6. Cloudflare detects connection
   └─> Sends webhook: POST /api/webhooks/cloudflare-stream
       └─> Payload: { uid: "...", status: "connected" }

7. Webhook handler updates stream
   └─> Queries: WHERE streamCredentials.cloudflareInputId == uid
   └─> Updates: status = 'live'
   └─> Sets: liveStartedAt, playbackUrl

8. Frontend polling detects change
   └─> Every 10 seconds checks stream status
   └─> Sees status changed from 'scheduled' to 'live'
   └─> Shows: [🔴 LIVE] with pulsing animation

9. User stops streaming
   └─> Cloudflare detects disconnection
   └─> Sends webhook: { uid: "...", status: "disconnected" }
   └─> Handler updates: status = 'completed'
   └─> Sets: liveEndedAt
```

## ❌ What's Broken / Missing

### Issue #1: No Automatic Arming
**Problem**: Streams created from calculator are NOT automatically armed

**Current**: 
```javascript
// Stream created with empty credentials
streamKey: '',
rtmpUrl: '',
cloudflareInputId: ''
```

**Needed**: Automatically call arm API after stream creation

**Solution**:
```javascript
// After creating stream
const streamRef = await adminDb.collection('streams').add(streamData);

// ⚠️ MISSING: Automatically arm the stream
const armResponse = await fetch(`/api/streams/${streamRef.id}/arm`, {
  method: 'POST',
  body: JSON.stringify({ armType: 'stream_key' }) // or 'mobile_input'
});
```

### Issue #2: Webhook Not Configured
**Problem**: Cloudflare webhook may not be pointing to your server

**Check**:
```bash
curl -X GET \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/webhook" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

**Expected Response**:
```json
{
  "result": {
    "notificationUrl": "https://tributestream.com/api/webhooks/cloudflare-stream",
    "modified": "2024-01-01T12:00:00Z",
    "secret": "your-webhook-secret"
  },
  "success": true
}
```

**If Not Configured**:
```bash
curl -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/webhook" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationUrl": "https://tributestream.com/api/webhooks/cloudflare-stream"
  }'
```

### Issue #3: Frontend Shows "Scheduled" Forever
**Problem**: Streams stay in 'scheduled' status until:
1. Manually armed AND
2. Actually goes live via webhook

**Why**:
- Created with `status: 'scheduled'`
- Arming doesn't change status
- Only webhook changes status to 'live'
- If webhook not working, stays 'scheduled' forever

### Issue #4: No "Ready" Streams in UI
**Problem**: All calculator streams have `scheduledStartTime`, so they're always 'scheduled'

**If you want "ready" streams**:
```javascript
// Option 1: Don't set scheduledStartTime
const streamData = {
  title: "Event Service",
  memorialId,
  status: 'ready',  // ← No scheduledStartTime means 'ready'
  // scheduledStartTime: undefined
};

// Option 2: Change status after arming
await streamDoc.ref.update({
  status: 'ready',  // ← Manually set to ready after arming
  armStatus: { isArmed: true, ... },
  streamCredentials: { ... }
});
```

## 🔧 How The System Works

### Production Flow:

1. **Stream Creation** ✅
   - Creates stream in Firestore
   - Sets status: 'scheduled' or 'ready'

2. **Stream Arming** ✅ (Manual Process)
   - Admin clicks "Arm" button in UI
   - Creates Cloudflare Live Input
   - Stores streaming credentials (RTMP/WHIP)
   - **This is intentional** - gives control over when streams are ready

3. **Webhook Configuration** ⚠️ (Must Verify)
   - Cloudflare webhook must point to production domain
   - Secret must match `CLOUDFLARE_WEBHOOK_SECRET`
   - **Only ONE webhook URL per Cloudflare account**
   - Cannot have separate dev/staging/prod webhooks

4. **Go Live via Webhook** ✅
   - User streams via OBS (RTMP) or browser (WHIP)
   - Cloudflare detects connection (2-5 seconds)
   - Sends webhook to your server
   - Handler updates stream to 'live' instantly

5. **Frontend Display** ✅
   - Shows current status from Firestore
   - User refreshes to see live stream
   - No polling - relies on webhooks only

## 🎯 Configuration Requirements

### Requirement #1: Webhook Domain Configuration

**Check current webhook URL:**

```bash
curl -X GET \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/webhook" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

**Set webhook to production domain:**

```bash
curl -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/webhook" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationUrl": "https://tributestream.com/api/webhooks/cloudflare-stream"
  }'
```

**Important:** Webhook URL must match where your production app is deployed.

### Requirement #2: Environment Variables

**Ensure these are set in production:**

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_WEBHOOK_SECRET=your-webhook-secret
```

**The webhook secret must match** what's configured in Cloudflare. Get it with:

```bash
curl -X GET \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/webhook" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq .result.secret
```

### Requirement #3: Test on Production Domain

**Cannot test on Vercel preview URLs** because:
- Cloudflare only supports ONE webhook URL
- Every deploy gets a new Vercel URL
- Changing webhook URL for each test is impractical

**Solution:** Test on your production domain (e.g., `tributestream.com`) where webhook is configured.

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  1. STREAM CREATION (Calculator or Admin)                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
         POST /api/memorials/[id]/streams
                          ↓
    ┌──────────────────────────────────────┐
    │  Firestore: streams collection       │
    │  ─────────────────────────────────   │
    │  status: 'scheduled' or 'ready'      │
    │  cloudflareInputId: '' (EMPTY!)      │
    │  streamKey: '' (EMPTY!)              │
    │  armStatus: null (NOT ARMED!)        │
    └──────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  2. STREAM ARMING (Manual in UI - SHOULD BE AUTO!)          │
└─────────────────────────────────────────────────────────────┘
                          ↓
          POST /api/streams/[id]/arm
                          ↓
    ┌──────────────────────────────────────┐
    │  Cloudflare API                      │
    │  POST /stream/live_inputs            │
    └──────────────────────────────────────┘
                          ↓
         Returns: {liveInputId, whipUrl,
                  rtmpUrl, streamKey}
                          ↓
    ┌──────────────────────────────────────┐
    │  Update Firestore                    │
    │  ─────────────────────────────────   │
    │  armStatus.isArmed: true             │
    │  streamCredentials:                  │
    │    cloudflareInputId: "eb222fc..."   │
    │    rtmpUrl: "rtmps://..."            │
    │    streamKey: "a1b2c3..."            │
    └──────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3. USER STARTS STREAMING                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
    ┌────────────────┬─────────────────┐
    │  Browser WHIP  │   OBS RTMP      │
    └────────────────┴─────────────────┘
                          ↓
                  Cloudflare Detects
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  4. CLOUDFLARE WEBHOOK                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
  POST /api/webhooks/cloudflare-stream
  Payload: { uid: "eb222fc...", status: "connected" }
                          ↓
    ┌──────────────────────────────────────┐
    │  Query Firestore:                    │
    │  WHERE streamCredentials.            │
    │    cloudflareInputId == uid          │
    └──────────────────────────────────────┘
                          ↓
              Stream found? Yes
                          ↓
    ┌──────────────────────────────────────┐
    │  Update Stream Status                │
    │  ─────────────────────────────────   │
    │  status: 'live'                      │
    │  liveStartedAt: timestamp            │
    │  playbackUrl: iframe URL             │
    └──────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  5. FRONTEND POLLING                                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
    Every 10 seconds: Check stream status
                          ↓
         Status changed to 'live'?
                          ↓
    ┌──────────────────────────────────────┐
    │  Update UI                           │
    │  ─────────────────────────────────   │
    │  Show: [🔴 LIVE] with pulse         │
    │  Start playing video                 │
    └──────────────────────────────────────┘
```

## 🎬 Summary

### Why you don't see streams going "live":

1. **Streams are created but NOT armed** = No Cloudflare Live Input
2. **Without arming** = No `cloudflareInputId` to monitor
3. **Webhook looks for** `cloudflareInputId` to find stream
4. **Can't find stream** = No status update to 'live'
5. **Stream stays 'scheduled'** forever

### The Fix:
**Auto-arm streams when they're created**, so they have Cloudflare credentials ready for the webhook to monitor.

---

**Created**: 2024-11-13  
**Status**: 🚨 Critical Issue Identified
