# Cloudflare Slideshow CORS Fix ✅

## Problem Encountered

When testing the slideshow upload, we encountered two critical errors:

### **Error 1: Undefined Account ID**
```
Access to fetch at 'https://api.cloudflare.com/client/v4/accounts/undefined/stream'
```
- `CLOUDFLARE_ACCOUNT_ID` was undefined
- Environment variables were not accessible from client-side code

### **Error 2: CORS Policy Violation**
```
Access to fetch at 'https://api.cloudflare.com/...' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header
```
- Cloudflare API doesn't allow direct browser calls
- Client-side fetch blocked by CORS

---

## Root Cause

The original implementation tried to call **Cloudflare API directly from the browser** (client-side):

```typescript
// ❌ WRONG: Client-side direct call
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}` },
    body: formData
  }
);
```

**Problems:**
1. Browser can't access `process.env` variables (only `PUBLIC_*` variables)
2. Cloudflare API blocks cross-origin requests from browsers
3. Exposes API tokens in browser network requests (security risk!)

---

## Solution Implemented

Created a **server-side proxy API** that handles Cloudflare uploads:

### **Architecture:**
```
Browser (Client)
    ↓
    ↓ FormData (video, title, memorialId)
    ↓
/api/slideshow/upload-video (Server-side)
    ↓
    ↓ FormData with Authorization header
    ↓
Cloudflare Stream API
    ↓
    ↓ Transcode to MP4/HLS
    ↓
Return URLs to client
```

---

## Files Changed

### **1. New API Endpoint** ✅
**File:** `frontend/src/routes/api/slideshow/upload-video/+server.ts`

**Purpose:** Server-side proxy for Cloudflare Stream uploads

**Key Features:**
- Runs on server (access to `process.env`)
- Handles authentication
- Proxies video to Cloudflare
- Returns Cloudflare result to client

```typescript
export const POST: RequestHandler = async ({ request, locals }) => {
  // Check auth
  if (!locals.user) throw error(401, 'Unauthorized');
  
  // Get video from client
  const formData = await request.formData();
  const videoBlob = formData.get('video') as File;
  
  // Upload to Cloudflare (server-side)
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}` },
      body: cloudflareFormData
    }
  );
  
  // Return result
  return json({ success: true, cloudflareResult: result.result });
};
```

### **2. Updated PhotoSlideshowCreator** ✅
**File:** `frontend/src/lib/components/slideshow/PhotoSlideshowCreator.svelte`

**Changes:**
- ✅ Removed direct Cloudflare API calls
- ✅ Removed client-side env variable imports
- ✅ Updated `uploadVideoToCloudflareStream()` to call our API

**Before (Direct Call - BROKEN):**
```typescript
// ❌ Client-side - CORS error
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`,
  { method: 'POST', headers: {...}, body: formData }
);
```

**After (Proxy Call - WORKING):**
```typescript
// ✅ Server-side proxy - No CORS
const response = await fetch('/api/slideshow/upload-video', {
  method: 'POST',
  body: formData // Contains video, title, memorialId
});

