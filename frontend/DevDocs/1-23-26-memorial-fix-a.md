# Work Breakdown Structure: Memorial Stream Badge Fix

**Project:** 1-23-26-memorial-fix-a  
**Date:** January 23, 2026  
**Objective:** Fix LIVE badge incorrectly appearing on Service Recordings  

---

## Executive Summary

Fix the UI bug where streams in the "Service Recording" section display a 🔴 LIVE badge instead of 📼 RECORDED badge. Implement defensive categorization logic and improved badge determination.

---

## WBS Overview

```
1.0 Memorial Stream Badge Fix
├── 1.1 Stream Categorization Fix (MemorialStreamDisplay)
│   ├── 1.1.1 Add mutual exclusion to recordedStreams
│   ├── 1.1.2 Add debug logging for categorization
│   └── 1.1.3 Verify no duplicate stream appearances
├── 1.2 Badge Logic Fix (MuxVideoPlayer)
│   ├── 1.2.1 Create isRecording derived state
│   ├── 1.2.2 Update isLive to exclude recordings
│   ├── 1.2.3 Update badge template rendering
│   └── 1.2.4 Handle 'ended' intermediate state
├── 1.3 Testing & Validation
│   ├── 1.3.1 Manual testing scenarios
│   ├── 1.3.2 Console log verification
│   └── 1.3.3 Edge case testing
└── 1.4 Documentation
    └── 1.4.1 Update component documentation
```

---

## Detailed Work Breakdown

### 1.1 Stream Categorization Fix

**File:** `src/lib/components/MemorialStreamDisplay.svelte`

#### 1.1.1 Add Mutual Exclusion to recordedStreams

**Current Code (lines 225-246):**
```typescript
let recordedStreams = $derived(
    liveStreams.filter(s => {
        const isRecording = s.isVisible !== false && 
            (s.status === 'completed' || 
             s.status === 'ended' ||
             s.recordingReady === true || 
             s.mux?.recordingReady === true);
        return isRecording;
    })
);
```

**Updated Code:**
```typescript
let recordedStreams = $derived(
    liveStreams.filter(s => {
        if (s.isVisible === false) return false;
        
        // Exclude streams that are currently showing as live
        const isInLiveStreams = categorizedLiveStreams.some(live => live.id === s.id);
        if (isInLiveStreams) return false;
        
        const isRecording = 
            s.status === 'completed' || 
            s.status === 'ended' ||
            s.recordingReady === true || 
            s.mux?.recordingReady === true;
        
        // Debug logging
        if (isRecording) {
            console.log('📼 [RECORDING CATEGORIZED]', s.id, {
                status: s.status,
                muxRecordingReady: s.mux?.recordingReady,
                vodPlaybackId: s.mux?.vodPlaybackId
            });
        }
        
        return isRecording;
    })
);
```

**Effort:** 15 minutes  
**Risk:** Low

---

#### 1.1.2 Add Debug Logging for Categorization

Add summary logging to track categorization results:

```typescript
$effect(() => {
    console.log('📊 [STREAM CATEGORIES]', {
        total: liveStreams.length,
        live: categorizedLiveStreams.length,
        scheduled: scheduledStreams.length,
        recorded: recordedStreams.length
    });
});
```

**Effort:** 5 minutes  
**Risk:** Low

---

#### 1.1.3 Verify No Duplicate Stream Appearances

Add validation check:

```typescript
$effect(() => {
    // Debug: Check for streams appearing in multiple categories
    const allCategorized = [
        ...categorizedLiveStreams.map(s => ({ id: s.id, category: 'live' })),
        ...scheduledStreams.map(s => ({ id: s.id, category: 'scheduled' })),
        ...recordedStreams.map(s => ({ id: s.id, category: 'recorded' }))
    ];
    
    const ids = allCategorized.map(s => s.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    
    if (duplicates.length > 0) {
        console.warn('⚠️ [DUPLICATE STREAMS]', duplicates);
    }
});
```

**Effort:** 10 minutes  
**Risk:** Low

---

### 1.2 Badge Logic Fix

**File:** `src/lib/components/streaming/MuxVideoPlayer.svelte`

#### 1.2.1 Create isRecording Derived State

**Add new derived state:**
```typescript
/**
 * Determine if this stream has a recording available
 */
const isRecording = $derived(() => {
    return stream.status === 'completed' ||
           stream.status === 'ended' ||
           stream.mux?.recordingReady === true;
});
```

**Effort:** 5 minutes  
**Risk:** Low

---

#### 1.2.2 Update isLive to Exclude Recordings

**Current Code (lines 77-83):**
```typescript
const isLive = $derived(() => {
    const live = stream.status === 'live' || 
                  (stream.status === 'ready' && stream.mux?.streamingStatus === 'active');
    return live;
});
```

**Updated Code:**
```typescript
const isLive = $derived(() => {
    // Recording takes precedence - if recording is ready, not live
    if (stream.mux?.recordingReady) return false;
    if (stream.status === 'completed' || stream.status === 'ended') return false;
    
    // Check for active live indicators
    const live = stream.status === 'live' || 
                 (stream.status === 'ready' && stream.mux?.streamingStatus === 'active');
    
    console.log('🎬 [MUX PLAYER] Is live:', live, {
        status: stream.status,
        recordingReady: stream.mux?.recordingReady,
        streamingStatus: stream.mux?.streamingStatus
    });
    
    return live;
});
```

