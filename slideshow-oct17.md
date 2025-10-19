# Slideshow Component Implementation Plan
*October 17, 2025*

## 🎯 **Overview**

Implement a comprehensive slideshow component that allows users to upload photos, generate videos, and integrate with Cloudflare Stream for hosting. The slideshow videos will be embedded alongside live streams in the memorial pages.

## 🎬 **Slideshow Component Architecture**

### **Phase 1: Photo Upload & Management**
```typescript
// Component: PhotoSlideshowCreator.svelte
interface SlideshowPhoto {
  id: string;
  file: File;
  preview: string; // base64 or blob URL
  caption?: string;
  duration: number; // seconds per photo
}
```

### **Phase 2: Client-Side Video Generation**
```typescript
// Using Canvas API + MediaRecorder
class SlideshowRenderer {
  async generateVideo(photos: SlideshowPhoto[]): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream(30); // 30 FPS
    const recorder = new MediaRecorder(stream);
    
    // Render each photo with transitions
    for (const photo of photos) {
      await this.renderPhotoFrame(ctx, photo);
    }
    
    return videoBlob;
  }
}
```

### **Phase 3: Cloudflare Stream Integration**
```typescript
// API Route: /api/slideshow/upload
export async function POST({ request }) {
  const formData = await request.formData();
  const videoBlob = formData.get('video');
  
  // Upload to Cloudflare Stream
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
    },
    body: formData
  });
  
  const { result } = await response.json();
  return { streamId: result.uid, embedUrl: result.preview };
}
```

### **Phase 4: StreamPlayer Integration**
```typescript
// Add slideshow support to existing StreamPlayer
interface SlideshowStream extends Stream {
  type: 'slideshow';
  cloudflareStreamId: string;
  embedUrl: string;
  photos: SlideshowPhoto[];
}
```

## 🛠️ **Implementation Strategy**

### **Option A: Client-Side Generation (Recommended)**
**Pros:**
- No server processing load
- Real-time preview
- Works offline
- Faster for users

**Cons:**
- Browser compatibility
- Large memory usage
- Limited video quality

### **Option B: Server-Side Generation**
**Pros:**
- Higher quality output
- More format options
- Consistent results

**Cons:**
- Server processing load
- Longer wait times
- More complex infrastructure

## 🎯 **Recommended Tech Stack**

### **Frontend:**
- **Canvas API** for image rendering
- **MediaRecorder API** for video capture
- **Web Workers** for heavy processing
- **Progress indicators** for user feedback

### **Backend:**
- **Cloudflare Stream API** for video hosting
- **Firebase Storage** for temporary photo storage
- **Queue system** for processing jobs

### **Integration:**
- **Extend StreamPlayer** to handle slideshow videos
- **Add to memorial creation flow**
- **Embed alongside live streams**

## 📋 **Implementation Plan**

### **Step 1: Basic Photo Upload**
```svelte
<!-- SlideshowCreator.svelte -->
<script>
  let photos = $state([]);
  
  function handlePhotoUpload(files) {
    // Process and preview photos
  }
</script>

<div class="photo-upload">
  <input type="file" multiple accept="image/*" on:change={handlePhotoUpload} />
  <!-- Photo grid with drag-and-drop reordering -->
</div>
```

### **Step 2: Video Generation**
```typescript
// SlideshowGenerator.ts
export class SlideshowGenerator {
  async createVideo(photos: Photo[], options: SlideshowOptions) {
    const canvas = this.setupCanvas();
    const recorder = this.setupRecorder(canvas);
    
    recorder.start();
    
    for (const photo of photos) {
      await this.renderPhoto(canvas, photo, options);
      await this.wait(options.photoDuration);
    }
    
    recorder.stop();
    return this.getVideoBlob();
  }
}
```

### **Step 3: Cloudflare Integration**
```typescript
// /api/slideshow/create
export async function POST({ request, locals }) {
  const { photos, memorialId, settings } = await request.json();
  
  // Generate video (client sends blob or we generate server-side)
  const videoBlob = await generateSlideshowVideo(photos, settings);
  
  // Upload to Cloudflare Stream
  const streamResult = await uploadToCloudflareStream(videoBlob);
  
  // Save to memorial
  await saveSlideshow(memorialId, {
    cloudflareStreamId: streamResult.uid,
    embedUrl: streamResult.preview,
    photos,
    settings
  });
  
  return json({ success: true, streamId: streamResult.uid });
}
```

