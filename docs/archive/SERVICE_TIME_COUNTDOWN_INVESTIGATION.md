# Service Time Not Showing in Countdown Player - Investigation 🔍

## ✅ Clarification - What SHOULD Happen

The user clarified: The service start time should appear in the **CountdownVideoPlayer** (the mock video player component), NOT as a separate schedule section.

## 📊 Expected Flow

```
1. User fills out calculator/schedule form
   - Enters: Date, Time, Location for service
   ↓
2. User clicks "Save and Pay Later" or "Book Now"
   - Saves services data to Firestore
   - Triggers syncStreamsWithSchedule()
   ↓
3. syncStreamsWithSchedule() creates/updates streams
   - Main service → creates Stream with scheduledStartTime
   - scheduledStartTime = ISO string from services.main.time.date + time
   ↓
4. Memorial page loads
   - Loads streams from Firestore
   - MemorialStreamDisplay categorizes streams
   ↓
5. CountdownVideoPlayer displays for scheduled streams
   - Shows date: "Monday, December 25, 2025"
   - Shows time: "2:00 PM PST"
   - Mock video player with schedule overlay
```

## 🎯 The Components Involved

### 1. Schedule Page (`/schedule/[memorialId]`)
**Responsibility**: Save service data and sync streams

```typescript
// Line 438 in +page.svelte
const streamResults = await syncStreamsWithSchedule(memorialId, streamSyncData);
```

**Data passed**:
```typescript
{
  services: {
    main: {
      location: { name: "Smith Funeral Home", address: "..." },
      time: { date: "2025-12-25", time: "14:00", isUnknown: false },
      hours: 2
    },
    additional: [...]
  },
  calculatorData: {...},
  memorialName: "John Doe"
}
```

### 2. streamMapper.ts (`syncStreamsWithSchedule`)
**Responsibility**: Convert services data → stream objects

```typescript
// Lines 142-149
let scheduledStartTime: string | undefined;
if (time?.date && time?.time) {
  scheduledStartTime = new Date(`${time.date}T${time.time}`).toISOString();
  console.log('✅ [STREAM_MAPPER] Scheduled start time created:', scheduledStartTime);
} else {
  console.log('ℹ️ [STREAM_MAPPER] No date/time provided, creating unscheduled stream');
}
```

**Creates stream with**:
```typescript
{
  title: "Location 1 Service",
  description: "Memorial service at Location 1",
  scheduledStartTime: "2025-12-25T14:00:00.000Z",
  calculatorServiceType: 'main',
  calculatorServiceIndex: null
}
```

### 3. Memorial Page (`/[fullSlug]`)
**Responsibility**: Load and display streams

Loads streams via `+page.server.ts`:
```typescript
const streamsSnapshot = await adminDb
  .collection('streams')
  .where('memorialId', '==', memorial.id)
  .get();
```

Passes to MemorialStreamDisplay component.

### 4. MemorialStreamDisplay.svelte
**Responsibility**: Categorize and display streams

**Scheduled Stream Detection** (Lines 171-192):
```typescript
let scheduledStreams = $derived(
  liveStreams.filter(s => {
    if (s.isVisible === false) return false;
    
    // If already in live streams, don't show in scheduled
    const isInLiveStreams = categorizedLiveStreams.some(live => live.id === s.id);
    if (isInLiveStreams) return false;
    
    // Must have a future scheduled time
    if (s.scheduledStartTime) {
      const scheduledTime = new Date(s.scheduledStartTime).getTime();
      const now = currentTime.getTime();
      
      // Only show as scheduled if it's in the FUTURE
      if (scheduledTime > now && (s.status === 'scheduled' || s.status === 'ready')) {
        return true;
      }
    }
    
    return false;
  })
);
```

**Display Logic** (Lines 288-295):
```svelte
{#if stream.scheduledStartTime}
  <CountdownVideoPlayer
    scheduledStartTime={stream.scheduledStartTime}
    streamTitle={stream.title}
    streamDescription={stream.description}
    theme="memorial"
    {currentTime}
  />
{:else}
  <!-- Fallback: "Service scheduled - time to be announced" -->
{/if}
```

### 5. CountdownVideoPlayer.svelte
**Responsibility**: Display mock player with schedule

**Displays** (Lines 74-86):
```svelte
<div class="schedule-display">
  <div class="schedule-header">
    <Clock class="schedule-icon" />
    <h3 class="schedule-title">Scheduled Service</h3>
  </div>
  <div class="schedule-info">
    <div class="schedule-date">
      <span class="date-value">{formatDate(scheduledStartTime)}</span>
    </div>
    <div class="schedule-time">
      <span class="time-value">{formatTime(scheduledStartTime)}</span>
    </div>
  </div>
</div>
```

**Result**: Mock video player showing service date/time overlay

---

## 🐛 Possible Issues

### Issue 1: Streams Not Being Created
**Symptom**: No streams exist for the memorial  
**Cause**: `syncStreamsWithSchedule()` failing or not being called  
**Check**:
- Console logs for "🎬 [STREAM_MAPPER]"
- Firestore `streams` collection for memorial
- Check if "Save and Pay Later" triggers the sync

### Issue 2: Streams Exist But No `scheduledStartTime`
**Symptom**: Streams exist but show "time to be announced"  
**Cause**: Stream created without date/time OR time.isUnknown = true  
**Check**:
- Stream document in Firestore has `scheduledStartTime` field
- `services.main.time.date` and `.time` are set
- `services.main.time.isUnknown` is false