**Effort:** 10 minutes  
**Risk:** Medium (affects live stream detection)

---

#### 1.2.3 Update Badge Template Rendering

**Current Code (lines 132-136):**
```svelte
{#if isLive()}
    <span class="live-badge">🔴 LIVE</span>
{:else if stream.status === 'completed'}
    <span class="recorded-badge">📼 RECORDED</span>
{/if}
```

**Updated Code:**
```svelte
{#if isLive()}
    <span class="live-badge">🔴 LIVE</span>
{:else if isRecording()}
    <span class="recorded-badge">📼 RECORDED</span>
{/if}
```

**Effort:** 5 minutes  
**Risk:** Low

---

#### 1.2.4 Handle 'ended' Intermediate State

The 'ended' status indicates stream stopped but recording may still be processing. Current badge logic shows nothing for this state.

**Update badge rendering:**
```svelte
{#if isLive()}
    <span class="live-badge">🔴 LIVE</span>
{:else if stream.status === 'completed' && stream.mux?.recordingReady}
    <span class="recorded-badge">📼 RECORDED</span>
{:else if stream.status === 'ended' || (stream.status === 'completed' && !stream.mux?.recordingReady)}
    <span class="processing-badge">⏳ PROCESSING</span>
{/if}
```

**Add CSS for processing badge:**
```css
.processing-badge {
    background: #f59e0b;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-weight: 600;
}
```

**Effort:** 15 minutes  
**Risk:** Low

---

### 1.3 Testing & Validation

#### 1.3.1 Manual Testing Scenarios

| Scenario | Expected Behavior | Steps |
|----------|-------------------|-------|
| Active live stream | Shows in "Live Now" with 🔴 LIVE badge | Start OBS broadcast |
| Stream just ended | Shows in "Service Recording" with ⏳ PROCESSING | Stop OBS broadcast |
| Recording ready | Shows in "Service Recording" with 📼 RECORDED | Wait for Mux asset.ready webhook |
| Multiple streams | Each in correct category, no duplicates | Create 2+ streams |
| Page refresh | Maintains correct state | F5 during each state |

**Effort:** 30 minutes  
**Risk:** N/A

---

#### 1.3.2 Console Log Verification

Check browser console for:
- `[STREAM CATEGORIES]` shows correct counts
- `[RECORDING CATEGORIZED]` appears only for ended/completed streams
- `[MUX PLAYER] Is live:` shows `false` for recordings
- No `[DUPLICATE STREAMS]` warnings

**Effort:** 10 minutes  
**Risk:** N/A

---

#### 1.3.3 Edge Case Testing

| Edge Case | Test Method |
|-----------|-------------|
| Rapid webhook delivery | Simulate quick start/stop |
| Webhook out of order | asset.ready before live_stream.idle |
| Network disconnect during stream | Check reconnection handling |
| Status stuck as 'live' | Manually set in Firestore |

**Effort:** 20 minutes  
**Risk:** N/A

---

### 1.4 Documentation

#### 1.4.1 Update Component Documentation

Update JSDoc comments in:
- `MemorialStreamDisplay.svelte` - Document categorization logic
- `MuxVideoPlayer.svelte` - Document badge determination

**Effort:** 10 minutes  
**Risk:** N/A

---

## Implementation Checklist

### Phase 1: MemorialStreamDisplay Fix
- [ ] 1.1.1 Add mutual exclusion to `recordedStreams`
- [ ] 1.1.2 Add debug logging
- [ ] 1.1.3 Add duplicate detection

### Phase 2: MuxVideoPlayer Fix  
- [ ] 1.2.1 Create `isRecording` derived state
- [ ] 1.2.2 Update `isLive` logic
- [ ] 1.2.3 Update badge template
- [ ] 1.2.4 Add processing badge state

### Phase 3: Validation
- [ ] 1.3.1 Manual testing all scenarios
- [ ] 1.3.2 Console log verification
- [ ] 1.3.3 Edge case testing

### Phase 4: Cleanup
- [ ] 1.4.1 Update documentation
- [ ] Remove excessive debug logging (keep essential)
- [ ] Code review

---

## Estimated Effort

| Phase | Time |
|-------|------|
| 1.1 Stream Categorization | 30 min |
| 1.2 Badge Logic | 35 min |
| 1.3 Testing | 60 min |
| 1.4 Documentation | 10 min |
| **Total** | **~2.25 hours** |

---

## Dependencies

- None (self-contained UI fix)

## Risks

| Risk | Mitigation |
|------|------------|
| Break live stream detection | Comprehensive testing with actual Mux stream |
| Race condition with webhooks | Defensive checks prioritize recordingReady |
| Affect other stream displays | Changes scoped to these two components |

---

## Success Criteria

1. ✅ No LIVE badge on Service Recording section
2. ✅ No duplicate stream appearances
3. ✅ Correct badges for all states (live/processing/recorded)
4. ✅ Console shows no duplicate warnings
5. ✅ All manual test scenarios pass
