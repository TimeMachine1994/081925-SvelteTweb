# VideoPlayer Component Architecture
## Object-Oriented Design with Firebase CRUD & SvelteKit Integration

### 📋 **Overview**
This document outlines the architecture for treating the VideoPlayer as a reusable object/component with class-based inheritance, Firebase CRUD operations, and SvelteKit integration. The goal is to create a scalable, maintainable system for all video streaming functionality.

---

## 🏗️ **Core Architecture**

### **VideoPlayer Base Class**
```javascript
// /lib/classes/VideoPlayer.js
export class VideoPlayer {
  constructor(data = {}) {
    // Core Identity (Firebase CRUD)
    this.id = data.id || generateId()
    this.title = data.title || 'Untitled Stream'
    this.description = data.description || ''
    this.memorialId = data.memorialId || null
    this.createdBy = data.createdBy || null
    
    // Status & Lifecycle (Firebase CRUD)
    this.status = data.status || 'ready' // 'ready' | 'live' | 'completed' | 'scheduled' | 'error'
    
    // Visibility Control (Firebase CRUD)
    this.isVisible = data.isVisible !== false // Default true
    this.isPublic = data.isPublic || false // Default false
    this.displayOrder = data.displayOrder || 0
    
    // Stream Configuration (Firebase CRUD)
    this.cloudflareId = data.cloudflareId || null
    this.streamKey = data.streamKey || null
    this.playbackUrl = data.playbackUrl || null
    this.recordingUrl = data.recordingUrl || null
    this.recordingReady = data.recordingReady || false
    
    // Permissions (Firebase CRUD)
    this.allowedUsers = data.allowedUsers || []
    this.viewerCount = data.viewerCount || 0
    
    // Timestamps (Firebase CRUD)
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
    this.scheduledStartTime = data.scheduledStartTime || null
    this.actualStartTime = data.actualStartTime || null
    this.endTime = data.endTime || null
  }
  
  // CRUD Operations
  async save() {
    this.updatedAt = new Date()
    await updateDoc(doc(db, 'streams', this.id), this.toFirebaseData())
    return this
  }
  
  async delete() {
    await deleteDoc(doc(db, 'streams', this.id))
    return true
  }
  
  static async load(id) {
    const docSnap = await getDoc(doc(db, 'streams', id))
    if (docSnap.exists()) {
      return new VideoPlayer(docSnap.data())
    }
    throw new Error('Stream not found')
  }
  
  static async loadByMemorial(memorialId) {
    const q = query(
      collection(db, 'streams'),
      where('memorialId', '==', memorialId),
      orderBy('displayOrder', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => new VideoPlayer({ id: doc.id, ...doc.data() }))
  }
  
  // State Management
  async goLive() {
    this.status = 'live'
    this.actualStartTime = new Date()
    await this.save()
    return this
  }
  
  async endStream() {
    this.status = 'completed'
    this.endTime = new Date()
    await this.save()
    return this
  }
  
  async schedule(startTime) {
    this.status = 'scheduled'
    this.scheduledStartTime = new Date(startTime)
    await this.save()
    return this
  }
  
  async toggleVisibility() {
    this.isVisible = !this.isVisible
    await this.save()
    return this
  }
  
  async updateTitle(newTitle) {
    this.title = newTitle
    await this.save()
    return this
  }
  
  // Utility Methods
  toFirebaseData() {
    return {
      title: this.title,
      description: this.description,
      memorialId: this.memorialId,
      createdBy: this.createdBy,
      status: this.status,
      isVisible: this.isVisible,
      isPublic: this.isPublic,
      displayOrder: this.displayOrder,
      cloudflareId: this.cloudflareId,
      streamKey: this.streamKey,
      playbackUrl: this.playbackUrl,
      recordingUrl: this.recordingUrl,
      recordingReady: this.recordingReady,
      allowedUsers: this.allowedUsers,
      viewerCount: this.viewerCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      scheduledStartTime: this.scheduledStartTime,
      actualStartTime: this.actualStartTime,
      endTime: this.endTime
    }
  }
  
  get isLive() {
    return this.status === 'live'
  }
  
  get isRecorded() {
    return this.status === 'completed' && this.recordingReady
  }
  
  get isScheduled() {
    return this.status === 'scheduled' && this.scheduledStartTime
  }
  
  get playerState() {
    if (this.status === 'live') return 'live'
    if (this.status === 'completed' && this.recordingReady) return 'recorded'
    if (this.status === 'completed' && !this.recordingReady) return 'processing'
    if (this.status === 'scheduled' && this.scheduledStartTime) return 'scheduled'
    return 'dummy'
  }
}
```

