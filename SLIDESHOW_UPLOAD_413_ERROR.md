# Slideshow Upload 413 Error - Payload Too Large ⚠️

## Problem

Getting **413 Payload Too Large** error when uploading slideshow videos to Cloudflare Stream via the server-side proxy API.

```
/api/slideshow/upload-video: Failed to load resource: the server responded with a status of 413
```

---

## Root Cause

**Vercel Serverless Functions have a hard limit of 4.5MB for request bodies.**

This means any video larger than 4.5MB will fail when uploading through our server-side proxy endpoint (`/api/slideshow/upload-video`).

### Why We Created the Proxy:
- Originally needed to avoid CORS errors
- Needed to hide Cloudflare API credentials from client
- Centralized upload logic

---

## Solutions

### **Option 1: Direct Client Upload with Signed URL** ⭐ (RECOMMENDED)

Instead of proxying through the server, generate a signed upload URL on the server and let the client upload directly to Cloudflare.

**Benefits:**
- ✅ No file size limits
- ✅ Faster uploads (no server hop)
- ✅ Better for large files
- ✅ Reduces server load

**How it works:**
1. Client requests signed upload URL from server
2. Server generates signed URL using Cloudflare API
3. Client uploads directly to Cloudflare using signed URL
4. Client notifies server when upload completes

**Implementation:**
```typescript
// NEW API: /api/slideshow/get-upload-url
export const POST: RequestHandler = async ({ request, locals }) => {
  // Authenticate user
  if (!locals.user) return error(401, 'Unauthorized');
  
  // Get upload metadata
  const { title, memorialId } = await request.json();
  
  // Generate signed upload URL from Cloudflare
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        maxDurationSeconds: 3600,
        meta: {
          type: 'memorial-slideshow',
          memorialId,
          uploadedBy: locals.user.uid
        }
      })
    }
  );
  
  const result = await response.json();
  
  return json({
    uploadURL: result.result.uploadURL,
    uid: result.result.uid
  });
};

// CLIENT: Upload directly to Cloudflare
async function uploadVideoToCloudflareStream(videoBlob: Blob, title: string) {
  // Step 1: Get signed upload URL from server
  const urlResponse = await fetch('/api/slideshow/get-upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, memorialId })
  });
  
  const { uploadURL, uid } = await urlResponse.json();
  
  // Step 2: Upload directly to Cloudflare using signed URL
  const formData = new FormData();
  formData.append('file', videoBlob);
  
  const uploadResponse = await fetch(uploadURL, {
    method: 'POST',
    body: formData
  });
  
  if (!uploadResponse.ok) {
    throw new Error('Upload failed');
  }
  
  // Step 3: Return Cloudflare video UID
  return { uid };
}
```

---

### **Option 2: Use Vercel Edge Functions**

Edge Functions can handle streaming and larger payloads, but have limitations with Node.js APIs (like Firebase Admin SDK).

**Challenges:**
- Edge runtime doesn't support all Node.js APIs
- Firebase Admin SDK might not work
- Authentication needs to be handled differently

**Status:** Attempted in `+server.ts` with `export const config = { runtime: 'edge' }`

---

### **Option 3: Chunked Upload**

Break large videos into smaller chunks and upload them sequentially.

**Challenges:**
- Complex implementation
- Multiple HTTP requests
- Cloudflare Stream doesn't natively support chunked uploads
- Would need to reassemble on server

**Not Recommended:** Too complex for this use case.

---

### **Option 4: External Upload Service**

Use a dedicated file upload service like:
- AWS S3 with multipart upload
- Cloudflare R2
- UploadThing
- Uppy

**Challenges:**
- Additional service to manage
- More complexity
- We already have Cloudflare Stream

---

## Current Configuration

### **Files Modified:**

1. **`svelte.config.js`** - Using Vercel adapter
2. **`vercel.json`** - Added function configuration
3. **`upload-video/+server.ts`** - Added edge runtime config

### **Current Limits:**

| Environment | Body Size Limit |
|-------------|----------------|
| Vercel Serverless | 4.5MB (hard limit) |
| Vercel Edge | No fixed limit, but streaming |
| Cloudflare Direct | 30GB max |

