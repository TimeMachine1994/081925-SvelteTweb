# Backend Memorial Stream Objects & Frontend Player Architecture
## Bidirectional Streaming System with Source/Output Object Relationships

### 📋 **Overview**
This document outlines a comprehensive object-oriented architecture for memorial streaming that supports **bidirectional workflows** - objects can be both **stream sources** (inputs) and **stream outputs** (destinations). This enables complex streaming scenarios like browser-to-OBS workflows and multi-source memorial services.

---

## 🏗️ **Core Object Architecture**

### **1. VideoPlayerObject (Frontend Orchestrator)**
```javascript
// /lib/classes/VideoPlayerObject.js
export class VideoPlayerObject {
  constructor(data = {}) {
    // Core Identity
    this.id = data.id || generateId()
    this.memorialId = data.memorialId
    this.title = data.title || 'Memorial Service'
    
    // Object Relationships
    this.streamSources = [] // Input streams (camera, WHIP sources)
    this.streamOutputs = [] // Output streams (RTMP destinations, recordings)
    this.recordings = []    // All recordings from any source
    
    // Visibility & Access
    this.isVisible = data.isVisible !== false
    this.isAutoHidden = data.isAutoHidden || false // Auto-hide source streams
    
    // Current State
    this.status = data.status || 'ready' // 'ready' | 'live' | 'completed'
    this.activeSourceId = null
    this.activeOutputId = null
  }
  
  // Source Management (Inputs)
  async createCameraSource() {
    const cameraSource = new CameraSourceObject(this.id)
    await cameraSource.requestAccess()
    this.streamSources.push(cameraSource)
    return cameraSource
  }
  
  async createWHIPSource() {
    const whipSource = new WHIPSourceObject(this.id)
    await whipSource.initialize()
    this.streamSources.push(whipSource)
    return whipSource
  }
  
  // Output Management (Destinations)
  async createRTMPOutput() {
    const rtmpOutput = new RTMPOutputObject(this.id)
    await rtmpOutput.generateCredentials()
    this.streamOutputs.push(rtmpOutput)
    return rtmpOutput
  }
  
  async createRecordingOutput() {
    const recordingOutput = new RecordingOutputObject(this.id)
    this.streamOutputs.push(recordingOutput)
    return recordingOutput
  }
  
  // Workflow Methods
  async connectSourceToOutput(sourceId, outputId) {
    const source = this.getSource(sourceId)
    const output = this.getOutput(outputId)
    return await source.connectTo(output)
  }
  
  async goLive() {
    this.status = 'live'
    // Activate all connected source→output pairs
    for (const source of this.streamSources) {
      if (source.isActive) {
        await source.startStreaming()
      }
    }
    await this.save()
  }
}
```

---

## 🎥 **Stream Source Objects (Inputs)**

