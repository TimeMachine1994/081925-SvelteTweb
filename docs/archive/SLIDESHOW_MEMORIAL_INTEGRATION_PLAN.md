# 🎬 Slideshow Memorial Integration Plan
## WebM + Cloudflare Stream Implementation

### 📋 **Current State Analysis**

#### ✅ **What's Already Working**
- PhotoSlideshowCreator component with WebM generation
- Cloudflare Stream API integration (`/api/slideshow/upload`)
- Profile page slideshow creation button
- Preview functionality before upload
- Firestore slideshow metadata storage

#### 🎯 **Integration Goal**
Display slideshows on memorial pages below livestreams without breaking existing stream logic.

---

## 🏗️ **Implementation Plan**

### **Phase 1: Data Layer Integration**

#### 1.1 Server-Side Loading
**File**: `src/routes/[fullSlug]/+page.server.ts`

```typescript
// Add slideshow loading to existing memorial data fetch
export const load: PageServerLoad = async ({ params, locals }) => {
  // ... existing memorial and streams loading ...
  
  // Load slideshows for this memorial
  let slideshows = [];
  try {
    const slideshowsSnapshot = await adminDb
      .collection('memorials')
      .doc(memorial.id)
      .collection('slideshows')
      .where('status', 'in', ['processing', 'ready'])
      .orderBy('createdAt', 'desc')
      .get();
    
    slideshows = slideshowsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📸 [MEMORIAL] Loaded ${slideshows.length} slideshows`);
  } catch (error) {
    console.error('Error loading slideshows:', error);
  }

  return {
    memorial,
    streams: validStreams,
    slideshows, // Add to return data
    user: locals.user
  };
};
```

#### 1.2 Slideshow Data Structure
```typescript
interface MemorialSlideshow {
  id: string;
  title: string;
  memorialId: string;
  cloudflareStreamId: string;
  embedUrl: string | null;
  playbackUrl: string | null;
  thumbnailUrl: string | null;
  status: 'processing' | 'ready' | 'error' | 'local_only';
  isCloudflareHosted: boolean;
  photos: Array<{
    id: string;
    caption: string;
    duration: number;
  }>;
  settings: {
    photoDuration: number;
    transitionType: string;
    videoQuality: string;
    aspectRatio: string;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### **Phase 2: Component Architecture**

#### 2.1 Create SlideshowPlayer Component
**File**: `src/lib/components/SlideshowPlayer.svelte`

```svelte
<script lang="ts">
  import type { MemorialSlideshow } from '$lib/types/slideshow';
  
  interface Props {
    slideshow: MemorialSlideshow;
    autoplay?: boolean;
    controls?: boolean;
  }
  
  let { slideshow, autoplay = false, controls = true }: Props = $props();
  
  // Determine video source based on Cloudflare hosting
  const videoSrc = $derived(() => {
    if (slideshow.isCloudflareHosted && slideshow.playbackUrl) {
      return slideshow.playbackUrl; // HLS stream
    }
    return slideshow.embedUrl; // Fallback to embed URL
  });
  
  const posterImage = $derived(() => slideshow.thumbnailUrl || '');
</script>

{#if slideshow.status === 'ready' && videoSrc}
  <div class="slideshow-player">
    <div class="slideshow-header">
      <h3 class="slideshow-title">{slideshow.title}</h3>
      <div class="slideshow-meta">
        <span class="photo-count">{slideshow.photos.length} photos</span>
        <span class="duration">{slideshow.photos.length * slideshow.settings.photoDuration}s</span>
      </div>
    </div>
    
    <div class="video-container">
      {#if slideshow.isCloudflareHosted}
        <!-- Cloudflare Stream Player -->
        <iframe
          src="https://iframe.cloudflarestream.com/{slideshow.cloudflareStreamId}"
          class="cloudflare-player"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowfullscreen
          title={slideshow.title}
        ></iframe>
      {:else}
        <!-- Fallback HTML5 Video -->
        <video
          src={videoSrc}
          {controls}
          {autoplay}
          poster={posterImage}
          class="fallback-player"
          preload="metadata"
        >
          <track kind="captions" src="" srclang="en" label="English" />
          Your browser does not support the video tag.
        </video>
      {/if}
    </div>
    
    {#if slideshow.photos.some(p => p.caption)}
      <div class="slideshow-captions">
        <h4>Photo Captions</h4>
        <ul>
          {#each slideshow.photos.filter(p => p.caption) as photo}
            <li>{photo.caption}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
{:else if slideshow.status === 'processing'}
  <div class="slideshow-processing">
    <div class="processing-indicator">
      <div class="spinner"></div>
      <p>Processing slideshow...</p>
    </div>
  </div>
{/if}

<style>
  .slideshow-player {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }
  
  .slideshow-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .slideshow-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }
  
  .slideshow-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .video-container {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    background: #000;
  }
  
  .cloudflare-player,
  .fallback-player {
    width: 100%;
    height: 100%;
    border: none;
  }
  
  .slideshow-captions {
    padding: 1.5rem;
    background: #f9fafb;
  }
  
  .slideshow-captions h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1rem 0;
  }
  
  .slideshow-captions ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .slideshow-captions li {
    padding: 0.5rem 0;
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .slideshow-captions li:last-child {
    border-bottom: none;
  }
  
  .slideshow-processing {
    background: white;
    border-radius: 12px;
    padding: 3rem;
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .processing-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #D5BA7F;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
```

#### 2.2 Create SlideshowSection Component
**File**: `src/lib/components/SlideshowSection.svelte`

```svelte
<script lang="ts">
  import SlideshowPlayer from './SlideshowPlayer.svelte';
  import type { MemorialSlideshow } from '$lib/types/slideshow';
  
  interface Props {
    slideshows: MemorialSlideshow[];
    memorialName: string;
  }
  
  let { slideshows, memorialName }: Props = $props();
  
  const activeSlideshows = $derived(() => 
    slideshows.filter(s => s.status === 'ready' || s.status === 'processing')
  );
</script>

{#if activeSlideshows.length > 0}
  <section class="slideshow-section">
    <div class="section-header">
      <h2 class="section-title">Photo Slideshows</h2>
      <p class="section-subtitle">
        Celebrating the life of {memorialName}
      </p>
    </div>
    
    <div class="slideshows-container">
      {#each activeSlideshows as slideshow (slideshow.id)}
        <SlideshowPlayer {slideshow} />
      {/each}
    </div>
  </section>
{/if}

<style>
  .slideshow-section {
    margin: 3rem 0;
  }
  
  .section-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .section-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }
  
  .section-subtitle {
    font-size: 1.125rem;
    color: #6b7280;
    margin: 0;
  }
  
  .slideshows-container {
    max-width: 800px;
    margin: 0 auto;
  }
  
  @media (max-width: 768px) {
    .section-title {
      font-size: 1.5rem;
    }
    
    .section-subtitle {
      font-size: 1rem;
    }
  }
</style>
```

### **Phase 3: Memorial Page Integration**

#### 3.1 Update Memorial Page Template
**File**: `src/routes/[fullSlug]/+page.svelte`

```svelte
<script lang="ts">
  import StreamPlayer from '$lib/components/StreamPlayer.svelte';
  import SlideshowSection from '$lib/components/SlideshowSection.svelte';
  // ... existing imports
  
  let { data } = $props();
  
  // Existing derived states
  let memorial = $derived(data.memorial);
  let streams = $derived(data.streams || []);
  let slideshows = $derived(data.slideshows || []); // NEW
  
  // ... existing logic
</script>

<!-- Existing memorial header and content -->

<!-- Existing StreamPlayer Section -->
{#if streams.length > 0}
  <section class="streams-section">
    <!-- Existing stream content -->
    <StreamPlayer {streams} {memorial} />
  </section>
{/if}

<!-- NEW: Slideshow Section -->
<SlideshowSection 
  {slideshows} 
  memorialName={memorial.lovedOneName || memorial.title} 
/>

<!-- Existing footer and other content -->
```

### **Phase 4: Type Definitions**

#### 4.1 Create Slideshow Types
**File**: `src/lib/types/slideshow.ts`

```typescript
export interface MemorialSlideshow {
  id: string;
  title: string;
  memorialId: string;
  cloudflareStreamId: string;
  embedUrl: string | null;
  playbackUrl: string | null;
  thumbnailUrl: string | null;
  status: 'processing' | 'ready' | 'error' | 'local_only';
  isCloudflareHosted: boolean;
  photos: SlideshowPhoto[];
  settings: SlideshowSettings;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SlideshowPhoto {
  id: string;
  caption: string;
  duration: number;
}

export interface SlideshowSettings {
  photoDuration: number;
  transitionType: 'fade' | 'slide' | 'zoom';
  videoQuality: 'low' | 'medium' | 'high';
  aspectRatio: '16:9' | '4:3' | '1:1';
}
```

### **Phase 5: Cloudflare Stream Status Monitoring**

#### 5.1 Status Update Endpoint
**File**: `src/routes/api/slideshow/status/+server.ts`

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

export const POST: RequestHandler = async ({ request }) => {
  // Webhook from Cloudflare Stream to update slideshow status
  const { streamId, status } = await request.json();
  
  try {
    // Find slideshow by cloudflareStreamId
    const slideshowQuery = await adminDb
      .collectionGroup('slideshows')
      .where('cloudflareStreamId', '==', streamId)
      .get();
    
    if (!slideshowQuery.empty) {
      const slideshowDoc = slideshowQuery.docs[0];
      await slideshowDoc.ref.update({
        status: status === 'ready' ? 'ready' : 'processing',
        updatedAt: new Date().toISOString()
      });
      
      console.log(`📸 Updated slideshow ${slideshowDoc.id} status to ${status}`);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Error updating slideshow status:', error);
    return json({ success: false }, { status: 500 });
  }
};
```

---

## 🔄 **Integration Strategy**

### **Non-Breaking Implementation**
1. **Additive Only**: New slideshow components don't modify existing stream logic
2. **Separate Data Loading**: Slideshows load independently of streams
3. **Isolated Components**: SlideshowSection is self-contained
4. **Graceful Degradation**: Page works fine with no slideshows

### **Testing Approach**
1. **Test with existing memorials** (should show no slideshows)
2. **Test with new slideshows** (should display below streams)
3. **Test stream functionality** (should remain unchanged)
4. **Test responsive design** (mobile/desktop compatibility)

### **Rollout Plan**
1. **Phase 1**: Deploy slideshow components (hidden by default)
2. **Phase 2**: Enable for test memorials
3. **Phase 3**: Full rollout after validation
4. **Phase 4**: Add status monitoring and webhooks

---

## 🎯 **Success Metrics**

- ✅ Existing stream functionality unchanged
- ✅ Slideshows display correctly on memorial pages
- ✅ Cloudflare Stream integration working
- ✅ Mobile responsive design
- ✅ Fast loading times
- ✅ Graceful error handling

---

## 🚀 **Next Steps**

1. **Create slideshow types** (`src/lib/types/slideshow.ts`)
2. **Build SlideshowPlayer component**
3. **Build SlideshowSection component** 
4. **Update memorial page server load**
5. **Integrate into memorial page template**
6. **Test with existing memorial pages**
7. **Deploy and validate**

This plan ensures a smooth integration without breaking existing functionality while providing a beautiful slideshow experience for memorial visitors! 🎬✨