### Issue 3: Scheduled Time in the Past
**Symptom**: Stream exists with time, but doesn't show  
**Cause**: MemorialStreamDisplay only shows future scheduled times  
**Check**: 
- Is the scheduled time in the future?
- Check line 185: `if (scheduledTime > now...)`

### Issue 4: Stream Status Wrong
**Symptom**: Stream exists with time, but wrong status  
**Cause**: Stream status isn't 'scheduled' or 'ready'  
**Check**:
- Stream.status in Firestore
- Should be 'scheduled' or 'ready', not 'completed' or other

---

## 🔍 Debugging Checklist

### Step 1: Check if Service Data is Saving
1. Go to `/schedule/[memorialId]`
2. Fill in main service: Date + Time + Location
3. Click "Save and Pay Later"
4. Open Firestore console
5. Check `memorials/[id]/services/main/time`
6. **Expected**: `{ date: "2025-12-25", time: "14:00", isUnknown: false }`

### Step 2: Check if syncStreamsWithSchedule is Called
1. Open browser console (F12)
2. Fill schedule and click "Save and Pay Later"
3. Look for console logs:
   ```
   🎬 [SCHEDULE] Syncing streams with schedule data...
   🔄 [STREAM_MAPPER] Processing schedule data: ...
   ✅ [STREAM_MAPPER] Scheduled start time created: 2025-12-25T14:00:00.000Z
   ```

### Step 3: Check if Stream was Created in Firestore
1. Open Firestore console
2. Navigate to `streams` collection
3. Filter by `memorialId == [your memorial id]`
4. Check for stream document
5. **Expected Fields**:
   ```
   {
     title: "Location 1 Service",
     memorialId: "...",
     scheduledStartTime: "2025-12-25T14:00:00.000Z",
     status: "scheduled",
     calculatorServiceType: "main",
     calculatorServiceIndex: null
   }
   ```

### Step 4: Check Memorial Page Load
1. Visit memorial page `/{fullSlug}`
2. Open browser console
3. Look for:
   ```
   🎬 [MEMORIAL_PAGE] Loaded X streams after filtering
   ```
4. Check if stream is loaded and visible

### Step 5: Check MemorialStreamDisplay Categorization
1. On memorial page, add console.log in browser DevTools:
   ```javascript
   // In browser console, check streams data
   console.log(data.streams);
   ```
2. Check if stream has `scheduledStartTime`
3. Check if time is in the future
4. Check if status is 'scheduled' or 'ready'

---

## 🎯 Most Likely Issues

Based on the code analysis, here are the most probable issues:

### #1 - Streams Not Being Synced on Save
**Probability**: HIGH

**Evidence**:
- syncStreamsWithSchedule is called (line 438)
- But it's inside a try-catch that doesn't block save
- If sync fails, user wouldn't know

**Fix**: Check console logs for sync errors

### #2 - Time Already Passed
**Probability**: MEDIUM

**Evidence**:
- If testing with a past date, stream won't show as "scheduled"
- Line 185: `if (scheduledTime > now...)`

**Fix**: Use future date/time when testing

### #3 - Time Fields Not Set Correctly
**Probability**: MEDIUM

**Evidence**:
- If `time.isUnknown = true`, stream creates without scheduledStartTime
- If `time.date` or `time.time` missing, no scheduledStartTime

**Fix**: Ensure both date and time are filled, isUnknown = false

---

## 🔧 Next Steps for Investigation

1. **Add More Logging**: Add console.logs to track the full flow:
   ```typescript
   // In schedule page after sync
   console.log('📊 [DEBUG] Sync result:', streamResults);
   
   // In streamMapper after stream creation
   console.log('📊 [DEBUG] Stream created with scheduledStartTime:', scheduledStartTime);
   
   // In memorial page after load
   console.log('📊 [DEBUG] Streams loaded:', streams.map(s => ({
     id: s.id,
     title: s.title,
     scheduledStartTime: s.scheduledStartTime,
     status: s.status
   })));
   ```

2. **Manual Firestore Check**: Verify the data exists in database:
   - Check memorial document has services.main.time
   - Check streams collection has stream with scheduledStartTime
   - Verify stream.memorialId matches memorial.id

3. **Test with Future Date**: Ensure testing with future date/time:
   - Tomorrow's date
   - Time a few hours in future
   - Verify time isn't accidentally in past due to timezone

4. **Check Stream Status**: Verify stream status is correct:
   - Should be 'scheduled' or 'ready'
   - Not 'completed', 'live', or other status

---

## 📝 Summary

**What Should Happen**:
The CountdownVideoPlayer component (mock video player with lens flare) should display the service date/time in its overlay when a stream with `scheduledStartTime` exists.

**What Component Displays It**:
- MemorialStreamDisplay.svelte (line 289)
- Renders CountdownVideoPlayer for scheduled streams
- CountdownVideoPlayer shows date/time in video overlay

**Most Likely Issue**:
Streams aren't being created with `scheduledStartTime` field, OR the scheduled time is in the past so the stream isn't categorized as "scheduled".

**Immediate Action**:
Check browser console logs when clicking "Save and Pay Later" to see if stream sync is happening and if streams are being created with scheduledStartTime.