---

## 🎯 **Extended Classes**

### **MemorialVideoPlayer**
```javascript
// /lib/classes/MemorialVideoPlayer.js
import { VideoPlayer } from './VideoPlayer.js'

export class MemorialVideoPlayer extends VideoPlayer {
  constructor(data, memorialData) {
    super(data)
    this.memorial = memorialData
    this.memorialName = memorialData?.lovedOneName || ''
  }
  
  // Memorial-specific methods
  async notifyFamilyMembers() {
    // Send notifications to family members when stream starts
    const notification = {
      type: 'stream_started',
      memorialId: this.memorialId,
      streamId: this.id,
      title: this.title,
      timestamp: new Date()
    }
    
    // Implementation for sending notifications
    await this.sendNotifications(notification)
    return this
  }
  
  async createArchiveEntry() {
    // Create archive entry in memorial collection
    const archiveEntry = {
      id: this.id,
      title: this.title,
      description: this.description,
      cloudflareId: this.cloudflareId,
      playbackUrl: this.playbackUrl,
      recordingUrl: this.recordingUrl,
      startedAt: this.actualStartTime,
      endedAt: this.endTime,
      duration: this.getDuration(),
      isVisible: this.isVisible,
      recordingReady: this.recordingReady,
      startedBy: this.createdBy,
      viewerCount: this.viewerCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
    
    // Add to memorial's livestreamArchive array
    await updateDoc(doc(db, 'memorials', this.memorialId), {
      livestreamArchive: arrayUnion(archiveEntry)
    })
    
    return archiveEntry
  }
  
  async syncWithCloudflare() {
    // Check Cloudflare for recording status
    try {
      const response = await fetch(`/api/streams/${this.id}/sync-recording`, {
        method: 'POST'
      })
      const result = await response.json()
      
      if (result.recordingReady) {
        this.recordingReady = true
        this.recordingUrl = result.recordingUrl
        await this.save()
      }
      
      return result
    } catch (error) {
      console.error('Failed to sync with Cloudflare:', error)
      throw error
    }
  }
  
  getDuration() {
    if (this.actualStartTime && this.endTime) {
      return Math.floor((this.endTime - this.actualStartTime) / 1000) // seconds
    }
    return null
  }
}
```

### **LiveVideoPlayer**
```javascript
// /lib/classes/LiveVideoPlayer.js
import { MemorialVideoPlayer } from './MemorialVideoPlayer.js'

export class LiveVideoPlayer extends MemorialVideoPlayer {
  constructor(data, memorialData) {
    super(data, memorialData)
    this.whipConnection = null
    this.rtmpConnection = null
  }
  
  // WHIP Streaming (Browser-based)
  async startWebRTCStream(mediaStream) {
    try {
      // Get WHIP endpoint from Cloudflare
      const response = await fetch(`/api/streams/${this.id}/whip-endpoint`)
      const { whipEndpoint } = await response.json()
      
      // Create WebRTC connection
      this.whipConnection = new RTCPeerConnection()
      
      // Add media stream tracks
      mediaStream.getTracks().forEach(track => {
        this.whipConnection.addTrack(track, mediaStream)
      })
      
      // Start streaming
      await this.connectWHIP(whipEndpoint)
      await this.goLive()
      
      return this
    } catch (error) {
      console.error('Failed to start WebRTC stream:', error)
      throw error
    }
  }
  
  async stopWebRTCStream() {
    if (this.whipConnection) {
      this.whipConnection.close()
      this.whipConnection = null
    }
    await this.endStream()
    return this
  }
  
  // RTMP Streaming (Professional)
  async setupRTMPStream() {
    try {
      const response = await fetch(`/api/streams/${this.id}/rtmp-credentials`)
      const credentials = await response.json()
      
      this.streamKey = credentials.streamKey
      this.streamUrl = credentials.streamUrl
      await this.save()
      
      return credentials
    } catch (error) {
      console.error('Failed to setup RTMP stream:', error)
      throw error
    }
  }
  
  async connectWHIP(endpoint) {
    // WHIP protocol implementation
    // This would contain the actual WebRTC signaling logic
    console.log('Connecting to WHIP endpoint:', endpoint)
    // Implementation details...
  }
}
```

---

