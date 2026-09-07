# Collaborative Memory Timeline - SvelteKit + Firebase Implementation

## Overview
An interactive timeline feature for memorial pages allowing family admins to create major life milestones (anchor events) while enabling visitors to share memories with photos/videos on a chronological timeline.

---

## Tech Stack Alignment

**Using Your Existing Stack:**
- **SvelteKit 5** with Svelte 5 runes ($state, $derived, $effect)
- **Firebase Firestore** for data storage
- **Firebase Storage** for media files
- **Firebase Auth** for authentication (existing system)
- **TailwindCSS** for styling
- **Lucide Svelte** for icons
- **vis-timeline** for timeline visualization

**New Dependencies:**
```json
{
  "vis-timeline": "^7.7.3",
  "nanoid": "^5.0.0"
}
```

---

## File Structure

```
frontend/src/
├── routes/
│   ├── memorials/[id]/timeline/
│   │   ├── +page.svelte                    # Main timeline page
│   │   ├── +page.server.ts
│   │   └── moderate/
│   │       ├── +page.svelte                # Moderation interface
│   │       └── +page.server.ts
│   └── api/memorials/[memorialId]/
│       ├── timeline/
│       │   ├── anchor-events/+server.ts    # CRUD anchor events
│       │   └── memories/
│       │       ├── +server.ts              # CRUD memories
│       │       └── [id]/approve/+server.ts # Approve memory
│       └── timeline-media/upload/+server.ts
├── lib/components/timeline/
│   ├── TimelineView.svelte                 # Main vis-timeline component
│   ├── AddMemoryModal.svelte               # Memory submission form
│   ├── AnchorEventModal.svelte             # Admin event form
│   ├── DetailModal.svelte                  # View details with gallery
│   ├── MediaGallery.svelte                 # Photo/video viewer
│   ├── MediaUploader.svelte                # Firebase upload component
│   └── ModerationQueue.svelte              # Admin moderation UI
└── lib/types/timeline.ts                   # TypeScript interfaces
```

---

## Data Model

### Firestore Structure

```
memorials/{memorialId}/
└── timeline/
    ├── anchorEvents/
    │   └── {eventId}
    └── memories/
        └── {memoryId}
```

### TypeScript Interfaces

```typescript
interface AnchorEvent {
  id: string;
  memorialId: string;
  title: string;                    // "Birth", "Graduation", etc.
  date: string;                     // Display: "June 15, 1950"
  year: number;                     // For positioning
  month?: number;                   // 1-12
  day?: number;                     // 1-31
  description: string;
  media: MediaItem[];
  createdBy: string;                // User UID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Memory {
  id: string;
  memorialId: string;
  title: string;
  year: number;
  month?: number;
  contributorName: string;
  contributorEmail?: string;
  story: string;                    // Personal narrative
  media: MediaItem[];
  approved: boolean;                // Moderation flag
  approvedBy?: string;
  approvedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface MediaItem {
  id: string;                       // nanoid()
  type: 'photo' | 'video';
  url: string;                      // Firebase Storage download URL
  storagePath: string;              // Firebase Storage path
  thumbnailUrl?: string;
  isMain: boolean;                  // Featured image (exactly one)
  order: number;                    // Display sequence
  caption?: string;
}
```

---

## Key Components

### 1. TimelineView.svelte

**Interactive timeline using vis-timeline library**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { Timeline } from 'vis-timeline/standalone';
  
  let { memorialId, anchorEvents, memories, canEdit } = $props();
  
  let timelineContainer: HTMLDivElement;
  let timeline: Timeline | null = $state(null);
  let selectedItem = $state(null);
  let showDetailModal = $state(false);
  
  const items = $derived(() => {
    const anchorItems = anchorEvents.map(event => ({
      id: `anchor-${event.id}`,
      content: createAnchorTemplate(event),
      start: new Date(event.year, event.month || 0, event.day || 1),
      type: 'box',
      className: 'timeline-anchor-event'
    }));
    
    const memoryItems = memories
      .filter(m => m.approved)
      .map(memory => ({
        id: `memory-${memory.id}`,
        content: createMemoryTemplate(memory),
        start: new Date(memory.year, memory.month || 6, 15),
        type: 'point',
        className: 'timeline-memory'
      }));
    
    return [...anchorItems, ...memoryItems];
  });
  
  onMount(() => {
    timeline = new Timeline(timelineContainer, items, {
      width: '100%',
      height: '400px',
      zoomMin: 1000 * 60 * 60 * 24 * 365,      // 1 year
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 100, // 100 years
      orientation: 'top'
    });
    
    timeline.on('select', (props) => {
      if (props.items.length > 0) handleItemClick(props.items[0]);
    });
    
    return () => timeline?.destroy();
  });
</script>

<div bind:this={timelineContainer}></div>

