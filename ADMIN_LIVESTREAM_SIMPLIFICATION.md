# Admin Livestream Simplification - Refactoring Plan

**Date:** January 8, 2025  
**Status:** 📝 Planning  
**Goal:** Simplify livestream creation and remove outdated arming system

---

## 🎯 Overview

Simplify the admin memorial details page livestream workflow by removing the confusing "arm stream" options and replacing it with a direct "Create & Launch Switcher" flow.

---

## ❌ What We're Removing

### 1. **Stream Arming System (Entire Feature)**
**Location:** `StreamCard.svelte` component

**Remove:**
- ❌ Arm dropdown with 3 options:
  - Mobile Input
  - Mobile Streaming  
  - Stream Key (OBS)
- ❌ "Arm" button and handleArm() function
- ❌ Arm status display
- ❌ Credentials display (RTMP URL, Stream Key, WHIP URL)
- ❌ All arming-related state and logic

**Why:** This arming system is confusing and unnecessary for the Video Switcher workflow. The switcher creates its own streaming infrastructure using Daily.co.

---

### 2. **Complex Stream Creation Form**
**Location:** `/admin/services/memorials/[memorialId]/+page.svelte`

**Current (Remove):**
```svelte
{#if showStreamForm}
  <div class="stream-form">
    <input bind:value={streamTitle} placeholder="Stream Title" />
    <input type="date" bind:value={streamDate} />
    <input type="time" bind:value={streamTime} />
    <button onclick={handleCreateStream}>Schedule Stream</button>
  </div>
{/if}
```

**Issues:**
- Requires scheduling date/time upfront
- Too many fields for quick streaming
- Form toggle adds complexity

---

## ✅ What We're Adding

### 1. **Simple "Create Livestream" Button**
**Location:** `/admin/services/memorials/[memorialId]/+page.svelte`

**New UI:**
```svelte
<div class="livestream-section">
  <h2>📹 Video Switcher</h2>
  <p>Create a multi-camera livestream</p>
  
  <button class="primary-btn" onclick={handleQuickCreateStream}>
    🎬 Create Livestream & Launch Switcher
  </button>
</div>
```

**Features:**
- Single-click creation
- Auto-generates stream title (e.g., "Memorial Service - Jan 8, 2025")
- Immediately redirects to switcher
- No scheduling required (streams are "live" type)

---

### 2. **Streamlined Creation Function**

**New Function:**
```javascript
async function handleQuickCreateStream() {
  try {
    // Auto-generate title
    const timestamp = new Date().toLocaleDateString();
    const title = `${memorial.lovedOneName} - Livestream ${timestamp}`;
    
    // Create stream with minimal data
    const response = await fetch(`/api/memorials/${memorial.id}/streams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title,
        status: 'ready', // Ready for switcher
        description: 'Multi-camera livestream',
        // NO streaming method - switcher handles it
      })
    });
    
    const newStream = await response.json();
    
    // Immediately launch switcher
    goto(`/memorials/${memorial.id}/switcher/${newStream.id}`);
  } catch (error) {
    alert('Failed to create livestream');
  }
}
```

**Benefits:**
- ✅ One function, minimal code
- ✅ No user input required
- ✅ Auto-navigation to switcher
- ✅ No arming step

---

## 📁 Files to Modify

### File 1: `/admin/services/memorials/[memorialId]/+page.svelte`
**Changes:**
1. Remove stream creation form UI (lines ~285-404)
2. Remove form state variables:
   - `showStreamForm`
   - `streamTitle`
   - `streamDate`
   - `streamTime`
   - `isCreatingStream`
3. Remove `handleCreateStream()` function
4. Remove `cancelStreamForm()` function
5. **Add** simple "Create Livestream" button
6. **Add** `handleQuickCreateStream()` function
7. **Keep** stream deletion functionality (for cleanup)

---

### File 2: `StreamCard.svelte` Component
**Changes:**
1. Remove arming dropdown UI
2. Remove arm button
3. Remove `selectedArmType` state
4. Remove `showArmDropdown` state
5. Remove `handleArm()` function
6. Remove `getArmTypeLabel()` function
7. Remove credentials display section (RTMP, Stream Key, WHIP)
8. Remove arm status badge
9. **Keep** "Launch Switcher" button (already exists)
10. **Keep** stream status display
11. **Keep** stream visibility controls

---

### File 3: `/api/memorials/[memorialId]/streams/+server.ts`
**Changes:**
1. **Simplify** POST endpoint to not require `streamingMethod`
2. Remove conditional streaming setup logic (lines ~156-250)
3. Remove method-specific credential generation
4. **Keep** basic stream creation (title, description, memorialId)
5. Streams created with `status: 'ready'` by default

**Rationale:** The switcher creates its own Daily.co room and tokens. We don't need pre-generated streaming credentials.

---

### File 4: `/api/streams/[streamId]/arm/+server.ts`
**Status:** 🗑️ **DELETE ENTIRE FILE**

**Why:** Arming is no longer needed. The switcher handles all streaming setup.

---

## 🔄 New Workflow

### **Before (Confusing):**
```
Admin Memorial Page
  ↓
