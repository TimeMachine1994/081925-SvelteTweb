# WBS: SIMPLIFIED STREAM SCHEDULING WITH OBS CREDENTIALS
**Date:** January 21, 2026  
**Objective:** Show OBS streaming credentials immediately when admin schedules a stream

---

## GOAL
When admin creates a scheduled stream, immediately generate and display RTMP URL and Stream Key so they can stream with OBS.

**No arming required. No complicated flows. Just show the credentials.**

---

## CURRENT PROBLEM

### What Works
✅ Admin can set date and time for stream  
✅ Stream is saved to database  
✅ Countdown displays correctly on memorial page  

### What's Broken
❌ No Cloudflare Live Input created when stream is scheduled  
❌ No RTMP URL or Stream Key generated  
❌ StreamCard UI doesn't show OBS credentials  

**Result:** Admin schedules stream but has no way to actually broadcast to it.

---

## SOLUTION ARCHITECTURE

### Flow
```
1. Admin enters stream title, date, time
2. Click "Schedule Stream"
3. Backend creates Cloudflare Live Input immediately
4. Save RTMP URL and Stream Key to stream document
5. Display credentials in StreamCard UI
6. Admin copies credentials into OBS
7. Admin starts streaming at scheduled time
```

### Key Components
- **API:** `/api/memorials/[memorialId]/streams` (POST)
- **Service:** `cloudflare-stream.ts` → `createLiveInput()`
- **Database:** `streams` collection → add credentials fields
- **UI:** `StreamCard.svelte` → display RTMP credentials section

---

## WORK BREAKDOWN

### PHASE 1: Backend - Create Cloudflare Live Input on Schedule

#### Task 1.1: Fix Stream Creation API
**File:** `src/routes/api/memorials/[memorialId]/streams/+server.ts`

**Current Code (Lines 152-192):**
```typescript
// BROKEN: References undefined variables and methods
let streamKey = '';
let rtmpUrl = '';
let cloudflareInputId = '';

try {
    if (streamingMethod === 'obs') { // streamingMethod is undefined!
        const config = await setupOBSMethod(); // Function doesn't exist!
        // ...
    }
}
```

**Fix Required:**
```typescript
// Import Cloudflare service
import { createLiveInput } from '$lib/server/cloudflare-stream';

// Create Live Input immediately when stream is scheduled
console.log('🎬 Creating Cloudflare Live Input for stream:', title.trim());

const liveInput = await createLiveInput(title.trim());

// Extract credentials
const streamKey = liveInput.rtmpsStreamKey;
const rtmpUrl = liveInput.rtmpsUrl;
const cloudflareInputId = liveInput.liveInputId;

console.log('✅ Cloudflare Live Input created:', cloudflareInputId);
```

**Lines to Remove:** 157-192 (broken streaming method code)  
**Lines to Replace:** 152-154 (empty variable initialization)

#### Task 1.2: Update Stream Data Structure
**Current:**
```typescript
const streamData: any = {
    title: title.trim(),
    scheduledStartTime,
    status: 'scheduled',
    streamKey, // Empty!
    rtmpUrl, // Empty!
    cloudflareInputId, // Empty!
    // ...
};
```

**After Fix:**
```typescript
const streamData: any = {
    title: title.trim(),
    scheduledStartTime,
    status: 'scheduled',
    streamKey, // Now has value from Cloudflare
    rtmpUrl, // Now has value from Cloudflare
    cloudflareInputId, // Now has value from Cloudflare
    streamCredentials: {
        rtmpUrl,
        streamKey,
        cloudflareInputId
    },
    // ...
};
```

**Expected Result:**
- Stream document saved with RTMP credentials
- Ready to use immediately in OBS

---

### PHASE 2: Frontend - Display OBS Credentials

#### Task 2.1: Update StreamCard Component
**File:** `src/lib/components/streaming/StreamCard.svelte`

**Current State:**
- Shows stream title, status, scheduled time
- Has copy buttons for credentials
- **But only shows when stream is "armed"**

**Required Changes:**

1. **Show RTMP section for ALL scheduled streams**
```svelte
<!-- Show credentials immediately if they exist -->
{#if stream.streamCredentials?.rtmpUrl && stream.streamCredentials?.streamKey}
    <div class="credentials-section">
        <h4>OBS Streaming Setup</h4>
        <p class="instructions">Use these credentials in OBS to stream:</p>
        
        <div class="credential-group">
            <label>RTMP Server URL:</label>
            <div class="credential-value">
                <code>{stream.streamCredentials.rtmpUrl}</code>
                <button onclick={() => copyToClipboard(stream.streamCredentials.rtmpUrl, 'rtmp')}>
                    {copiedRtmp ? 'Copied!' : 'Copy'}
                </button>
            </div>
        </div>
        
        <div class="credential-group">
            <label>Stream Key:</label>
            <div class="credential-value">
                <code>{stream.streamCredentials.streamKey}</code>
                <button onclick={() => copyToClipboard(stream.streamCredentials.streamKey, 'streamKey')}>
                    {copiedStreamKey ? 'Copied!' : 'Copy'}
                </button>
            </div>
        </div>
        
        <div class="help-text">
            <p>💡 <strong>To stream with OBS:</strong></p>
            <ol>
                <li>Open OBS Studio</li>
                <li>Go to Settings → Stream</li>
                <li>Set Service to "Custom"</li>
                <li>Paste Server URL and Stream Key</li>
                <li>Click "Start Streaming" when ready</li>
            </ol>
        </div>
    </div>
{/if}
```

