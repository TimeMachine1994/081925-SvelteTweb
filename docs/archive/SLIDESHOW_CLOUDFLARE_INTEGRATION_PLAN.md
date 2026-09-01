# Slideshow Cloudflare Integration Plan

## Overview
Implement a two-phase slideshow workflow where users generate WebM previews locally in the browser, then upload to Cloudflare Stream for transcoding to MP4/HLS for production use.

## Current State
- ✅ Slideshows generate WebM videos locally using MediaRecorder API
- ✅ Videos upload directly to Firebase Storage
- ❌ No Cloudflare Stream integration for slideshows
- ❌ Users get WebM files (limited compatibility)
- ❌ No adaptive streaming or optimized delivery

## Desired State
- ✅ Local WebM preview generation (fast, no upload)
- ✅ Upload WebM to Cloudflare Stream when user saves
- ✅ Cloudflare transcodes to MP4/HLS automatically
- ✅ Memorial pages embed Cloudflare MP4 streams only
- ✅ Download button provides MP4 format from Cloudflare
- ✅ Adaptive streaming for better performance
- ✅ No Firebase Storage for videos (photos only)

---

## User Flow

### Phase 1: Preview (Browser-Only, No Upload)
1. User adds photos to slideshow creator
2. User clicks **"Generate Slideshow"**
3. Browser generates **WebM video** using MediaRecorder
4. Video preview displays in browser
5. User can watch/edit before committing

**Benefits:**
- Fast preview generation
- No bandwidth/storage cost for previews
- Iterate quickly without uploads

### Phase 2: Production (Upload to Cloudflare)
6. User clicks **"Save to Memorial"** or **"Upload & Publish"**
7. WebM file uploads to Cloudflare Stream API
8. Cloudflare transcodes to:
   - MP4 with H.264 codec
   - Multiple resolutions (360p, 720p, 1080p)
   - HLS/DASH adaptive streaming
9. Cloudflare returns:
   - `playback.hls` - HLS stream URL
   - `playback.dash` - DASH stream URL
   - `thumbnail` - Video thumbnail
   - `preview` - Preview URL
   - `uid` - Cloudflare Stream video ID
10. Save slideshow metadata to Firestore with Cloudflare URLs

### Phase 3: Display & Download
11. Memorial page embeds **Cloudflare MP4 stream** (not WebM)
12. Visitors get adaptive streaming (best quality for their device)
13. Download button provides **MP4 from Cloudflare**
14. Photos still stored in Firebase Storage for editing

---

## Technical Implementation

### Components to Modify

#### 1. **PhotoSlideshowCreator.svelte**
**Location:** `frontend/src/lib/components/slideshow/PhotoSlideshowCreator.svelte`

**Changes:**
- Keep existing WebM generation for preview
- Remove direct Firebase Storage video upload
- Add Cloudflare Stream upload on "Save to Memorial"
- Update UI to show:
  - "Generate Preview" (WebM, local)
  - "Upload & Publish" (Cloudflare, production)
- Store Cloudflare Stream URLs in Firestore

**New Functions:**
```typescript
async function uploadToCloudflareStream(videoBlob: Blob): Promise<CloudflareStreamResult>
async function saveToMemorialWithCloudflare()
```

#### 2. **API Endpoint: `/api/slideshow/save-metadata`**
**Location:** `frontend/src/routes/api/slideshow/save-metadata/+server.ts`

**Changes:**
- Accept Cloudflare Stream video URL instead of Firebase Storage URL
- Store Cloudflare playback URLs in Firestore
- Keep photos in Firebase Storage (for editing)

**Updated Schema:**
```typescript
{
  videoUrl: string;              // Cloudflare HLS URL
  cloudflareStreamId: string;    // Cloudflare video UID
  cloudflarePlaybackUrl: string; // Direct MP4 playback
  thumbnailUrl: string;          // Cloudflare thumbnail
}
```

#### 3. **SlideshowSection.svelte** (Display)
**Location:** `frontend/src/lib/components/SlideshowSection.svelte`

