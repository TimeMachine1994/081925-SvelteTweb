# Phone to MUX Firestore Error Fix

## Date
November 5, 2025

## Issue Description
When clicking the **Phone to MUX** button in the NewStreamCard component, the stream creation fails with:

```
❌ Failed to create stream: Value for argument "data" is not a valid Firestore document. 
Cannot use "undefined" as a Firestore value (found in field "restreamingEnabled"). 
If you want to ignore undefined values, enable `ignoreUndefinedProperties`.
```

## Root Cause Analysis

### Problem 1: Missing Field in methodConfig
**Location**: `frontend/src/routes/api/memorials/[memorialId]/streams/+server.ts` Line ~188

When setting up the phone-to-mux streaming method, the `restreamingConfigured` field from the setup function was not being copied into the `methodConfig` object.

```typescript
// ❌ BEFORE: Missing restreamingConfigured
methodConfig = {
    type: 'phone-to-mux',
    cloudflare: config.cloudflare,
    mux: config.mux
};
```

The `setupPhoneToMUXMethod()` function in `streaming-methods.ts` returns `restreamingConfigured: true` (line 167), but this value wasn't being transferred to `methodConfig`.

### Problem 2: Unsafe Firestore Value Assignment
**Location**: `frontend/src/routes/api/memorials/[memorialId]/streams/+server.ts` Line ~244

The code was directly assigning `methodConfig.restreamingConfigured` to `streamData.restreamingEnabled` without checking if it's undefined:

```typescript
// ❌ BEFORE: Direct assignment (could be undefined)
streamData.restreamingEnabled = methodConfig.restreamingConfigured;
```

Since `methodConfig.restreamingConfigured` was undefined (due to Problem 1), Firestore rejected the document.

## Solution Implementation

### Fix 1: Include restreamingConfigured in methodConfig
**File**: `frontend/src/routes/api/memorials/[memorialId]/streams/+server.ts`
**Lines**: ~180-190

```typescript
} else if (streamingMethod === 'phone-to-mux') {
    // Phone to MUX Method: Phone + restreaming
    const config = await setupPhoneToMUXMethod();
    cloudflareInputId = config.cloudflare.inputId;
    methodConfig = {
        type: 'phone-to-mux',
        cloudflare: config.cloudflare,
        mux: config.mux,
        restreamingConfigured: config.restreamingConfigured  // ✅ ADDED
    };
}
```

### Fix 2: Add Safety Check for Firestore
**File**: `frontend/src/routes/api/memorials/[memorialId]/streams/+server.ts`
**Lines**: ~240-248

```typescript
} else if (streamingMethod === 'phone-to-mux') {
    streamData.muxStreamId = methodConfig.mux.streamId;
    streamData.muxStreamKey = methodConfig.mux.streamKey;
    streamData.muxPlaybackId = methodConfig.mux.playbackId;
    // Only add restreamingEnabled if it has a value (avoid undefined for Firestore)
    if (methodConfig.restreamingConfigured !== undefined) {  // ✅ ADDED SAFETY CHECK
        streamData.restreamingEnabled = methodConfig.restreamingConfigured;
    }
}
```

## Files Modified
1. `frontend/src/routes/api/memorials/[memorialId]/streams/+server.ts`
   - Line ~188: Added `restreamingConfigured` to methodConfig
   - Lines ~244-247: Added undefined check before Firestore assignment

## Testing Checklist
- [ ] Click Phone to MUX button in NewStreamCard
- [ ] Verify stream creates successfully
- [ ] Check Firestore document has `restreamingEnabled: true` field
- [ ] Verify no console errors
- [ ] Test with MUX credentials configured
- [ ] Test error handling when MUX not configured

## Related Components
- `NewStreamCard.svelte` - UI component with 3 streaming method buttons
- `streaming-methods.ts` - Server-side setup functions for each method
- `setupPhoneToMUXMethod()` - Returns config with `restreamingConfigured: true`

## Expected Behavior After Fix
1. User clicks "Phone to MUX" button
2. API calls `setupPhoneToMUXMethod()` which creates:
   - MUX live stream for recording
   - Cloudflare input with restreaming outputs to MUX
3. `methodConfig` properly includes `restreamingConfigured: true`
4. Stream document saved to Firestore with `restreamingEnabled: true`
5. Success response returned to client
6. Page reloads showing new stream

## Notes
- This fix follows the same pattern used for other optional fields (lines 216-233)
- The safety check prevents future similar issues with undefined values
- Firestore requires all fields to have defined values or be excluded entirely

---

## Implementation Status
- [x] Markdown documentation created 
- [x] Changes implemented 
- [ ] Changes tested (ready for testing)
- [ ] Documentation updated with test results

## Code Changes Applied

### Change 1: methodConfig Assignment (Line 185-190)
```typescript
methodConfig = {
    type: 'phone-to-mux',
    cloudflare: config.cloudflare,
    mux: config.mux,
    restreamingConfigured: config.restreamingConfigured  // ✅ ADDED
};
```

### Change 2: Firestore Data Assignment (Lines 241-249)
```typescript
} else if (streamingMethod === 'phone-to-mux') {
    streamData.muxStreamId = methodConfig.mux.streamId;
    streamData.muxStreamKey = methodConfig.mux.streamKey;
    streamData.muxPlaybackId = methodConfig.mux.playbackId;  // ✅ ADDED
    // Only add restreamingEnabled if it has a value (avoid undefined for Firestore)
    if (methodConfig.restreamingConfigured !== undefined) {  // ✅ ADDED SAFETY CHECK
        streamData.restreamingEnabled = methodConfig.restreamingConfigured;
    }
}
```

## Next Steps
1. Test Phone to MUX button in NewStreamCard component
2. Verify stream creation completes without Firestore errors
3. Check Firestore console to confirm `restreamingEnabled` field is properly set
4. Update this document with test results

---

## Summary

The **Phone to MUX Firestore error has been fixed** with two key changes:

1. **Included `restreamingConfigured` in methodConfig object** - This ensures the value from `setupPhoneToMUXMethod()` is properly transferred
2. **Added undefined safety check** - Prevents Firestore from receiving undefined values

The fix follows the established pattern for optional fields in the codebase and ensures Firestore compatibility. The Phone to MUX streaming method should now create streams successfully without errors.

**Status**: ✅ Ready for testing