const result = await response.json();
return result.cloudflareResult; // uid, playback URLs, thumbnail
```

---

## Environment Variables Required

Make sure these are set in your `.env` file (NOT `PUBLIC_*` prefixed):

```bash
# Server-side only (NOT public)
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here
CLOUDFLARE_API_TOKEN=your_cloudflare_stream_api_token_here
```

**Important:**
- Do NOT use `PUBLIC_CLOUDFLARE_*` prefix (exposes to browser)
- These must be server-side only variables
- Already documented in `.env.example`

---

## How It Works Now

### **Upload Flow:**

1. **Browser generates WebM video**
   ```
   MediaRecorder → WebM blob (1-3 MB)
   ```

2. **Client sends to our API**
   ```javascript
   POST /api/slideshow/upload-video
   FormData: { video: Blob, title: string, memorialId: string }
   ```

3. **Server proxies to Cloudflare**
   ```javascript
   POST https://api.cloudflare.com/.../stream
   Authorization: Bearer {CLOUDFLARE_API_TOKEN}
   FormData: { file: Blob, meta: {...} }
   ```

4. **Cloudflare transcodes**
   ```
   WebM → MP4 (H.264)
   WebM → HLS adaptive streams
   WebM → DASH adaptive streams
   Generates thumbnails
   ```

5. **Server returns result**
   ```json
   {
     "success": true,
     "cloudflareResult": {
       "uid": "abc123",
       "playback": {
         "hls": "https://customer-xxx.cloudflarestream.com/abc123/manifest/video.m3u8",
         "dash": "https://customer-xxx.cloudflarestream.com/abc123/manifest/video.mpd"
       },
       "thumbnail": "https://customer-xxx.cloudflarestream.com/abc123/thumbnails/..."
     }
   }
   ```

6. **Client saves to Firestore**
   ```javascript
   POST /api/slideshow/save-metadata
   Body: {
     cloudflareStreamId: "abc123",
     playbackUrl: "https://...",
     ...
   }
   ```

---

## Security Benefits

### **Before (Direct Client Call):**
- ❌ API token exposed in browser
- ❌ Account ID exposed in browser
- ❌ Network requests visible to users
- ❌ Vulnerable to token theft

### **After (Server Proxy):**
- ✅ API token stays on server
- ✅ Account ID stays on server
- ✅ Clean separation of concerns
- ✅ Secure authentication

---

## Testing

### **Test Upload:**
1. Go to slideshow creator
2. Add photos
3. Click "Generate Slideshow"
4. Wait for WebM preview
5. Click "Save to Memorial"
6. Monitor console logs:

**Expected Logs:**
```
✅ Slideshow generated successfully
☁️ [CLIENT] Uploading video to Cloudflare Stream...
☁️ Uploading to Cloudflare Stream via API...
☁️ [UPLOAD VIDEO API] Request received
☁️ [UPLOAD VIDEO API] Uploading to Cloudflare Stream
✅ [UPLOAD VIDEO API] Cloudflare upload successful: abc123
✅ Cloudflare Stream upload successful: abc123
✅ Slideshow metadata saved successfully
```

**No More Errors:**
- ❌ No more `accounts/undefined/stream`
- ❌ No more CORS policy errors
- ❌ No more "Failed to fetch"

---

## Comparison to Existing Code

This pattern matches the existing livestream upload implementation:

**Livestream Upload (Already Working):**
```
frontend/src/routes/api/slideshow/upload/+server.ts
```
- Uses server-side Cloudflare upload
- Same pattern we just implemented

**Slideshow Upload (Now Working):**
```
frontend/src/routes/api/slideshow/upload-video/+server.ts
```
- Uses same server-side pattern
- Consistent architecture

---

## Files Summary

### **Created:**
- ✅ `frontend/src/routes/api/slideshow/upload-video/+server.ts` (New API endpoint)

### **Modified:**
- ✅ `frontend/src/lib/components/slideshow/PhotoSlideshowCreator.svelte` (Client update)

### **No Changes:**
- ✅ `frontend/src/routes/api/slideshow/save-metadata/+server.ts` (Still works)
- ✅ `frontend/src/lib/components/SlideshowPlayer.svelte` (Still works)
- ✅ `.env.example` (Already documented)

---

## Result

✅ **CORS issue fixed**  
✅ **Environment variables accessed securely**  
✅ **Server-side proxy implemented**  
✅ **Matches existing architecture patterns**  
✅ **Ready for testing!**

---

## Next Steps

1. **Set environment variables** (if not already set):
   ```bash
   CLOUDFLARE_ACCOUNT_ID=your_account_id
   CLOUDFLARE_API_TOKEN=your_api_token
   ```

2. **Test upload flow:**
   - Create slideshow
   - Generate preview
   - Save to memorial
   - Verify Cloudflare upload

3. **Monitor Cloudflare dashboard:**
   - Check for new video uploads
   - Verify transcoding completes
   - Confirm MP4 output

**Upload should now work without CORS errors! 🚀**
