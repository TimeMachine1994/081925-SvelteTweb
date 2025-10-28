# MUX Bridge Test Component - Implementation Plan

## 🎯 **Overview**
Create a dedicated test component to validate the **Phone → Cloudflare → Bridge Server → MUX** recording pipeline for memorial livestreams.

## 🌉 **Architecture Flow**
```
📱 Phone Browser
    ↓ (WHIP Protocol)
☁️ Cloudflare Stream
    ↓ (HLS/RTMP Output)
🌉 Bridge Server
    ↓ (RTMP Input)
📹 MUX Live Stream
    ↓ (Auto Recording)
💾 MUX Recording Storage
```

---

## 📋 **Implementation Steps**

### **Step 1: Create MuxBridgeTestCard Component**

#### **File Location**
```
frontend/src/lib/components/MuxBridgeTestCard.svelte
```

#### **Component Structure**
```typescript
<script lang="ts">
  // State management
  let testPhase = $state<'idle' | 'connecting' | 'streaming' | 'recording' | 'complete' | 'error'>('idle');
  let cloudflareStreamId = $state<string>('');
  let muxStreamId = $state<string>('');
  let bridgeStatus = $state<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  let recordingDuration = $state<string>('00:00');
  let logs = $state<string[]>([]);
  
  // Test results
  let testResults = $state({
    cloudflareConnection: false,
    bridgeConnection: false,
    muxIngestion: false,
    recordingActive: false,
    playbackAvailable: false
  });
</script>
```

---

### **Step 2: Cloudflare Stream Validation**

#### **Function: validateCloudflareStream()**
```typescript
async function validateCloudflareStream(streamId: string) {
  addLog('🔍 [CF-VALIDATE] Starting Cloudflare stream validation...');
  addLog(`📋 [CF-VALIDATE] Stream ID: ${streamId}`);
  
  try {
    // Check if stream exists and is live
    const response = await fetch(`/api/streams/${streamId}/status`);
    addLog(`📡 [CF-VALIDATE] API Response Status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.statusText}`);
    }
    
    const streamData = await response.json();
    addLog(`📊 [CF-VALIDATE] Stream Data:`, JSON.stringify(streamData, null, 2));
    
    if (streamData.status !== 'live') {
      throw new Error(`Stream not live. Current status: ${streamData.status}`);
    }
    
    // Get HLS URL for bridge connection
    const hlsUrl = `https://customer-${streamData.customerCode}.cloudflarestream.com/${streamId}/manifest/video.m3u8`;
    addLog(`🎥 [CF-VALIDATE] HLS URL Generated: ${hlsUrl}`);
    
    // Test HLS accessibility
    const hlsResponse = await fetch(hlsUrl, { method: 'HEAD' });
    addLog(`🎥 [CF-VALIDATE] HLS Accessibility Test: ${hlsResponse.status}`);
    
    if (hlsResponse.ok) {
      addLog('✅ [CF-VALIDATE] Cloudflare stream validation successful');
      testResults.cloudflareConnection = true;
      return { success: true, hlsUrl, streamData };
    } else {
      throw new Error(`HLS not accessible: ${hlsResponse.status}`);
    }
    
  } catch (error) {
    addLog(`❌ [CF-VALIDATE] Cloudflare validation failed: ${error.message}`);
    testResults.cloudflareConnection = false;
    return { success: false, error: error.message };
  }
}
```

---

### **Step 3: MUX Live Stream Creation**

#### **Function: createMuxLiveStream()**
```typescript
async function createMuxLiveStream() {
  addLog('🎬 [MUX-CREATE] Creating MUX live stream...');
  
  try {
    const response = await fetch('/api/mux/create-live-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playback_policy: ['public'],
        new_asset_settings: {
          playback_policy: ['public']
        }
      })
    });
    
    addLog(`📡 [MUX-CREATE] MUX API Response Status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      addLog(`❌ [MUX-CREATE] MUX API Error Response: ${errorData}`);
      throw new Error(`MUX API error: ${response.statusText}`);
    }
    
    const muxData = await response.json();
    addLog(`📊 [MUX-CREATE] MUX Stream Data:`, JSON.stringify(muxData, null, 2));
    
    const streamId = muxData.data.id;
    const rtmpUrl = muxData.data.stream_key;
    const playbackIds = muxData.data.playback_ids;
    
    addLog(`🆔 [MUX-CREATE] MUX Stream ID: ${streamId}`);
    addLog(`🔑 [MUX-CREATE] RTMP Stream Key: ${rtmpUrl}`);
    addLog(`📺 [MUX-CREATE] Playback IDs: ${JSON.stringify(playbackIds)}`);
    
    muxStreamId = streamId;
    
    addLog('✅ [MUX-CREATE] MUX live stream created successfully');
    return { success: true, streamId, rtmpUrl, playbackIds };
    
  } catch (error) {
    addLog(`❌ [MUX-CREATE] MUX stream creation failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}
