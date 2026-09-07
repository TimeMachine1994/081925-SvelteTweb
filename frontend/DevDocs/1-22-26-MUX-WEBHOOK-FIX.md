# Mux Webhook Signature Verification Fix

**Date:** January 22, 2026  
**Issue:** Webhooks returning 401 - signature verification failing  
**Root Cause:** Using outdated Mux SDK API for signature verification

---

## Problem

Mux webhooks were returning `401 Unauthorized` even though `MUX_WEBHOOK_SECRET` was correctly configured.

**Vercel Logs showed:**
```
POST 401 tributestream.com /api/webhooks/mux
❌ [MUX WEBHOOK] Error details: { message: undefined, stack: undefined }
```

---

## Root Cause

The code was using the **old** Mux SDK API:

```typescript
// OLD API (pre-v12) - WRONG
Mux.Webhooks.verifyHeader(body, signature, secret);
```

But `@mux/mux-node` v12+ uses:

```typescript
// NEW API (v12+) - CORRECT
const mux = new Mux({ webhookSecret: secret });
mux.webhooks.verifySignature(body, headers, secret);
```

**Key Differences:**
| Aspect | Old API | New API (v12+) |
|--------|---------|----------------|
| Method | `Mux.Webhooks.verifyHeader` (static) | `mux.webhooks.verifySignature` (instance) |
| Signature param | Just the signature string | Full `Headers` object |
| Return value | Boolean | Throws on invalid |

---

## Files Changed

### 1. `src/lib/server/mux.ts`

Updated `verifyMuxWebhookSignature` function:

```typescript
export function verifyMuxWebhookSignature(
    body: string,
    headers: Headers,  // Changed from signature: string
    secret: string
): boolean {
    try {
        const muxInstance = new Mux({ webhookSecret: secret });
        muxInstance.webhooks.verifySignature(body, headers, secret);
        return true;
    } catch (error: any) {
        console.error('❌ Webhook signature verification failed:', error?.message);
        return false;
    }
}
```

### 2. `src/routes/api/webhooks/mux/+server.ts`

Updated to pass full headers:

```typescript
const body = await request.text();
const headers = request.headers;  // Pass full headers, not just signature

const isValid = verifyMuxWebhookSignature(body, headers, env.MUX_WEBHOOK_SECRET);
```

---

## Expected Behavior After Fix

When OBS streams to Mux:

1. Mux sends `video.live_stream.active` webhook
2. Webhook arrives at `/api/webhooks/mux`
3. ✅ Signature verification passes (200 OK)
4. Firestore `streams/{id}.status` updates to `"live"`
5. Memorial page Firestore listener detects change
6. `MuxVideoPlayer` renders live stream

---

## Testing

1. Deploy changes to production
2. Start OBS stream to Mux RTMP
3. Check Vercel logs for:
   ```
   ✅ [MUX WEBHOOK] Signature verified successfully
   🔔 [MUX WEBHOOK] Event type: video.live_stream.active
   ✅ [MUX WEBHOOK] Stream updated to LIVE
   ```
4. Check Firestore `streams/{id}` has `status: "live"`
5. Verify memorial page shows live video

---

---

# Stream Delete Not Reflecting in UI Fix

**Issue:** Deleting a stream shows "success" but stream remains visible in admin page.

## Root Cause

The delete API uses **soft delete** (`isDeleted: true`) but queries didn't filter deleted streams.

## Files Changed

| File | Change |
|------|--------|
| `src/routes/admin/services/memorials/[memorialId]/+page.server.ts` | Added `.where('isDeleted', '!=', true)` to streams query |
| `src/routes/[fullSlug]/+page.server.ts` | Added `.where('isDeleted', '!=', true)` to streams query |

## Query Fix

```typescript
// Before (shows deleted streams)
adminDb.collection('streams').where('memorialId', '==', memorialId).get()

// After (filters out deleted streams)
adminDb.collection('streams')
    .where('memorialId', '==', memorialId)
    .where('isDeleted', '!=', true)
    .get()
```

---

## Reference

- [Mux SDK Webhook Docs](https://github.com/muxinc/mux-node-sdk#verifying-webhook-signatures)
- SDK Version: `@mux/mux-node@12.8.1`