**Changes:**
- Use Cloudflare playback URL exclusively
- Use `<video>` tag with Cloudflare MP4 source
- Add download button for Cloudflare MP4

**Updated Props:**
```typescript
interface MemorialSlideshow {
  playbackUrl: string;            // Cloudflare HLS URL
  cloudflarePlaybackUrl: string;  // Cloudflare direct MP4
  cloudflareStreamId: string;     // For download/API calls
  thumbnailUrl: string;           // Cloudflare thumbnail
}
```

#### 4. **SlideshowPlayer.svelte** (if exists)
**Location:** `frontend/src/lib/components/SlideshowPlayer.svelte`

**Changes:**
- Use Cloudflare playback URL exclusively
- Add download handler for Cloudflare MP4

#### 5. **Cloudflare Stream API Helper**
**Location:** `frontend/src/lib/server/cloudflare-stream.ts` (already exists for livestreams)

**New Functions:**
```typescript
export async function uploadSlideshowToCloudflare(
  videoBlob: Blob,
  title: string,
  memorialId: string
): Promise<CloudflareStreamResult>

export async function getCloudflareStreamDownloadUrl(
  streamId: string
): Promise<string>
```

---

## Implementation Steps

### Step 1: Update PhotoSlideshowCreator Component
- [x] Keep WebM preview generation (no changes)
- [ ] Remove direct Firebase video upload
- [ ] Add Cloudflare Stream upload function
- [ ] Update "Save to Memorial" button handler
- [ ] Show upload progress for Cloudflare

### Step 2: Create/Update Cloudflare API Functions
- [ ] Add `uploadSlideshowToCloudflare()` to server helper
- [ ] Add `getCloudflareStreamInfo()` for download URLs
- [ ] Handle Cloudflare API errors gracefully

### Step 3: Update Save Metadata API
- [ ] Accept Cloudflare Stream URLs
- [ ] Store Cloudflare video ID in Firestore
- [ ] Keep Firebase photo URLs for editing
- [ ] Update slideshow schema

### Step 4: Update Display Components
- [ ] Modify SlideshowSection to use Cloudflare URLs
- [ ] Add fallback to Firebase if Cloudflare fails
- [ ] Update video player with Cloudflare source

### Step 5: Add Download Functionality
- [ ] Add download button to slideshow player
- [ ] Fetch MP4 from Cloudflare Stream
- [ ] Provide proper filename (e.g., `memorial-slideshow.mp4`)

### Step 6: Testing
- [ ] Test WebM preview generation
- [ ] Test Cloudflare upload
- [ ] Verify transcoding completes
- [ ] Test MP4 playback on memorial page
- [ ] Test download functionality
- [ ] Test fallback to Firebase if Cloudflare unavailable

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: PREVIEW (Browser Only)                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User adds photos                                               │
│       ↓                                                          │
│  Click "Generate Slideshow"                                     │
│       ↓                                                          │
│  MediaRecorder creates WebM (browser)                           │
│       ↓                                                          │
│  WebM preview displays                                          │
│       ↓                                                          │
│  User watches/edits                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: PRODUCTION (Upload & Transcode)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Click "Save to Memorial"                                       │
│       ↓                                                          │
│  Upload WebM to Cloudflare Stream API                           │
│       ↓                                                          │
│  Cloudflare transcodes:                                         │
│    - MP4 (H.264)                                                │
│    - Multiple resolutions                                       │
│    - HLS/DASH adaptive streams                                  │
│       ↓                                                          │
│  Cloudflare returns:                                            │
│    - playback.hls URL                                           │
│    - playback.dash URL                                          │
│    - thumbnail URL                                              │
│    - Stream UID                                                 │
│       ↓                                                          │
│  Save to Firestore:                                             │
│    {                                                            │
│      cloudflareStreamId: "abc123",                              │
│      playbackUrl: "https://customer-xxx.cloudflarestream.com",  │
│      thumbnailUrl: "...",                                       │
│      photos: [Firebase Storage URLs]                            │
│    }                                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: DISPLAY & DOWNLOAD                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Memorial page loads                                            │
│       ↓                                                          │
│  Fetch slideshow from Firestore                                 │
│       ↓                                                          │
│  Embed Cloudflare MP4 stream                                    │
│       ↓                                                          │
│  Visitors watch adaptive stream                                 │
│                                                                  │
│  Download button clicked                                        │
│       ↓                                                          │
│  Fetch MP4 from Cloudflare                                      │
│       ↓                                                          │
│  User downloads memorial-slideshow.mp4                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Firestore Schema Changes