```

---

### **Step 4: Bridge Server Connection**

#### **Function: startBridgeConnection()**
```typescript
async function startBridgeConnection(cloudflareHlsUrl: string, muxRtmpUrl: string) {
  addLog('🌉 [BRIDGE] Starting bridge server connection...');
  addLog(`📥 [BRIDGE] Input (Cloudflare HLS): ${cloudflareHlsUrl}`);
  addLog(`📤 [BRIDGE] Output (MUX RTMP): ${muxRtmpUrl}`);
  
  bridgeStatus = 'connecting';
  
  try {
    const response = await fetch('/api/bridge/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputUrl: cloudflareHlsUrl,
        outputUrl: muxRtmpUrl,
        streamId: cloudflareStreamId
      })
    });
    
    addLog(`📡 [BRIDGE] Bridge API Response Status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      addLog(`❌ [BRIDGE] Bridge API Error: ${errorData}`);
      throw new Error(`Bridge API error: ${response.statusText}`);
    }
    
    const bridgeData = await response.json();
    addLog(`📊 [BRIDGE] Bridge Response:`, JSON.stringify(bridgeData, null, 2));
    
    if (bridgeData.success) {
      bridgeStatus = 'connected';
      testResults.bridgeConnection = true;
      addLog('✅ [BRIDGE] Bridge connection established successfully');
      
      // Start monitoring bridge health
      startBridgeMonitoring();
      
      return { success: true, bridgeData };
    } else {
      throw new Error(bridgeData.error || 'Bridge connection failed');
    }
    
  } catch (error) {
    bridgeStatus = 'error';
    testResults.bridgeConnection = false;
    addLog(`❌ [BRIDGE] Bridge connection failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}