### **Step 4: StreamPlayer Integration**
```svelte
<!-- Add to StreamPlayer.svelte -->
{#if categorizedStreams.slideshowStreams.length > 0}
  <div class="slideshow-section">
    <h2>Photo Slideshows</h2>
    {#each categorizedStreams.slideshowStreams as slideshow}
      <div class="slideshow-player">
        <iframe 
          src={slideshow.embedUrl}
          class="slideshow-iframe"
          allowfullscreen
        ></iframe>
      </div>
    {/each}
  </div>
{/if}
```

## 🔧 **Technical Requirements**

### **Photo Upload Component**
- Multiple file selection
- Drag and drop interface
- Image preview thumbnails
- Reordering capabilities
- Caption editing
- Duration settings per photo

### **Video Generation Engine**
- Canvas-based rendering
- Smooth transitions between photos
- Configurable timing
- Progress tracking
- Error handling
- Quality settings

### **Cloudflare Stream Integration**
- Video upload API
- Progress tracking
- Error handling
- Embed URL generation
- Metadata management

### **StreamPlayer Enhancement**
- Slideshow video support
- Mixed content display (live + slideshow)
- Responsive iframe embedding
- Loading states
- Error fallbacks

## 🚀 **Development Phases**

### **Phase 1: Foundation (Week 1)**
- [ ] Create basic photo upload component
- [ ] Implement drag-and-drop interface
- [ ] Add photo preview and reordering
- [ ] Basic caption editing

### **Phase 2: Video Generation (Week 2)**
- [ ] Implement Canvas-based rendering
- [ ] Add transition effects
- [ ] Create progress tracking
- [ ] Add quality/duration settings

### **Phase 3: Cloud Integration (Week 3)**
- [ ] Cloudflare Stream API integration
- [ ] Video upload functionality
- [ ] Error handling and retries
- [ ] Metadata management

### **Phase 4: StreamPlayer Integration (Week 4)**
- [ ] Extend StreamPlayer for slideshows
- [ ] Add slideshow display logic
- [ ] Implement responsive embedding
- [ ] Add loading and error states

### **Phase 5: Polish & Testing (Week 5)**
- [ ] User experience improvements
- [ ] Performance optimizations
- [ ] Cross-browser testing
- [ ] Mobile responsiveness

## 🎨 **User Experience Flow**

1. **Upload Photos**: User selects multiple photos via drag-and-drop or file picker
2. **Customize**: User reorders photos, adds captions, sets timing
3. **Preview**: Real-time preview of slideshow with transitions
4. **Generate**: Client-side video generation with progress indicator
5. **Upload**: Automatic upload to Cloudflare Stream
6. **Embed**: Slideshow appears in memorial page alongside live streams
7. **Share**: Users can share memorial page with embedded slideshow

## 🔒 **Security Considerations**

- File type validation (images only)
- File size limits (prevent abuse)
- Rate limiting on video generation
- User authentication for uploads
- Content moderation capabilities
- Privacy controls for memorial access

## 📊 **Performance Considerations**

- Image compression before processing
- Progressive loading for large photo sets
- Web Workers for video generation
- Chunked uploads for large videos
- CDN delivery via Cloudflare
- Lazy loading of slideshow content

## 🧪 **Testing Strategy**

- Unit tests for video generation logic
- Integration tests for Cloudflare API
- E2E tests for complete user flow
- Performance testing with large photo sets
- Cross-browser compatibility testing
- Mobile device testing

## 📈 **Success Metrics**

- Slideshow creation completion rate
- Video generation success rate
- Upload success rate to Cloudflare
- User engagement with slideshow content
- Memorial page view duration
- User feedback and satisfaction

## 🔮 **Future Enhancements**

- Music/audio track support
- Advanced transition effects
- Template-based layouts
- Collaborative photo collection
- AI-powered photo enhancement
- Social media integration
- Download options for families

---

*This plan provides a comprehensive roadmap for implementing a robust slideshow feature that integrates seamlessly with the existing TributeStream memorial platform.*