{#if showDetailModal && selectedItem}
  <DetailModal 
    item={selectedItem}
    onclose={() => showDetailModal = false}
  />
{/if}
```

### 2. MediaUploader.svelte

**Firebase Storage upload with preview**

```svelte
<script lang="ts">
  import { nanoid } from 'nanoid';
  
  let { memorialId, maxFiles = 10, onupload } = $props();
  
  let mediaItems = $state<MediaItem[]>([]);
  let uploading = $state(false);
  
  async function handleFiles(files: FileList) {
    uploading = true;
    
    for (const file of Array.from(files)) {
      if (mediaItems.length >= maxFiles) break;
      
      // Validate
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large (max 10MB)');
        continue;
      }
      
      // Upload to Firebase Storage
      const formData = new FormData();
      formData.append('file', file);
      formData.append('memorialId', memorialId);
      formData.append('type', 'timeline');
      
      const response = await fetch(
        `/api/memorials/${memorialId}/timeline-media/upload`,
        { method: 'POST', body: formData }
      );
      
      const data = await response.json();
      
      mediaItems.push({
        id: nanoid(),
        type: file.type.startsWith('video/') ? 'video' : 'photo',
        url: data.downloadUrl,
        storagePath: data.storagePath,
        isMain: mediaItems.length === 0, // First is main
        order: mediaItems.length
      });
    }
    
    uploading = false;
    onupload(mediaItems);
  }
  
  function setMainImage(id: string) {
    mediaItems = mediaItems.map(item => ({
      ...item,
      isMain: item.id === id
    }));
  }
</script>

<div class="uploader">
  <input 
    type="file" 
    multiple 
    accept="image/*,video/*"
    onchange={(e) => handleFiles(e.currentTarget.files)}
  />
  
  <div class="preview-grid">
    {#each mediaItems as item}
      <div class="preview-item" class:main={item.isMain}>
        <img src={item.url} alt="Preview" />
        <button onclick={() => setMainImage(item.id)}>
          Set as Main
        </button>
      </div>
    {/each}
  </div>
</div>
```

### 3. AddMemoryModal.svelte

**Public memory submission form**

```svelte
<script lang="ts">
  import MediaUploader from './MediaUploader.svelte';
  
  let { memorialId, open, onclose, onsuccess } = $props();
  
  let form = $state({
    title: '',
    year: new Date().getFullYear(),
    contributorName: '',
    story: '',
    media: []
  });
  
  async function handleSubmit() {
    const response = await fetch(
      `/api/memorials/${memorialId}/timeline/memories`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      }
    );
    
    if (response.ok) {
      onsuccess();
      onclose();
    }
  }
</script>