### **CameraSourceObject**
```javascript
// /lib/classes/CameraSourceObject.js
export class CameraSourceObject extends StreamSourceBase {
  constructor(videoPlayerId) {
    super(videoPlayerId, 'camera')
    
    // Camera Configuration
    this.mediaStream = null
    this.videoConstraints = {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 }
    }
    this.audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
    
    // WHIP Streaming (Browser → OBS)
    this.whipEndpoint = null
    this.whipConnection = null
    
    // Auto-hide by default (not visible to public)
    this.isVisible = false
    this.isAutoHidden = true
  }
  
  async requestAccess() {
    try {
      console.log('📹 [CAMERA_SOURCE] Requesting camera/microphone access...')
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: this.videoConstraints,
        audio: this.audioConstraints
      })
      
      // Generate WHIP endpoint for OBS input
      await this.generateWHIPEndpoint()
      
      this.status = 'ready'
      await this.save()
      
      console.log('✅ [CAMERA_SOURCE] Camera access granted, WHIP endpoint ready')
      return {
        mediaStream: this.mediaStream,
        whipEndpoint: this.whipEndpoint
      }
    } catch (error) {
      this.handleCameraError(error)
      throw error
    }
  }
  
  async generateWHIPEndpoint() {
    // Create Cloudflare Live Input for WHIP streaming
    const response = await fetch(`/api/streams/${this.videoPlayerId}/whip-source`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceType: 'camera',
        sourceId: this.id
      })
    })
    
    const result = await response.json()
    this.whipEndpoint = result.whipEndpoint
    this.cloudflareId = result.cloudflareId
    
    console.log('📡 [CAMERA_SOURCE] WHIP endpoint generated:', this.whipEndpoint)
  }
  
  async connectToOBS() {
    // Start WHIP streaming to generated endpoint
    if (!this.mediaStream || !this.whipEndpoint) {
      throw new Error('Camera not ready or WHIP endpoint missing')
    }
    
    // WebRTC WHIP connection logic
    this.whipConnection = new RTCPeerConnection()
    
    // Add media tracks
    this.mediaStream.getTracks().forEach(track => {
      this.whipConnection.addTrack(track, this.mediaStream)
    })
    
    // Connect to WHIP endpoint
    await this.establishWHIPConnection()
    
    this.status = 'streaming'
    await this.save()
  }
  
  getOBSSourceURL() {
    // Return HLS URL that OBS can use as Media Source
    return `https://customer-${CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com/${this.cloudflareId}/manifest/video.m3u8`
  }
}
```

### **WHIPSourceObject**
```javascript
// /lib/classes/WHIPSourceObject.js
export class WHIPSourceObject extends StreamSourceBase {
  constructor(videoPlayerId) {
    super(videoPlayerId, 'whip')
    
    // WHIP Configuration
    this.whipEndpoint = null
    this.publishUrl = null
    this.playbackUrl = null
    
    // Auto-hide by default
    this.isVisible = false
    this.isAutoHidden = true
  }
  
  async initialize() {
    // Create Cloudflare Live Input for external WHIP publishing
    const response = await fetch(`/api/streams/${this.videoPlayerId}/whip-input`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceType: 'whip',
        sourceId: this.id
      })
    })
    
    const result = await response.json()
    this.whipEndpoint = result.whipEndpoint
    this.publishUrl = result.publishUrl
    this.playbackUrl = result.playbackUrl
    this.cloudflareId = result.cloudflareId
    
    this.status = 'ready'
    await this.save()
    
    return {
      whipEndpoint: this.whipEndpoint,
      publishUrl: this.publishUrl
    }
  }
  
  getOBSSourceURL() {
    // Return HLS URL for OBS Media Source input
    return this.playbackUrl || `https://customer-${CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com/${this.cloudflareId}/manifest/video.m3u8`
  }
}
```

---

## 📡 **Stream Output Objects (Destinations)**

### **RTMPOutputObject**
```javascript
// /lib/classes/RTMPOutputObject.js
export class RTMPOutputObject extends StreamOutputBase {
  constructor(videoPlayerId) {
    super(videoPlayerId, 'rtmp')
    
    // RTMP Configuration
    this.serverUrl = null
    this.streamKey = null
    this.playbackUrl = null
    
    // Connection Monitoring
    this.isConnected = false
    this.connectionDetectedAt = null
    this.monitoringInterval = null
    
    // Always visible (this is the main output)
    this.isVisible = true
    this.isAutoHidden = false
  }
  
  async generateCredentials() {
    // Create Cloudflare Live Input for RTMP publishing
    const response = await fetch(`/api/streams/${this.videoPlayerId}/rtmp-output`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outputType: 'rtmp',
        outputId: this.id
      })
    })
    
    const result = await response.json()
    this.serverUrl = result.serverUrl
    this.streamKey = result.streamKey
    this.playbackUrl = result.playbackUrl
    this.cloudflareId = result.cloudflareId
    
    this.status = 'ready'
    await this.save()
    
    // Start monitoring for external connection
    this.startConnectionMonitoring()
    
    return {
      serverUrl: this.serverUrl,
      streamKey: this.streamKey
    }
  }
  
  startConnectionMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      const isLive = await this.checkLiveStatus()
      if (isLive && !this.isConnected) {
        await this.onConnectionDetected()
      }
    }, 5000)
  }
  
  async onConnectionDetected() {
    this.isConnected = true
    this.connectionDetectedAt = new Date()
    this.status = 'live'
    
    // Update parent VideoPlayer
    const videoPlayer = await VideoPlayerObject.load(this.videoPlayerId)
    await videoPlayer.goLive()
    
    // Create recording automatically
    await this.createRecording()
    
    await this.save()
  }
}
```

### **RecordingOutputObject**
```javascript
// /lib/classes/RecordingOutputObject.js
export class RecordingOutputObject extends StreamOutputBase {
  constructor(videoPlayerId, sourceId = null) {
    super(videoPlayerId, 'recording')
    
    // Recording Configuration
    this.sourceId = sourceId // Which source created this recording
    this.sourceType = null   // 'camera' | 'whip' | 'rtmp' | 'upload'
    this.cloudflareId = null
    this.recordingUrl = null
    this.duration = null
    this.fileSize = null
    
    // Processing Status
    this.recordingReady = false
    this.processingStatus = 'pending' // 'pending' | 'processing' | 'ready' | 'failed'
    
    // Visibility (can be toggled)
    this.isVisible = true
    this.isAutoHidden = false
  }
  