## 🎨 **SvelteKit Component Integration**

### **VideoPlayerComponent.svelte**
```svelte
<script lang="ts">
  import { VideoPlayer, MemorialVideoPlayer, LiveVideoPlayer } from '$lib/classes'
  import { onMount, onDestroy } from 'svelte'
  
  // Props
  let { 
    streamData, 
    memorialData = null,
    mode = 'public', // 'public' | 'admin' | 'mobile'
    showControls = false,
    autoSync = true
  } = $props()
  
  // Create appropriate player instance
  let player = $state(null)
  let syncInterval = null
  
  onMount(() => {
    // Initialize player based on mode
    if (mode === 'mobile' || mode === 'admin') {
      player = new LiveVideoPlayer(streamData, memorialData)
    } else if (memorialData) {
      player = new MemorialVideoPlayer(streamData, memorialData)
    } else {
      player = new VideoPlayer(streamData)
    }
    
    // Auto-sync for live streams
    if (autoSync && player.isLive) {
      syncInterval = setInterval(() => {
        player.syncWithCloudflare()
      }, 30000) // Every 30 seconds
    }
  })
  
  onDestroy(() => {
    if (syncInterval) {
      clearInterval(syncInterval)
    }
  })
  
  // Event handlers
  async function handleGoLive() {
    await player.goLive()
    await player.notifyFamilyMembers()
  }
  
  async function handleEndStream() {
    await player.endStream()
    await player.createArchiveEntry()
  }
  
  async function handleToggleVisibility() {
    await player.toggleVisibility()
  }
</script>

<!-- Video Player UI -->
{#if player}
  <div class="video-player-container" class:admin-mode={mode === 'admin'}>
    
    <!-- Stream Title -->
    <div class="stream-header">
      <h3 class="stream-title">{player.title}</h3>
      
      {#if showControls}
        <div class="stream-controls">
          {#if player.status === 'ready'}
            <button onclick={handleGoLive} class="btn-primary">Go Live</button>
          {:else if player.status === 'live'}
            <button onclick={handleEndStream} class="btn-danger">End Stream</button>
          {/if}
          
          <button onclick={handleToggleVisibility} class="btn-secondary">
            {player.isVisible ? 'Hide' : 'Show'}
          </button>
        </div>
      {/if}
    </div>
    
    <!-- Video Player Area -->
    <div class="video-container w-[33vw] h-[33vh] bg-black rounded-lg overflow-hidden shadow-xl">
      
      {#if player.playerState === 'live'}
        <!-- Live Video -->
        <iframe 
          src={player.playbackUrl}
          class="w-full h-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowfullscreen
          title={player.title}
        ></iframe>
        
      {:else if player.playerState === 'recorded'}
        <!-- Recorded Video -->
        <iframe 
          src={player.recordingUrl}
          class="w-full h-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowfullscreen
          title={player.title}
        ></iframe>
        
      {:else if player.playerState === 'processing'}
        <!-- Processing State -->
        <div class="flex items-center justify-center h-full text-white">
          <div class="text-center">
            <div class="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Processing Recording...</p>
          </div>
        </div>
        
      {:else if player.playerState === 'scheduled'}
        <!-- Scheduled State with Countdown -->
        <div class="flex items-center justify-center h-full text-white">
          <div class="text-center">
            <div class="text-4xl mb-4">📅</div>
            <p>Scheduled Stream</p>
            <p class="text-sm opacity-75">
              {player.scheduledStartTime?.toLocaleString()}
            </p>
          </div>
        </div>
        
      {:else}
        <!-- Dummy/Ready State -->
        <div class="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
          
          <!-- Large Play Button -->
          <div class="flex flex-col items-center space-y-4 text-white">
            <div class="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-300 cursor-pointer group">
              <svg class="w-8 h-8 text-white ml-1 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            
            <div class="text-center">
              <p class="text-sm text-gray-300 font-medium">Stream Ready</p>
              <p class="text-xs text-gray-400">Click to start when ready</p>
            </div>
          </div>
          
          <!-- Fake Video Controls -->
          <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-3 flex items-center space-x-3">
            <button class="text-white hover:text-gray-300 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
            
            <div class="flex-1 bg-gray-600 rounded-full h-1">
              <div class="bg-white rounded-full h-1 w-0"></div>
            </div>
            
            <span class="text-white text-xs font-mono">0:00 / 0:00</span>
            
            <button class="text-white hover:text-gray-300 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
            </button>
            
            <button class="text-white hover:text-gray-300 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
            </button>
          </div>
          
        </div>
      {/if}
      
    </div>
    
    <!-- Stream Metadata -->
    {#if mode === 'admin'}
      <div class="stream-metadata mt-4 p-4 bg-gray-100 rounded">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Status:</strong> {player.status}</div>
          <div><strong>Visible:</strong> {player.isVisible ? 'Yes' : 'No'}</div>
          <div><strong>Recording Ready:</strong> {player.recordingReady ? 'Yes' : 'No'}</div>
          <div><strong>Viewers:</strong> {player.viewerCount}</div>
        </div>
      </div>
    {/if}
    
  </div>
{/if}

<style>
  .video-player-container {
    @apply max-w-2xl mx-auto;
  }
  
  .admin-mode {
    @apply border-2 border-blue-200 rounded-lg p-4;
  }
  
  .stream-header {
    @apply flex justify-between items-center mb-4;
  }
  
  .stream-title {
    @apply text-xl font-semibold text-gray-900;
  }
  
  .stream-controls {
    @apply flex space-x-2;
  }
  
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors;
  }
  
  .btn-danger {
    @apply px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors;
  }
  
  .btn-secondary {
    @apply px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors;
  }
</style>
```