```

---

### **Step 5: MUX Ingestion Monitoring**

#### **Function: monitorMuxIngestion()**
```typescript
async function monitorMuxIngestion() {
  addLog('👁️ [MUX-MONITOR] Starting MUX ingestion monitoring...');
  
  const monitoringInterval = setInterval(async () => {
    try {
      addLog(`🔍 [MUX-MONITOR] Checking MUX stream status: ${muxStreamId}`);
      
      const response = await fetch(`/api/mux/stream-status/${muxStreamId}`);
      addLog(`📡 [MUX-MONITOR] MUX Status API Response: ${response.status}`);
      
      if (!response.ok) {
        addLog(`⚠️ [MUX-MONITOR] MUX API error: ${response.statusText}`);
        return;
      }
      
      const statusData = await response.json();
      addLog(`📊 [MUX-MONITOR] MUX Status:`, JSON.stringify(statusData, null, 2));
      
      const streamStatus = statusData.data.status;
      const isActive = statusData.data.recent_asset_ids?.length > 0;
      
      addLog(`📈 [MUX-MONITOR] Stream Status: ${streamStatus}`);
      addLog(`🎥 [MUX-MONITOR] Active Recording: ${isActive}`);
      
      if (streamStatus === 'active') {
        testResults.muxIngestion = true;
        addLog('✅ [MUX-MONITOR] MUX ingestion confirmed - stream is active');
      }
      
      if (isActive) {
        testResults.recordingActive = true;
        addLog('✅ [MUX-MONITOR] Recording confirmed - asset being created');
        
        // Check for playback availability
        await checkMuxPlayback(statusData.data.recent_asset_ids[0]);
      }
      
    } catch (error) {
      addLog(`❌ [MUX-MONITOR] Monitoring error: ${error.message}`);
    }
  }, 5000); // Check every 5 seconds
  
  // Store interval ID for cleanup
  return monitoringInterval;
}
```

---

### **Step 6: Recording Playback Verification**

#### **Function: checkMuxPlayback()**
```typescript
async function checkMuxPlayback(assetId: string) {
  addLog(`🎬 [MUX-PLAYBACK] Checking playback for asset: ${assetId}`);
  
  try {
    const response = await fetch(`/api/mux/asset-status/${assetId}`);
    addLog(`📡 [MUX-PLAYBACK] Asset API Response: ${response.status}`);
    
    if (!response.ok) {
      addLog(`⚠️ [MUX-PLAYBACK] Asset API error: ${response.statusText}`);
      return;
    }
    
    const assetData = await response.json();
    addLog(`📊 [MUX-PLAYBACK] Asset Data:`, JSON.stringify(assetData, null, 2));
    
    const assetStatus = assetData.data.status;
    const playbackIds = assetData.data.playback_ids;
    const duration = assetData.data.duration;
    
    addLog(`📈 [MUX-PLAYBACK] Asset Status: ${assetStatus}`);
    addLog(`⏱️ [MUX-PLAYBACK] Duration: ${duration} seconds`);
    addLog(`📺 [MUX-PLAYBACK] Playback IDs: ${JSON.stringify(playbackIds)}`);
    
    if (assetStatus === 'ready' && playbackIds?.length > 0) {
      const playbackUrl = `https://stream.mux.com/${playbackIds[0].id}.m3u8`;
      addLog(`🎥 [MUX-PLAYBACK] Playback URL: ${playbackUrl}`);
      
      testResults.playbackAvailable = true;
      addLog('✅ [MUX-PLAYBACK] Recording playback is available');
      
      return { success: true, playbackUrl, duration };
    } else {
      addLog(`⏳ [MUX-PLAYBACK] Asset not ready yet. Status: ${assetStatus}`);
      return { success: false, status: assetStatus };
    }
    
  } catch (error) {
    addLog(`❌ [MUX-PLAYBACK] Playback check failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}
```

---

### **Step 7: Bridge Health Monitoring**

#### **Function: startBridgeMonitoring()**
```typescript
async function startBridgeMonitoring() {
  addLog('💓 [BRIDGE-HEALTH] Starting bridge health monitoring...');
  
  const healthInterval = setInterval(async () => {
    try {
      addLog('🔍 [BRIDGE-HEALTH] Checking bridge server health...');
      
      const response = await fetch(`/api/bridge/health/${cloudflareStreamId}`);
      addLog(`📡 [BRIDGE-HEALTH] Health API Response: ${response.status}`);
      
      if (!response.ok) {
        addLog(`⚠️ [BRIDGE-HEALTH] Health check failed: ${response.statusText}`);
        bridgeStatus = 'error';
        return;
      }
      
      const healthData = await response.json();
      addLog(`📊 [BRIDGE-HEALTH] Health Data:`, JSON.stringify(healthData, null, 2));
      
      const isHealthy = healthData.status === 'healthy';
      const inputConnected = healthData.input?.connected || false;
      const outputConnected = healthData.output?.connected || false;
      const bytesTransferred = healthData.stats?.bytesTransferred || 0;
      
      addLog(`💚 [BRIDGE-HEALTH] Overall Health: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
      addLog(`📥 [BRIDGE-HEALTH] Input Connected: ${inputConnected}`);
      addLog(`📤 [BRIDGE-HEALTH] Output Connected: ${outputConnected}`);
      addLog(`📊 [BRIDGE-HEALTH] Bytes Transferred: ${bytesTransferred}`);
      
      if (isHealthy && inputConnected && outputConnected) {
        bridgeStatus = 'connected';
        addLog('✅ [BRIDGE-HEALTH] Bridge is healthy and transferring data');
      } else {
        bridgeStatus = 'error';
        addLog('❌ [BRIDGE-HEALTH] Bridge health issues detected');
      }
      
    } catch (error) {
      addLog(`❌ [BRIDGE-HEALTH] Health monitoring error: ${error.message}`);
      bridgeStatus = 'error';
    }
  }, 10000); // Check every 10 seconds
  
  return healthInterval;
}
```

---

### **Step 8: Comprehensive Test Runner**

#### **Function: runFullBridgeTest()**
```typescript
async function runFullBridgeTest() {
  addLog('🚀 [TEST-RUNNER] Starting comprehensive bridge test...');
  addLog('📋 [TEST-RUNNER] Test sequence: CF Validation → MUX Creation → Bridge Connection → Recording Verification');
  
  testPhase = 'connecting';
  
  try {
    // Step 1: Validate Cloudflare stream
    addLog('📍 [TEST-RUNNER] Step 1/4: Validating Cloudflare stream...');
    const cfValidation = await validateCloudflareStream(cloudflareStreamId);
    
    if (!cfValidation.success) {
      throw new Error(`Cloudflare validation failed: ${cfValidation.error}`);
    }
    
    // Step 2: Create MUX live stream
    addLog('📍 [TEST-RUNNER] Step 2/4: Creating MUX live stream...');
    const muxCreation = await createMuxLiveStream();
    
    if (!muxCreation.success) {
      throw new Error(`MUX creation failed: ${muxCreation.error}`);
    }
    
    // Step 3: Start bridge connection
    addLog('📍 [TEST-RUNNER] Step 3/4: Starting bridge connection...');
    testPhase = 'streaming';
    const bridgeConnection = await startBridgeConnection(cfValidation.hlsUrl, muxCreation.rtmpUrl);
    
    if (!bridgeConnection.success) {
      throw new Error(`Bridge connection failed: ${bridgeConnection.error}`);
    }
    
    // Step 4: Monitor recording
    addLog('📍 [TEST-RUNNER] Step 4/4: Monitoring MUX recording...');
    testPhase = 'recording';
    const monitoringInterval = await monitorMuxIngestion();
    
    addLog('✅ [TEST-RUNNER] All test phases initiated successfully');
    addLog('👁️ [TEST-RUNNER] Monitoring active - check logs for real-time updates');
    
    testPhase = 'complete';
    return { success: true, monitoringInterval };
    
  } catch (error) {
    addLog(`❌ [TEST-RUNNER] Test failed: ${error.message}`);
    testPhase = 'error';
    return { success: false, error: error.message };
  }
}
```

---

### **Step 9: Utility Functions**

#### **Logging Function**
```typescript
function addLog(message: string, data?: any) {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;
  
  if (data) {
    console.log(logEntry, data);
    logs = [...logs, `${logEntry}\n${JSON.stringify(data, null, 2)}`];
  } else {
    console.log(logEntry);
    logs = [...logs, logEntry];
  }
  
  // Keep only last 100 log entries
  if (logs.length > 100) {
    logs = logs.slice(-100);
  }
}
```

#### **Cleanup Function**
```typescript
async function stopBridgeTest() {
  addLog('🛑 [CLEANUP] Stopping bridge test and cleaning up resources...');
  
  try {
    // Stop bridge server
    if (bridgeStatus === 'connected') {
      addLog('🌉 [CLEANUP] Stopping bridge server...');
      await fetch(`/api/bridge/stop/${cloudflareStreamId}`, { method: 'POST' });
      bridgeStatus = 'disconnected';
    }
    
    // Delete MUX stream
    if (muxStreamId) {
      addLog('🎬 [CLEANUP] Deleting MUX live stream...');
      await fetch(`/api/mux/delete-stream/${muxStreamId}`, { method: 'DELETE' });
      muxStreamId = '';
    }
    
    // Reset state
    testPhase = 'idle';
    testResults = {
      cloudflareConnection: false,
      bridgeConnection: false,
      muxIngestion: false,
      recordingActive: false,
      playbackAvailable: false
    };
    
    addLog('✅ [CLEANUP] Cleanup completed successfully');
    
  } catch (error) {
    addLog(`❌ [CLEANUP] Cleanup error: ${error.message}`);
  }
}
```

---

## 🎨 **UI Component Structure**

### **Main Component Template**
```svelte
<div class="mux-bridge-test-card bg-white rounded-lg shadow-lg p-6">
  <!-- Header -->
  <div class="mb-6">
    <h2 class="text-2xl font-bold text-gray-900 mb-2">MUX Bridge Test Component</h2>
    <p class="text-gray-600">Test Phone → Cloudflare → Bridge → MUX recording pipeline</p>
  </div>
  
  <!-- Test Controls -->
  <div class="mb-6">
    <div class="flex gap-4 mb-4">
      <input 
        bind:value={cloudflareStreamId} 
        placeholder="Enter Cloudflare Stream ID"
        class="flex-1 px-3 py-2 border rounded-lg"
      />
      <button 
        onclick={runFullBridgeTest}
        disabled={!cloudflareStreamId || testPhase !== 'idle'}
        class="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        {testPhase === 'idle' ? 'Start Test' : 'Testing...'}
      </button>
      <button 
        onclick={stopBridgeTest}
        disabled={testPhase === 'idle'}
        class="px-6 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
      >
        Stop Test
      </button>
    </div>
  </div>
  
  <!-- Status Dashboard -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
    <!-- Cloudflare Status -->
    <div class="bg-gray-50 p-4 rounded-lg">
      <h3 class="font-semibold mb-2">📱 Cloudflare Stream</h3>
      <div class="text-sm">
        <div class="flex items-center gap-2">
          <span class={testResults.cloudflareConnection ? 'text-green-600' : 'text-gray-400'}>
            {testResults.cloudflareConnection ? '✅' : '⭕'}
          </span>
          <span>Connection</span>
        </div>
      </div>
    </div>
    
    <!-- Bridge Status -->
    <div class="bg-gray-50 p-4 rounded-lg">
      <h3 class="font-semibold mb-2">🌉 Bridge Server</h3>
      <div class="text-sm">
        <div class="flex items-center gap-2">
          <span class={bridgeStatus === 'connected' ? 'text-green-600' : bridgeStatus === 'connecting' ? 'text-yellow-600' : 'text-gray-400'}>
            {bridgeStatus === 'connected' ? '✅' : bridgeStatus === 'connecting' ? '🟡' : '⭕'}
          </span>
          <span>{bridgeStatus}</span>
        </div>
      </div>
    </div>
    
    <!-- MUX Status -->
    <div class="bg-gray-50 p-4 rounded-lg">
      <h3 class="font-semibold mb-2">📹 MUX Recording</h3>
      <div class="text-sm">
        <div class="flex items-center gap-2">
          <span class={testResults.recordingActive ? 'text-green-600' : 'text-gray-400'}>
            {testResults.recordingActive ? '✅' : '⭕'}
          </span>
          <span>Recording</span>
        </div>
        <div class="flex items-center gap-2">
          <span class={testResults.playbackAvailable ? 'text-green-600' : 'text-gray-400'}>
            {testResults.playbackAvailable ? '✅' : '⭕'}
          </span>
          <span>Playback</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Console Logs -->
  <div class="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
    <div class="mb-2 text-white">🖥️ Console Output:</div>
    {#each logs as log}
      <div class="mb-1">{log}</div>
    {/each}
  </div>
</div>
```

---

## 🔌 **Integration into Streams Page**

### **Add to `/memorials/[id]/streams/+page.svelte`**
```svelte
<!-- Add import -->
<script>
  import MuxBridgeTestCard from '$lib/components/MuxBridgeTestCard.svelte';
  // ... existing imports
</script>

<!-- Add test component above streams grid -->
{#if data.user && (data.user.role === 'admin' || data.user.role === 'funeral_director')}
  <div class="mb-8">
    <MuxBridgeTestCard />
  </div>
{/if}
```

---

## 🚀 **Expected Console Output Example**

```
[14:32:15] 🚀 [TEST-RUNNER] Starting comprehensive bridge test...
[14:32:15] 📋 [TEST-RUNNER] Test sequence: CF Validation → MUX Creation → Bridge Connection → Recording Verification
[14:32:15] 📍 [TEST-RUNNER] Step 1/4: Validating Cloudflare stream...
[14:32:15] 🔍 [CF-VALIDATE] Starting Cloudflare stream validation...
[14:32:15] 📋 [CF-VALIDATE] Stream ID: abc123def456
[14:32:16] 📡 [CF-VALIDATE] API Response Status: 200
[14:32:16] 📊 [CF-VALIDATE] Stream Data: {"status":"live","customerCode":"xyz789",...}
[14:32:16] 🎥 [CF-VALIDATE] HLS URL Generated: https://customer-xyz789.cloudflarestream.com/abc123def456/manifest/video.m3u8
[14:32:17] 🎥 [CF-VALIDATE] HLS Accessibility Test: 200
[14:32:17] ✅ [CF-VALIDATE] Cloudflare stream validation successful
[14:32:17] 📍 [TEST-RUNNER] Step 2/4: Creating MUX live stream...
[14:32:17] 🎬 [MUX-CREATE] Creating MUX live stream...
[14:32:18] 📡 [MUX-CREATE] MUX API Response Status: 201
[14:32:18] 📊 [MUX-CREATE] MUX Stream Data: {"data":{"id":"mux123","stream_key":"rtmp://..."}}
[14:32:18] 🆔 [MUX-CREATE] MUX Stream ID: mux123
[14:32:18] 🔑 [MUX-CREATE] RTMP Stream Key: rtmp://global-live.mux.com/live/mux123
[14:32:18] ✅ [MUX-CREATE] MUX live stream created successfully
[14:32:18] 📍 [TEST-RUNNER] Step 3/4: Starting bridge connection...
[14:32:18] 🌉 [BRIDGE] Starting bridge server connection...
[14:32:18] 📥 [BRIDGE] Input (Cloudflare HLS): https://customer-xyz789.cloudflarestream.com/abc123def456/manifest/video.m3u8
[14:32:18] 📤 [BRIDGE] Output (MUX RTMP): rtmp://global-live.mux.com/live/mux123
[14:32:20] 📡 [BRIDGE] Bridge API Response Status: 200
[14:32:20] ✅ [BRIDGE] Bridge connection established successfully
[14:32:20] 💓 [BRIDGE-HEALTH] Starting bridge health monitoring...
[14:32:20] 📍 [TEST-RUNNER] Step 4/4: Monitoring MUX recording...
[14:32:20] 👁️ [MUX-MONITOR] Starting MUX ingestion monitoring...
[14:32:25] 🔍 [MUX-MONITOR] Checking MUX stream status: mux123
[14:32:25] 📡 [MUX-MONITOR] MUX Status API Response: 200
[14:32:25] 📈 [MUX-MONITOR] Stream Status: active
[14:32:25] ✅ [MUX-MONITOR] MUX ingestion confirmed - stream is active
[14:32:30] 🔍 [BRIDGE-HEALTH] Checking bridge server health...
[14:32:30] 💚 [BRIDGE-HEALTH] Overall Health: HEALTHY
[14:32:30] ✅ [BRIDGE-HEALTH] Bridge is healthy and transferring data
```

This comprehensive plan provides discrete steps with copious logging to debug every aspect of the MUX bridge integration!