### Before (Current)
```typescript
{
  id: string;
  title: string;
  firebaseStorageUrl: string;  // WebM file
  photos: Array<{
    url: string;               // Firebase Storage
    caption: string;
    duration: number;
  }>;
  settings: {...};
  status: 'ready' | 'processing';
}
```

### After (Cloudflare Only)
```typescript
{
  id: string;
  title: string;
  
  // Cloudflare Stream URLs
  cloudflareStreamId: string;        // e.g., "abc123def456"
  playbackUrl: string;               // HLS URL
  cloudflarePlaybackUrl: string;     // Direct MP4 URL
  thumbnailUrl: string;              // Cloudflare thumbnail
  
  // Photos (Firebase Storage for editing)
  photos: Array<{
    url: string;                     // Firebase Storage
    storagePath: string;
    caption: string;
    duration: number;
  }>;
  
  settings: {...};
  status: 'processing' | 'ready' | 'error';
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  memorialId: string;
}
```

---

## Environment Variables Required

```bash
# Already exists for livestreams
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

---

## Benefits of This Approach

### 1. **Better User Experience**
- Fast preview generation (no upload wait)
- Iterate quickly on slideshows
- Professional MP4 output

### 2. **Better Compatibility**
- MP4 works everywhere (iOS, Android, all browsers)
- Adaptive streaming for slow connections
- Better mobile device support

### 3. **Cost Efficiency**
- No storage costs for preview iterations
- Cloudflare CDN delivery (faster, cheaper)
- Only pay for finalized videos

### 4. **Performance**
- Adaptive bitrate streaming
- Multiple quality levels
- CDN edge delivery

### 5. **Professional Features**
- Thumbnail generation
- Video analytics (optional)
- DRM support (if needed)
- Embed protection

---

## Testing Checklist

- [ ] Generate WebM preview locally
- [ ] Verify preview plays in browser
- [ ] Upload WebM to Cloudflare
- [ ] Verify Cloudflare transcoding completes
- [ ] Check MP4 playback URL works
- [ ] Test HLS adaptive streaming
- [ ] Verify thumbnail generation
- [ ] Test on memorial page
- [ ] Test download MP4 functionality
- [ ] Test with large slideshow (50+ photos)
- [ ] Test with audio track
- [ ] Verify metadata saves correctly
- [ ] Test edit existing slideshow flow

---

## Success Criteria

✅ Users can generate instant WebM previews  
✅ Slideshows upload to Cloudflare on "Save"  
✅ Memorial pages show MP4 streams from Cloudflare  
✅ Download provides MP4 format  
✅ All new slideshows use Cloudflare exclusively  

---

## Timeline Estimate

- **Step 1-2:** Cloudflare integration (~2-3 hours)
- **Step 3:** API updates (~1 hour)
- **Step 4:** Display updates (~1-2 hours)
- **Step 5:** Download functionality (~1 hour)
- **Step 6:** Testing & debugging (~2-3 hours)

**Total:** ~7-11 hours of development

---

## Notes

- Cloudflare Stream accepts any video format (WebM, MP4, MOV, etc.)
- Transcoding typically takes 1-5 minutes depending on video length
- HLS URLs work on all modern devices
- MP4 direct download available via Cloudflare API
- Thumbnails generated automatically at multiple timestamps