---

## Recommended Next Steps

### **Implement Option 1: Direct Upload with Signed URL** ⭐

1. **Create new endpoint:** `/api/slideshow/get-upload-url`
2. **Generate Cloudflare Direct Upload URL**
3. **Update client to upload directly**
4. **Keep metadata API unchanged**

### **Implementation Plan:**

```
Phase 1: Create get-upload-url API ✅
  └─ Authenticate user
  └─ Generate signed Cloudflare URL
  └─ Return upload URL + video UID

Phase 2: Update PhotoSlideshowCreator ✅
  └─ Call get-upload-url API
  └─ Upload directly to Cloudflare
  └─ Continue with save-metadata as before

Phase 3: Remove upload-video proxy ✅
  └─ Delete /api/slideshow/upload-video
  └─ Clean up unused code
```

---

## Testing Strategy

### **Test File Sizes:**

1. ✅ **< 4.5MB:** Should work with current proxy
2. ❌ **> 4.5MB:** Fails with 413 error
3. ✅ **With signed URL:** Should work for any size up to 30GB

### **Test Scenarios:**

- 10MB video (typical slideshow)
- 50MB video (high quality)
- 100MB+ video (very long slideshow)

---

## Cloudflare Direct Upload API

### **Documentation:**
https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/

### **Generate Upload URL:**
```bash
curl -X POST \
  https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/stream/direct_upload \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maxDurationSeconds": 3600,
    "meta": {
      "type": "memorial-slideshow"
    }
  }'
```

### **Response:**
```json
{
  "result": {
    "uploadURL": "https://upload.cloudflarestream.com/...",
    "uid": "abc123..."
  },
  "success": true
}
```

### **Client Upload:**
```javascript
const formData = new FormData();
formData.append('file', videoBlob);

await fetch(uploadURL, {
  method: 'POST',
  body: formData
});
```

---

## Benefits of Direct Upload

### **Performance:**
- ✅ **Faster:** No server proxy hop
- ✅ **No size limits:** Can upload up to 30GB
- ✅ **Progress tracking:** Client-side upload progress
- ✅ **Resumable:** Can implement retry logic

### **Cost:**
- ✅ **Lower bandwidth:** No data through your server
- ✅ **Reduced server load:** Server only generates URLs

### **Security:**
- ✅ **Secure:** Signed URLs expire after use
- ✅ **Authenticated:** Server validates user before generating URL
- ✅ **No API keys exposed:** Credentials stay on server

---

## Migration Path

### **Backward Compatibility:**

Keep the old proxy endpoint for small files (<4MB) and use direct upload for larger files:

```typescript
async function uploadVideo(videoBlob: Blob) {
  if (videoBlob.size < 4 * 1024 * 1024) {
    // Use proxy for small files (< 4MB)
    return await uploadViaProxy(videoBlob);
  } else {
    // Use direct upload for large files
    return await uploadViaSigned URL(videoBlob);
  }
}
```

---

## Temporary Workaround

### **For Development:**

If you need to test immediately, reduce video quality/size to stay under 4.5MB:

```javascript
// In PhotoSlideshowCreator.svelte
const canvas = document.createElement('canvas');
canvas.width = 1280; // Reduce from 1920
canvas.height = 720; // Reduce from 1080

const stream = canvas.captureStream();
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp8',
  videoBitsPerSecond: 1000000 // Reduce from 2500000
});
```

---

## Production Recommendation

**Use Direct Upload (Option 1)** for production deployment:

- ✅ No file size limits
- ✅ Better performance
- ✅ Industry standard approach
- ✅ Aligns with Cloudflare best practices

---

## Summary

**Problem:** 413 error for videos > 4.5MB  
**Cause:** Vercel serverless function body size limit  
**Solution:** Implement Cloudflare Direct Upload with signed URLs  
**Priority:** High (blocks production use for most videos)  
**Effort:** ~2 hours to implement

---

**Next: Implement `/api/slideshow/get-upload-url` endpoint** 🚀