  async createFromSource(sourceObject) {
    this.sourceId = sourceObject.id
    this.sourceType = sourceObject.type
    this.cloudflareId = sourceObject.cloudflareId
    
    // Start recording from source
    await this.startRecording()
  }
  
  async createFromUpload(file) {
    this.sourceType = 'upload'
    
    // Upload to Cloudflare Stream
    const uploadResult = await this.uploadToCloudflare(file)
    this.cloudflareId = uploadResult.cloudflareId
    this.recordingUrl = uploadResult.playbackUrl
    
    this.processingStatus = 'processing'
    await this.save()
  }
  
  async onRecordingReady(webhookData) {
    this.recordingReady = true
    this.processingStatus = 'ready'
    this.recordingUrl = webhookData.playbackUrl
    this.duration = webhookData.duration
    this.fileSize = webhookData.size
    
    await this.save()
  }
}
```

---

## 🔗 **Object Relationships & Workflows**

### **Workflow 1: Browser Camera → OBS Source**
```javascript
// User clicks "Request Camera Access"
const videoPlayer = new VideoPlayerObject(streamData)

// 1. Create camera source (auto-hidden)
const cameraSource = await videoPlayer.createCameraSource()
// Result: Camera access + WHIP endpoint for OBS

// 2. User adds Media Source in OBS using:
const obsSourceURL = cameraSource.getOBSSourceURL()
// "https://customer-xyz.cloudflarestream.com/abc123/manifest/video.m3u8"

// 3. Camera source is hidden from public (isAutoHidden: true)
// 4. OBS can now use browser camera as input source
```

### **Workflow 2: OBS → RTMP Output → Public Stream**
```javascript
// User clicks "Request RTMP Settings"  
const rtmpOutput = await videoPlayer.createRTMPOutput()

// 1. Generate RTMP credentials
const credentials = await rtmpOutput.generateCredentials()
// Result: serverUrl + streamKey for OBS

// 2. User configures OBS Stream settings
// 3. When OBS starts streaming, system detects connection
await rtmpOutput.onConnectionDetected()

// 4. VideoPlayer goes live, creates recording
await videoPlayer.goLive()
const recording = await rtmpOutput.createRecording()

// 5. Public sees live stream + recording when ready
```

### **Workflow 3: Multi-Source Memorial Service**
```javascript
const videoPlayer = new VideoPlayerObject(streamData)

// Create multiple sources
const cameraSource = await videoPlayer.createCameraSource()    // Browser camera
const whipSource = await videoPlayer.createWHIPSource()        // External WHIP
const uploadSource = await videoPlayer.createUploadSource()    // Pre-recorded video

// Create outputs
const rtmpOutput = await videoPlayer.createRTMPOutput()        // Live stream
const recordingOutput = await videoPlayer.createRecordingOutput() // Archive

// Connect sources to outputs (OBS handles mixing)
await videoPlayer.connectSourceToOutput(cameraSource.id, rtmpOutput.id)
await videoPlayer.connectSourceToOutput(whipSource.id, recordingOutput.id)