2. **Remove arming requirements**
- Delete arm/disarm button logic
- Show credentials immediately
- Simplify UI

**Expected Result:**
- Admin sees RTMP URL and Stream Key immediately after creating stream
- Copy buttons work
- Clear instructions for OBS setup

---

### PHASE 3: Admin Dashboard Integration

#### Task 3.1: Update Memorial Details Page
**File:** `src/routes/admin/services/memorials/[memorialId]/+page.svelte`

**Current:** Stream creation form works, but created streams have no credentials

**After Fix:**
- Created streams show credentials immediately
- No additional steps required
- StreamCard displays OBS setup instructions

#### Task 3.2: Verify Schedule API Works
**File:** `src/routes/api/streams/[streamId]/schedule/+server.ts`

**Status:** Already implemented and working
- Admin can update scheduled time via PATCH request
- Could add UI button to edit time (optional for now)

---

## TESTING CHECKLIST

### Test 1: Create Scheduled Stream
1. ✅ Go to `/admin/services/memorials/[memorialId]`
2. ✅ Click "Create Livestream"
3. ✅ Enter title: "Memorial Service for John Doe"
4. ✅ Select date: February 1, 2026
5. ✅ Select time: 2:00 PM
6. ✅ Click "Schedule Stream"
7. ✅ Verify Cloudflare Live Input is created (check console logs)
8. ✅ Verify stream document has credentials saved

### Test 2: View Credentials
1. ✅ Stream card shows "OBS Streaming Setup" section
2. ✅ RTMP URL is displayed and copyable
3. ✅ Stream Key is displayed and copyable
4. ✅ Instructions are clear and helpful

### Test 3: Use in OBS
1. ✅ Copy RTMP URL from admin page
2. ✅ Copy Stream Key from admin page
3. ✅ Configure OBS with credentials
4. ✅ Start streaming in OBS
5. ✅ Verify stream appears on memorial page

### Test 4: Memorial Page Display
1. ✅ Before scheduled time: Shows countdown
2. ✅ At scheduled time: Shows live stream
3. ✅ After streaming: Shows recording (if available)

---

## CODE CHANGES SUMMARY

### Files to Modify

#### 1. `/src/routes/api/memorials/[memorialId]/streams/+server.ts`
**Lines to change:** 152-192  
**Action:** Replace broken code with Cloudflare Live Input creation  
**Import:** `import { createLiveInput } from '$lib/server/cloudflare-stream';`

#### 2. `/src/lib/components/streaming/StreamCard.svelte`
**Lines to modify:** ~100-200 (credentials display section)  
**Action:** Show RTMP credentials immediately for all streams with credentials  
**Remove:** Arming requirements/logic

#### 3. `/src/routes/admin/services/memorials/[memorialId]/+page.svelte`
**Status:** No changes needed (already works with updated API)

---

## IMPLEMENTATION ESTIMATE

### Time Breakdown
- **Backend Fix:** 30 minutes
  - Remove broken code: 5 minutes
  - Add Cloudflare Live Input creation: 15 minutes
  - Test API endpoint: 10 minutes

- **Frontend Update:** 45 minutes
  - Update StreamCard component: 30 minutes
  - Style credentials section: 10 minutes
  - Test in admin dashboard: 5 minutes

- **End-to-End Testing:** 30 minutes
  - Create test stream: 5 minutes
  - Test OBS streaming: 15 minutes
  - Verify memorial page display: 10 minutes

**Total: ~2 hours**

---

## SUCCESS CRITERIA

✅ Admin can schedule a stream with date/time  
✅ Cloudflare Live Input is created immediately  
✅ RTMP URL and Stream Key are visible in admin UI  
✅ Credentials are copyable with one click  
✅ Clear OBS setup instructions are provided  
✅ No arming or additional steps required  
✅ Stream works when admin starts broadcasting in OBS  
✅ Memorial page shows countdown, then live stream  

---

## DEPLOYMENT NOTES

### Environment Variables Required
- `CLOUDFLARE_ACCOUNT_ID` (already configured)
- `CLOUDFLARE_API_TOKEN` (already configured)

### Database Changes
None required - `streams` collection already has fields for credentials

### Breaking Changes
None - This is purely additive functionality

### Rollback Plan
If issues occur, revert API changes and streams will still save (just without credentials)

---

## FUTURE ENHANCEMENTS (Out of Scope)

- ❌ Stream arming/disarming
- ❌ Mobile input streaming
- ❌ Encoder pairing
- ❌ Multi-stream setups
- ❌ Bridge servers

**Keep it simple: Just show the OBS credentials.**

---

**END OF WBS**
