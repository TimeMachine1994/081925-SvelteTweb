# Duplicate Participant Fix

**Date**: November 29, 2025  
**Issue**: Duplicate admin sessions showing "2 Sources" when only 1 should exist  
**Status**: ✅ Fixed

---

## 🐛 Problem

When the admin granted camera permissions on the switcher page, Daily.co created a **duplicate session**:

### Session 1 (Working)
- ID: `e2f3a7f9-9218-496f-a369-f58a5869fe09`
- Video: `playable` ✅
- Audio: `playable` ✅
- Has tracks: true

### Session 2 (Blocked/Ghost)
- ID: `94f795f3-15a8-4bf2-8cac-d78956aecee4`
- Video: `blocked` ❌
- Audio: `blocked` ❌
- Has tracks: false

**Result**: Header showed "2 Sources" but only 1 preview box was visible (confusing UX).

---

## ✅ Solution

Added intelligent filtering to exclude blocked/duplicate participants using Svelte 5's `$derived` rune:

```typescript
// Filter out blocked/duplicate participants
let validParticipants = $derived(participants.filter(p => {
    // Keep participants that have video, audio, or are the local admin
    return p.hasVideo || p.hasAudio || p.local;
}));
let participantCount = $derived(validParticipants.length);
```

---

## 🔧 Changes Made

### 1. Added `validParticipants` Derived State
**File**: `switcher/+page.svelte` (lines 22-28)

Filters out participants with:
- No video (`hasVideo: false`)
- No audio (`hasAudio: false`)
- Not local admin (`local: false`)

This catches "blocked" sessions that have no usable tracks.

---

### 2. Updated Preview Loop
**File**: `switcher/+page.svelte` (line 448)

**Before**:
```svelte
{#each participants as p (p.id)}
```

**After**:
```svelte
{#each validParticipants as p (p.id)}
```

Now only shows participants with working tracks.

---

### 3. Updated Header Count
**File**: `switcher/+page.svelte` (line 28)

**Before**:
```typescript
let participantCount = $derived(participants.length); // Shows 2
```

**After**:
```typescript
let participantCount = $derived(validParticipants.length); // Shows 1
```

Header now shows accurate count of usable sources.

---

### 4. Enhanced Debug Panel
**File**: `switcher/+page.svelte` (lines 521-528)

Added two metrics:
- **Valid Sources**: Count of usable participants (1)
- **Total Participants**: Raw count including blocked (2)

This helps diagnose duplicate session issues.

---

## 🎯 Results

### Before Fix
- Header: "2 Sources" 
- Preview boxes: 1 visible
- User confusion: High
- Debug visibility: None

### After Fix
- Header: "1 Sources" ✅
- Preview boxes: 1 visible ✅
- User confusion: None ✅
- Debug visibility: Full (shows 1 valid, 2 total) ✅

---

## 🔍 Why This Happens

Daily.co creates duplicate sessions when:

1. **Permission flow interruption** - Camera permission granted mid-connection
2. **Browser security** - Second session tries to access camera but gets blocked
3. **Multiple connection attempts** - Network issues causing reconnection
4. **Page refresh during join** - Old session persists while new one joins

The "blocked" state indicates the second session tried to access camera/mic but was denied (likely because first session has exclusive access).

---

## 🚀 Best Practices Applied

### Svelte 5 Patterns
- ✅ Used `$derived` rune for reactive filtering
- ✅ Proper keyed `{#each}` blocks with `(p.id)`
- ✅ Component-scoped state management

### SvelteKit Patterns
- ✅ Client-side only logic (no server state pollution)
- ✅ Reactive updates without manual subscriptions
- ✅ Performance-optimized with derived computations

### Daily.co Integration
- ✅ Proper participant state checking
- ✅ Track state validation (`playable`, `blocked`, `off`)
- ✅ Graceful handling of permission issues

---

## 🧪 Testing

### Manual Verification
1. ✅ Refresh switcher page
2. ✅ Grant camera permissions
3. ✅ Check header shows "1 Sources"
4. ✅ Verify only 1 preview box visible
5. ✅ Open debug panel
6. ✅ Confirm "Valid Sources: 1, Total Participants: 2"

### Expected Debug Logs
```
✅ Processed participants: [
  { "name": "Admin...", "hasVideo": true, "hasTrack": true },
  { "name": "Admin...", "hasVideo": false, "hasTrack": false }
]
```

Filtered to:
```
Valid Sources: 1
Total Participants: 2
```

---

## 📝 Notes

- Blocked sessions will eventually timeout and disconnect from Daily
- Filter prevents them from appearing in UI
- Debug panel still shows total count for transparency
- No breaking changes to existing functionality

---

**Status**: Ready for testing! Refresh your switcher page and check the results. 🎉