---

## 🔥 **Firebase CRUD Variables**

### **Always Persisted to Firebase:**
```javascript
{
  // Core Identity
  id: string,
  title: string,
  description: string,
  memorialId: string,
  createdBy: string,
  
  // Status & Lifecycle
  status: 'ready' | 'live' | 'completed' | 'scheduled' | 'error',
  
  // Visibility Control
  isVisible: boolean,
  isPublic: boolean,
  displayOrder: number,
  
  // Stream Configuration
  cloudflareId: string,
  streamKey: string,
  playbackUrl: string,
  recordingUrl: string,
  recordingReady: boolean,
  
  // Permissions
  allowedUsers: string[],
  viewerCount: number,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  scheduledStartTime: Date,
  actualStartTime: Date,
  endTime: Date
}
```

---

## 📱 **Usage Examples**

### **Memorial Page (Public View):**
```svelte
<script>
  import VideoPlayerComponent from '$lib/components/VideoPlayerComponent.svelte'
  
  let { streams, memorial } = $props()
</script>

{#each streams as streamData}
  <VideoPlayerComponent 
    {streamData} 
    memorialData={memorial}
    mode="public"
    showControls={false}
    autoSync={true}
  />
{/each}
```

### **Admin Dashboard:**
```svelte
<script>
  import VideoPlayerComponent from '$lib/components/VideoPlayerComponent.svelte'
  
  let { streams, memorial } = $props()
</script>

{#each streams as streamData}
  <VideoPlayerComponent 
    {streamData} 
    memorialData={memorial}
    mode="admin"
    showControls={true}
    autoSync={true}
  />
{/each}
```

### **Mobile Streaming:**
```svelte
<script>
  import VideoPlayerComponent from '$lib/components/VideoPlayerComponent.svelte'
  
  let { streamData, memorial } = $props()
</script>

<VideoPlayerComponent 
  {streamData} 
  memorialData={memorial}
  mode="mobile"
  showControls={true}
  autoSync={true}
/>
```

---

## 🎯 **Benefits of This Architecture**

### **1. Object-Oriented Design:**
- Clean inheritance hierarchy
- Reusable base functionality
- Specialized behavior in extended classes

### **2. Firebase Integration:**
- Automatic CRUD operations
- Real-time synchronization
- Consistent data structure

### **3. SvelteKit Compatibility:**
- Reactive state management
- Component-based UI
- Server-side rendering support

### **4. Scalability:**
- Easy to extend with new player types
- Modular component system
- Consistent API across all implementations

### **5. Maintainability:**
- Single source of truth for player logic
- Clear separation of concerns
- Type-safe with TypeScript

---

## 🚀 **Next Steps**

1. **Implement Base Classes** - Create the core VideoPlayer class structure
2. **Firebase Integration** - Set up CRUD operations and real-time listeners
3. **Component Development** - Build the SvelteKit component wrapper
4. **Extended Classes** - Implement MemorialVideoPlayer and LiveVideoPlayer
5. **Testing** - Create comprehensive tests for all functionality
6. **Documentation** - Document API methods and usage patterns

This architecture provides a solid foundation for all video streaming functionality while maintaining flexibility for future enhancements and integrations.