// All sources are auto-hidden, only final output is visible to public
```

---

## 🎨 **Clean UI Architecture**

### **Minimal Button Interface**
```svelte
<!-- Clean, Essential Buttons Only -->
<div class="stream-controls">
  {#if !hasActiveSources && !hasActiveOutputs}
    <!-- Initial State: Choose workflow -->
    <button onclick={requestCameraAccess} class="btn-camera">
      📹 Camera Source
    </button>
    
    <button onclick={requestRTMPOutput} class="btn-rtmp">
      📡 RTMP Stream
    </button>
  {/if}
  
  {#if hasActiveSources}
    <!-- Show source management -->
    <div class="source-panel">
      {#each videoPlayer.streamSources as source}
        <SourceCard {source} />
      {/each}
    </div>
  {/if}
  
  {#if hasActiveOutputs}
    <!-- Show output management -->
    <div class="output-panel">
      {#each videoPlayer.streamOutputs as output}
        <OutputCard {output} />
      {/each}
    </div>
  {/if}
</div>
```

### **Auto-Hide Logic**
```javascript
// Sources are auto-hidden by default
class StreamSourceBase {
  constructor() {
    this.isVisible = false      // Hidden from public
    this.isAutoHidden = true    // System-managed visibility
  }
}

// Outputs are visible by default  
class StreamOutputBase {
  constructor() {
    this.isVisible = true       // Visible to public
    this.isAutoHidden = false   // User-managed visibility
  }
}

// Memorial page only shows visible, non-auto-hidden objects
const publicStreams = allObjects.filter(obj => 
  obj.isVisible && !obj.isAutoHidden
)
```

---

## 📊 **Firebase Collections Structure**

### **Collections:**
```javascript
// Core Objects
video_players/           // VideoPlayerObject instances
stream_sources/          // All source objects (camera, WHIP, upload)
stream_outputs/          // All output objects (RTMP, recording)

// Relationships
source_output_connections/  // Which sources connect to which outputs
stream_sessions/           // Individual streaming sessions
recording_metadata/        // Recording processing status

// Legacy (for migration)
streams/                   // Old unified streams (migrate to new structure)
```

### **Data Structure:**
```javascript
// video_players/{id}
{
  id: "vp_abc123",
  memorialId: "mem_def456", 
  title: "Memorial Service",
  status: "live",
  
  // Object References
  sourceIds: ["src_camera_1", "src_whip_2"],
  outputIds: ["out_rtmp_1", "out_rec_1"],
  recordingIds: ["rec_1", "rec_2"],
  
  // Visibility
  isVisible: true,
  isAutoHidden: false,
  
  // Timestamps
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T01:00:00Z"
}

// stream_sources/{id}  
{
  id: "src_camera_1",
  type: "camera",
  videoPlayerId: "vp_abc123",
  
  // Source-specific data
  whipEndpoint: "https://...",
  mediaConstraints: {...},
  
  // Auto-hidden
  isVisible: false,
  isAutoHidden: true,
  
  status: "streaming"
}

// stream_outputs/{id}
{
  id: "out_rtmp_1", 
  type: "rtmp",
  videoPlayerId: "vp_abc123",
  
  // Output-specific data
  serverUrl: "rtmp://...",
  streamKey: "abc123...",
  
  // User-controlled visibility
  isVisible: true,
  isAutoHidden: false,
  
  status: "live"
}
```

---

## 🚀 **Implementation Benefits**

### **1. Flexibility:**
- **Multiple workflows** supported (browser→OBS, OBS→stream, uploads, etc.)
- **Mix and match** sources and outputs
- **Auto-hide complexity** from public viewers

### **2. Scalability:**
- **Easy to add** new source types (mobile apps, external cameras)
- **Easy to add** new output types (YouTube, Facebook, etc.)
- **Clear object boundaries** for testing and debugging

### **3. User Experience:**
- **Clean, minimal UI** - no overwhelming buttons
- **Progressive disclosure** - show controls as needed
- **Auto-hide technical details** - sources hidden, outputs visible

### **4. Developer Experience:**
- **Clear object relationships** - easy to understand data flow
- **Type-safe interfaces** - consistent APIs across all objects
- **Modular architecture** - easy to extend and maintain

This architecture supports **professional streaming workflows** while maintaining **simplicity for basic users**! 🎬