Click "Create Livestream"
  ↓
Fill out form (title, date, time)
  ↓
Submit form
  ↓
Page reloads
  ↓
Find your stream in the list
  ↓
Click dropdown, select "Mobile Input"
  ↓
Click "Arm" button
  ↓
Wait for arming...
  ↓
Page reloads
  ↓
Find stream again
  ↓
Click "Launch Switcher"
  ↓
Finally streaming! 🎉
```

### **After (Simple):**
```
Admin Memorial Page
  ↓
Click "Create Livestream & Launch Switcher"
  ↓
Switcher opens immediately
  ↓
Start streaming! 🎉
```

**Steps reduced from ~10 to 2!**

---

## 🎨 UI Changes

### Before:
```
┌─────────────────────────────────────────┐
│ 📹 Livestreams (2)                      │
│ [➕ Create Livestream] [🚨 Emergency]   │
├─────────────────────────────────────────┤
│ ┌──── Stream Form ────────────────────┐ │
│ │ Title: [________________]           │ │
│ │ Date:  [__________]                 │ │
│ │ Time:  [__________]                 │ │
│ │ [📅 Schedule Stream] [Cancel]       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌──── Stream Card ───────────────────┐ │
│ │ Memorial Service                    │ │
│ │ Status: Scheduled                   │ │
│ │                                     │ │
│ │ Arm Type: [▼ Mobile Input      ]   │ │
│ │ [Arm Stream]                        │ │
│ │ [Launch Switcher] [Delete]          │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### After:
```
┌─────────────────────────────────────────┐
│ 📹 Video Switcher                       │
│ Create a multi-camera livestream        │
│                                         │
│ [🎬 Create Livestream & Launch Switcher]│
│                                         │
│ ──────── Active Streams ────────        │
│                                         │
│ ┌──── Stream Card ───────────────────┐ │
│ │ Memorial Service - Jan 8            │ │
│ │ Status: Ready                       │ │
│ │                                     │ │
│ │ [🎬 Launch Switcher] [🗑️ Delete]    │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🔧 Technical Details

### Stream Data Structure (Simplified)

**Before:**
```json
{
  "id": "stream123",
  "title": "Memorial Service",
  "memorialId": "memorial456",
  "status": "scheduled",
  "scheduledStartTime": "2025-01-08T14:00:00Z",
  "streamingMethod": "phone-to-obs",
  "armStatus": {
    "isArmed": true,
    "armType": "mobile_input",
    "armedAt": "2025-01-08T13:00:00Z"
  },
  "streamCredentials": {
    "whipUrl": "https://...",
    "rtmpUrl": "rtmp://...",
    "streamKey": "abc123..."
  },
  "cloudflareInputId": "input789",
  "phoneSourceStreamId": "phone456"
}
```

**After:**
```json
{
  "id": "stream123",
  "title": "Memorial Service - Jan 8, 2025",
  "memorialId": "memorial456",
  "status": "ready",
  "description": "Multi-camera livestream",
  "createdAt": "2025-01-08T13:00:00Z",
  "createdBy": "admin123"
}
```

**Fields Removed:**
- `streamingMethod`
- `scheduledStartTime`
- `armStatus`
- `streamCredentials`
- `cloudflareInputId`
- `phoneSourceStreamId`
- `rtmpUrl`
- `streamKey`
- `whipUrl`

**Why:** The Daily.co switcher manages all streaming infrastructure. These fields are obsolete.

---

## 📊 Impact Analysis

### Code Reduction
- **Lines removed:** ~500-600 lines
- **Files deleted:** 1 (`arm/+server.ts`)
- **Functions removed:** 5-7
- **State variables removed:** 8-10

### User Experience
- **Steps to go live:** 10 → 2 (80% reduction)
- **Form fields:** 3 → 0
- **Clicks required:** 6-8 → 1
- **Confusion points:** Multiple → Zero

### Breaking Changes
- ❌ Existing "armed" streams will still work
- ❌ Arming API endpoint will be removed (not used elsewhere)
- ✅ Stream creation API remains compatible
- ✅ Switcher functionality unchanged
- ✅ No database migration needed

---

## 🧪 Testing Plan

### Test Case 1: Create & Launch
1. Navigate to admin memorial page
2. Click "Create Livestream & Launch Switcher"
3. **Expected:** Switcher opens immediately
4. **Expected:** Stream appears in Daily.co room
5. **Expected:** Can connect phones via QR codes

### Test Case 2: Multiple Streams
1. Create first livestream
2. Return to memorial page
3. Create second livestream
4. **Expected:** Both streams listed
5. **Expected:** Can launch switcher for either stream

### Test Case 3: Stream Deletion
1. Create a livestream
2. Click "Delete" button
3. **Expected:** Stream soft-deleted
4. **Expected:** Stream removed from list

### Test Case 4: Daily.co Integration
1. Create livestream
2. Launch switcher
3. **Expected:** Daily.co room created
4. **Expected:** QR codes generated
5. **Expected:** Can connect 4 phone sources

---

## 🚀 Implementation Order

### Phase 1: Backend Simplification
1. ✅ Simplify stream creation API
2. ✅ Remove streaming method requirement
3. ✅ Delete arm endpoint

### Phase 2: Component Cleanup
1. ✅ Remove arming UI from StreamCard
2. ✅ Remove credentials display
3. ✅ Keep switcher button

### Phase 3: Admin Page Refactor
1. ✅ Remove stream creation form
2. ✅ Add simple create button
3. ✅ Add quick create function
4. ✅ Update styling

### Phase 4: Testing & Docs
1. ✅ Test creation flow
2. ✅ Test switcher integration
3. ✅ Update documentation
4. ✅ Create user guide

---

## 📝 Notes

### Why This Approach?
- **Removes confusion:** No more wondering what "arm type" to choose
- **Faster workflow:** One click instead of multiple steps
- **Cleaner code:** Removes 500+ lines of unused functionality
- **Better UX:** Clear, straightforward process
- **Maintainable:** Less code to maintain and debug

### What About OBS Users?
The original arming system was designed for OBS users who need RTMP credentials. However:
- The Video Switcher is our primary streaming solution
- OBS users can use the switcher as an NDI source
- If needed, we can add OBS support separately later
- Current focus: Multi-camera phone streaming

### Backward Compatibility
- Existing armed streams: Still functional, can launch switcher
- Database: No migration needed
- APIs: Stream creation remains compatible
- Only the arming endpoint is removed (not actively used)

---

## ✅ Success Criteria

- [ ] Can create livestream with one click
- [ ] Switcher launches immediately after creation
- [ ] No arming step required
- [ ] QR codes work for phone connections
- [ ] Multiple streams can coexist
- [ ] Stream deletion works correctly
- [ ] Code is cleaner and more maintainable
- [ ] Documentation is updated

---

## 🔗 Related Files

**Modified:**
- `/frontend/src/routes/admin/services/memorials/[memorialId]/+page.svelte`
- `/frontend/src/lib/components/streaming/StreamCard.svelte`
- `/frontend/src/routes/api/memorials/[memorialId]/streams/+server.ts`

**Deleted:**
- `/frontend/src/routes/api/streams/[streamId]/arm/+server.ts`

**Unchanged:**
- `/frontend/src/routes/memorials/[id]/switcher/[streamId]/+page.server.ts` (Daily.co switcher)
- `/frontend/src/routes/memorials/[id]/switcher/[streamId]/+page.svelte` (Switcher UI)
- All other admin pages

---

## 📅 Timeline

**Estimated Time:** 2-3 hours
- Backend changes: 30 min
- Component refactor: 1 hour
- Admin page updates: 1 hour  
- Testing: 30 min

**Ready to proceed!**
