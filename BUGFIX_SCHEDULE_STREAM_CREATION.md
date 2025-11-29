# Bugfix: Schedule Stream Creation Error ✅

**Date:** January 8, 2025  
**Issue:** "Failed to create stream: streamingMethod is not defined"  
**Status:** ✅ **FIXED**

---

## Problem Description

When users tried to schedule a livestream from the memorial service calculator page (`/schedule/[memorialId]`), they encountered an error:

```
Failed to create stream: streamingMethod is not defined
```

This prevented the "Save and Pay Later" and payment flows from working correctly.

---

## Root Cause

The stream creation API endpoint (`/api/memorials/[memorialId]/streams`) was attempting to use a `streamingMethod` variable that was **never extracted from the request body**.

### Code Flow

**Schedule Page** → `syncStreamsWithSchedule()` → **Stream Mapper** → **API Endpoint**

The stream mapper (`streamMapper.ts`) creates stream requests with:
- `title`
- `description`
- `scheduledStartTime`
- `calculatorServiceType`
- `calculatorServiceIndex`
- ❌ **No `streamingMethod` field**

The API then tried to use `streamingMethod` without extracting it from the request:

```typescript
// Line 157 - used but never defined!
if (streamingMethod === 'obs') {
  // ...
}
```

---

## Solution

### 1. **Extract streamingMethod from Request Body**

Added `streamingMethod` to the destructured request body:

```typescript
const { 
  title, 
  description, 
  scheduledStartTime,
  streamingMethod,  // ← ADDED THIS
  calculatorServiceType, 
  calculatorServiceIndex,
  serviceHash,
  lastSyncedAt,
  syncStatus
} = requestBody;
```

### 2. **Make Streaming Setup Conditional**

Made the streaming method setup **optional** - only run if `streamingMethod` is provided:

```typescript
// Only setup streaming method if explicitly provided
// Scheduled streams from calculator don't need credentials until armed
if (streamingMethod) {
  try {
    if (streamingMethod === 'obs') {
      // Setup OBS streaming...
    } else if (streamingMethod === 'phone-to-obs') {
      // Setup phone-to-OBS...
    } else if (streamingMethod === 'phone-to-mux') {
      // Setup phone-to-MUX...
    }
    console.log('✅ [STREAMS API] Streaming method configured successfully');
  } catch (error) {
    // Error handling...
  }
} else {
  console.log('ℹ️ [STREAMS API] No streaming method specified - stream will be armed later');
}
```

### 3. **Conditional Method-Specific Fields**

Only add method-specific fields if streaming was actually configured:

```typescript
// Add method-specific fields only if streaming method was configured
if (methodConfig) {
  if (streamingMethod === 'phone-to-obs') {
    streamData.phoneSourceStreamId = methodConfig.phoneSource.cloudflareInputId;
    streamData.phoneSourcePlaybackUrl = methodConfig.phoneSource.playbackUrl;
    streamData.phoneSourceWhipUrl = methodConfig.phoneSource.whipUrl;
  } else if (streamingMethod === 'phone-to-mux') {
    streamData.muxStreamId = methodConfig.mux.streamId;
    streamData.muxStreamKey = methodConfig.mux.streamKey;
    streamData.muxPlaybackId = methodConfig.mux.playbackId;
  }
}
```

---

## Why This Approach?

### **Design Principle: Deferred Arming**

Scheduled streams from the calculator **don't need streaming credentials immediately** because:

1. **Streams are created in advance** - Service might be days/weeks away
2. **Arming happens later** - Admin manually "arms" the stream before go-live
3. **Arming assigns streaming method** - User chooses OBS, phone, or switcher when ready

**Comment in code (line 151):**
```typescript
// For scheduled streams, OBS streaming setup is deferred until the actual start time
// Only immediate live streams need streaming credentials right away
```

### **Two Use Cases**

**Case 1: Calculator (Auto-creation)**
```
Schedule Page → Save → syncStreamsWithSchedule()
                         ↓
                   Creates streams WITHOUT streamingMethod
                         ↓
                   API creates scheduled stream (no credentials)
                         ↓
                   Later: Admin arms stream with chosen method
```

**Case 2: Manual Creation (Stream Management)**
```
Stream Management → Create Stream → Select streaming method
                                          ↓
                                    API creates stream WITH credentials
                                          ↓
                                    Stream ready immediately
```

---

## Impact

### **Before Fix**
❌ Calculator stream creation **failed**  
❌ Users couldn't schedule services  
❌ Payment flow **broken**

### **After Fix**
✅ Calculator stream creation **works**  
✅ Users can schedule services  
✅ Payment flow **functional**  
✅ Manual stream creation **still works**  
✅ Backward compatible with existing flows

---

## Testing

### **Test Case 1: Schedule from Calculator**
1. Navigate to `/schedule/[memorialId]`
2. Fill in service details (date, time, location)
3. Click "Save and Pay Later"
4. **Expected:** Streams created successfully
5. **Result:** ✅ **PASS**

### **Test Case 2: Manual Stream Creation**
1. Navigate to `/memorials/[id]/manage-streams`
2. Click "Create Stream"
3. Select streaming method (OBS/Phone/Switcher)
4. **Expected:** Stream created with credentials
5. **Result:** ✅ **PASS** (not affected by changes)

### **Test Case 3: Stream Arming**
1. Navigate to stream management
2. Find scheduled stream from calculator
3. Click "Arm" button
4. **Expected:** Streaming credentials generated
5. **Result:** ✅ **PASS** (handled by arming API)

---

## Files Modified

**File:** `frontend/src/routes/api/memorials/[memorialId]/streams/+server.ts`

**Changes:**
- Line 118: Added `streamingMethod` to request body extraction
- Line 156: Added `methodConfig` variable declaration
- Lines 160-200: Wrapped streaming setup in conditional block
- Lines 236-250: Made method-specific fields conditional

**Total:** ~10 lines changed/added

---

## Related Documentation

- **Stream Management:** `/memorials/[id]/manage-streams`
- **Stream Arming:** Phase 5 of switcher integration (see `SWITCHER_PHASE_6_COMPLETE.md`)
- **Calculator Integration:** `streamMapper.ts` utility
- **Stream Types:** OBS, Phone-to-OBS, Phone-to-MUX, Switcher

---

## Future Considerations

### **Potential Enhancements**

**1. Default Streaming Method**
```typescript
const streamingMethod = requestBody.streamingMethod || 'switcher'; // Default
```
- Provides automatic method selection
- Simplifies calculator integration

**2. Validation Warning**
```typescript
if (scheduledStartTime && streamingMethod) {
  console.warn('⚠️ Streaming method provided for scheduled stream - will be overridden on arming');
}
```
- Alerts to potential misconfiguration
- Prevents confusion

**3. Stream Templates**
```typescript
const templates = {
  'funeral-service': { streamingMethod: 'switcher', duration: 120 },
  'memorial-service': { streamingMethod: 'obs', duration: 90 }
};
```
- Predefined configurations
- Faster setup for common scenarios

---

## Conclusion

The fix maintains the **deferred arming** design while making the API **backward compatible** with both manual and automated stream creation flows. Scheduled streams are created without credentials, which are then assigned during the arming process when the admin chooses their preferred streaming method.

**Key Benefit:** Calculator users can now successfully schedule services, while stream management users retain full control over streaming method selection.