{#if open}
  <div class="modal">
    <h2>Share a Memory</h2>
    
    <input 
      type="text" 
      bind:value={form.title}
      placeholder="Memory title"
    />
    
    <input 
      type="number" 
      bind:value={form.year}
      placeholder="Year"
    />
    
    <input 
      type="text" 
      bind:value={form.contributorName}
      placeholder="Your name"
    />
    
    <textarea 
      bind:value={form.story}
      placeholder="Share your memory..."
    />
    
    <MediaUploader 
      {memorialId}
      onupload={(items) => form.media = items}
    />
    
    <button onclick={handleSubmit}>Submit Memory</button>
    <button onclick={onclose}>Cancel</button>
  </div>
{/if}
```

---

## API Endpoints

### Memories

```typescript
// GET /api/memorials/[memorialId]/timeline/memories/+server.ts
import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export async function GET({ params, locals }) {
  const { memorialId } = params;
  const { user } = locals;
  
  const canModerate = user && await canEditMemorial(user, memorialId);
  
  let query = adminDb
    .collection('memorials')
    .doc(memorialId)
    .collection('timeline')
    .collection('memories');
  
  if (!canModerate) {
    query = query.where('approved', '==', true);
  }
  
  const snapshot = await query.orderBy('year', 'asc').get();
  const memories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  return json(memories);
}

// POST - Submit new memory (no auth required)
export async function POST({ params, request }) {
  const { memorialId } = params;
  const data = await request.json();
  
  // Validate with Zod
  const validated = memorySchema.parse(data);
  
  const memoryRef = adminDb
    .collection('memorials')
    .doc(memorialId)
    .collection('timeline')
    .collection('memories')
    .doc();
  
  await memoryRef.set({
    ...validated,
    approved: false,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // TODO: Notify memorial owner
  
  return json({ id: memoryRef.id });
}
```

### Media Upload

```typescript
// POST /api/memorials/[memorialId]/timeline-media/upload/+server.ts
import { json } from '@sveltejs/kit';
import { storage } from '$lib/server/firebase';
import { nanoid } from 'nanoid';

export async function POST({ params, request }) {
  const { memorialId } = params;
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    return json({ error: 'No file provided' }, { status: 400 });
  }
  
  // Validate
  if (file.size > 10 * 1024 * 1024) {
    return json({ error: 'File too large' }, { status: 400 });
  }
  
  // Upload to Firebase Storage
  const storagePath = `memorials/${memorialId}/timeline/${nanoid()}-${file.name}`;
  const bucket = storage.bucket();
  const fileRef = bucket.file(storagePath);
  
  const buffer = Buffer.from(await file.arrayBuffer());
  await fileRef.save(buffer, {
    metadata: { contentType: file.type }
  });
  
  await fileRef.makePublic();
  const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
  
  return json({ downloadUrl, storagePath });
}
```

---

## Integration with Existing Memorial Pages

### Add Timeline Tab

```svelte
<!-- frontend/src/routes/[fullSlug]/+page.svelte -->
<script lang="ts">
  import TimelineSection from '$lib/components/timeline/TimelineSection.svelte';
  
  let { data } = $props();
  let activeTab = $state('overview');
</script>

<div class="memorial-tabs">
  <button onclick={() => activeTab = 'overview'}>Overview</button>
  <button onclick={() => activeTab = 'timeline'}>Life Timeline</button>
  <button onclick={() => activeTab = 'streams'}>Services</button>
</div>

{#if activeTab === 'timeline'}
  <TimelineSection memorial={data.memorial} />
{/if}
```

### Load Timeline Data in Server

```typescript
// frontend/src/routes/[fullSlug]/+page.server.ts
export async function load({ params, locals }) {
  // ... existing memorial loading ...
  
  // Load timeline data
  const anchorEvents = await getAnchorEvents(memorial.id);
  const memories = await getMemories(memorial.id, canModerate);
  
  return {
    memorial,
    streams,
    slideshows,
    anchorEvents,
    memories,
    canEdit: canModerate
  };
}
```

---

## Firestore Security Rules

```javascript
match /memorials/{memorialId}/timeline/anchorEvents/{eventId} {
  allow read: if true;
  allow write: if isMemorialOwnerOrAdmin(memorialId);
}

match /memorials/{memorialId}/timeline/memories/{memoryId} {
  allow read: if resource.data.approved == true || isMemorialOwnerOrAdmin(memorialId);
  allow create: if true; // Public can submit for moderation
  allow update, delete: if isMemorialOwnerOrAdmin(memorialId);
}

function isMemorialOwnerOrAdmin(memorialId) {
  let memorial = get(/databases/$(database)/documents/memorials/$(memorialId));
  return request.auth != null && (
    request.auth.token.role == 'admin' ||
    request.auth.uid == memorial.data.ownerUid ||
    request.auth.uid == memorial.data.funeralDirectorUid
  );
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- ✅ Create TypeScript interfaces
- ✅ Set up Firestore subcollections
- ✅ Build API endpoints (CRUD)
- ✅ Implement media upload endpoint
- ✅ Create basic page layout

### Phase 2: Timeline Visualization (Week 2)
- ✅ Install vis-timeline
- ✅ Create TimelineView component
- ✅ Implement custom item templates
- ✅ Add zoom/navigation controls
- ✅ Style for memorial theme

### Phase 3: Memory Submission (Week 3)
- ✅ Build AddMemoryModal
- ✅ Create MediaUploader
- ✅ Implement form validation
- ✅ Add Firebase Storage uploads
- ✅ Submit to moderation queue

### Phase 4: Detail View & Gallery (Week 4)
- ✅ Create DetailModal
- ✅ Build MediaGallery component
- ✅ Add media navigation
- ✅ Support video playback
- ✅ Implement memory-to-memory navigation

### Phase 5: Moderation System (Week 5)
- ✅ Create moderation page
- ✅ Build ModerationQueue component
- ✅ Implement approve/reject
- ✅ Add admin notifications
- ✅ Enforce permissions

### Phase 6: Polish & Testing (Week 6)
- ✅ Add loading states
- ✅ Error boundaries
- ✅ Write tests
- ✅ Accessibility audit
- ✅ Performance optimization
- ✅ Documentation

---

## Future Enhancements

**Phase 2 Features:**
- Email notifications (SendGrid)
- Advanced filtering by decade/contributor
- Export timeline to PDF
- Social sharing
- Comment threads on memories
- Analytics dashboard

**Technical Improvements:**
- Video thumbnail generation (Cloud Functions)
- Redis caching
- E2E tests with Playwright
- Performance monitoring
- Error tracking

---

## Security Best Practices

1. **XSS Prevention**: Escape HTML in timeline templates
2. **File Validation**: Type and size checks
3. **Moderation**: All public submissions require approval
4. **Firestore Rules**: Proper read/write permissions
5. **Input Validation**: Zod schemas on client and server

---

## Conclusion

This implementation leverages your existing SvelteKit + Firebase stack to create an engaging collaborative timeline feature. The vis-timeline library provides professional visualization, while Firebase Firestore and Storage handle data persistence and media files efficiently. The moderation system ensures quality control while allowing public participation in memorial tributes.
