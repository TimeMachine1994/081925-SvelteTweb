# Admin Memorial Details Page - Mux Integration Example

**Date:** January 22, 2026  
**Purpose:** Example code for integrating Mux analytics and chat moderation into the admin memorial details page

---

## Overview

This document provides example code for adding Mux streaming analytics and chat moderation tabs to the admin memorial details page (`admin/services/memorials/[memorialId]`).

---

## Tab-Based Layout Example

### 1. Add New Tab State

```typescript
// In admin/services/memorials/[memorialId]/+page.svelte

let activeTab = $state<'info' | 'streams' | 'analytics' | 'moderation' | 'slideshows' | 'payment'>('info');
let selectedStreamForAnalytics = $state<Stream | null>(null);
let selectedStreamForModeration = $state<Stream | null>(null);
```

### 2. Import Mux Components

```typescript
import StreamAnalyticsDashboard from '$lib/components/streaming/StreamAnalyticsDashboard.svelte';
import ChatModerationPanel from '$lib/components/streaming/ChatModerationPanel.svelte';
```

### 3. Add Tab Navigation

```svelte
<div class="tabs-container">
  <button 
    class="tab-button" 
    class:active={activeTab === 'info'}
    onclick={() => activeTab = 'info'}
  >
    📋 Basic Info
  </button>
  
  <button 
    class="tab-button" 
    class:active={activeTab === 'streams'}
    onclick={() => activeTab = 'streams'}
  >
    🎬 Livestreams
  </button>
  
  <!-- NEW: Analytics Tab -->
  <button 
    class="tab-button" 
    class:active={activeTab === 'analytics'}
    onclick={() => activeTab = 'analytics'}
  >
    📊 Analytics
  </button>
  
  <!-- NEW: Moderation Tab -->
  <button 
    class="tab-button" 
    class:active={activeTab === 'moderation'}
    onclick={() => activeTab = 'moderation'}
  >
    🛡️ Chat Moderation
  </button>
  
  <button 
    class="tab-button" 
    class:active={activeTab === 'slideshows'}
    onclick={() => activeTab = 'slideshows'}
  >
    📸 Slideshows
  </button>
  
  <button 
    class="tab-button" 
    class:active={activeTab === 'payment'}
    onclick={() => activeTab = 'payment'}
  >
    💳 Payment
  </button>
</div>
```

### 4. Add Analytics Tab Content

```svelte
{#if activeTab === 'analytics'}
  <div class="tab-content">
    <h2>Stream Analytics</h2>
    
    {#if streams.length === 0}
      <div class="empty-state">
        <p>No streams available for analytics.</p>
        <p class="help-text">Create a stream to view analytics.</p>
      </div>
    {:else}
      <!-- Stream Selector -->
      <div class="stream-selector">
        <label for="analytics-stream">Select Stream:</label>
        <select 
          id="analytics-stream" 
          onchange={(e) => {
            const streamId = e.target.value;
            selectedStreamForAnalytics = streams.find(s => s.id === streamId) || null;
          }}
        >
          <option value="">Choose a stream...</option>
          {#each streams as stream}
            <option value={stream.id}>
              {stream.title} - {stream.status}
            </option>
          {/each}
        </select>
      </div>
      
      <!-- Analytics Dashboard -->
      {#if selectedStreamForAnalytics}
        {#if selectedStreamForAnalytics.mux?.liveStreamId}
          <StreamAnalyticsDashboard 
            streamId={selectedStreamForAnalytics.id}
            isLive={selectedStreamForAnalytics.status === 'live'}
            refreshInterval={10000}
          />
        {:else}
          <div class="info-message">
            <p>⚠️ This stream uses legacy Cloudflare platform.</p>
            <p>Analytics are only available for Mux streams.</p>
            <p class="help-text">
              New streams will automatically use Mux platform with analytics.
            </p>
          </div>
        {/if}
      {:else}
        <div class="placeholder-message">
          <p>Select a stream above to view analytics.</p>
        </div>
      {/if}
    {/if}
  </div>
{/if}
```

### 5. Add Moderation Tab Content

```svelte
{#if activeTab === 'moderation'}
  <div class="tab-content">
    <h2>Chat Moderation</h2>
    
    {#if streams.length === 0}
      <div class="empty-state">
        <p>No streams available for moderation.</p>
        <p class="help-text">Create a stream with chat enabled to moderate messages.</p>
      </div>
    {:else}
      <!-- Stream Selector -->
      <div class="stream-selector">
        <label for="moderation-stream">Select Stream:</label>
        <select 
          id="moderation-stream"
          onchange={(e) => {
            const streamId = e.target.value;
            selectedStreamForModeration = streams.find(s => s.id === streamId) || null;
          }}
        >
          <option value="">Choose a stream...</option>
          {#each streams as stream}
            <option value={stream.id}>
              {stream.title} - {stream.chat?.enabled ? 'Chat Enabled' : 'Chat Disabled'}
            </option>
          {/each}
        </select>
      </div>
      
      <!-- Moderation Panel -->
      {#if selectedStreamForModeration}
        {#if selectedStreamForModeration.chat?.spaceId}
          <ChatModerationPanel streamId={selectedStreamForModeration.id} />
        {:else}
          <div class="info-message">
            <p>⚠️ This stream does not have chat enabled.</p>
            <p class="help-text">
              Chat is only available for Mux streams. New streams will automatically include chat capabilities.
            </p>
          </div>
        {/if}
      {:else}
        <div class="placeholder-message">
          <p>Select a stream above to moderate chat.</p>
        </div>
      {/if}
    {/if}
  </div>
{/if}
```

### 6. Add CSS Styling

```css
/* Tab Container */
.tabs-container {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 2rem;
  overflow-x: auto;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-button:hover {
  color: #111827;
  background: #f9fafb;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

/* Tab Content */
.tab-content {
  padding: 2rem 0;
}

.tab-content h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

/* Stream Selector */
.stream-selector {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.stream-selector label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.stream-selector select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
}

.stream-selector select:focus {
  outline: none;
  border-color: #3b82f6;
  ring: 2px;
  ring-color: #93c5fd;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 2px dashed #d1d5db;
}

.empty-state p {
  margin: 0.5rem 0;
  color: #6b7280;
}

.help-text {
  font-size: 0.875rem;
  color: #9ca3af !important;
}

/* Info Message */
.info-message {
  padding: 1.5rem;
  background: #fef3c7;
  border: 1px solid #fde047;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.info-message p {
  margin: 0.5rem 0;
  color: #92400e;
}

/* Placeholder Message */
.placeholder-message {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

.placeholder-message p {
  margin: 0;
  font-size: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .tabs-container {
    gap: 0.25rem;
  }
  
  .tab-button {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
  }
  
  .stream-selector {
    padding: 1rem;
  }
}
```

---

## Alternative: Inline Analytics in Stream Cards

If you prefer to show analytics directly in the StreamCard component instead of a separate tab:

```svelte
<!-- In StreamCard.svelte -->

{#if stream.mux?.liveStreamId && stream.status === 'live'}
  <div class="inline-analytics">
    <h4>Live Analytics</h4>
    <div class="analytics-grid">
      <div class="metric">
        <span class="metric-label">Current Viewers</span>
        <span class="metric-value" id="viewer-count-{stream.id}">
          Loading...
        </span>
      </div>
      <div class="metric">
        <span class="metric-label">Chat Messages</span>
        <span class="metric-value">
          {stream.chat?.messageCount || 0}
        </span>
      </div>
    </div>
    <button 
      onclick={() => {
        activeTab = 'analytics';
        selectedStreamForAnalytics = stream;
      }}
      class="view-full-analytics"
    >
      📊 View Full Analytics
    </button>
  </div>
{/if}
```

---

## Quick Actions in Stream List

Add quick action buttons to each stream for common tasks:

```svelte
<!-- Add to StreamCard.svelte actions section -->

{#if stream.mux?.liveStreamId}
  <div class="quick-actions">
    {#if stream.status === 'live'}
      <button 
        onclick={() => {
          activeTab = 'analytics';
          selectedStreamForAnalytics = stream;
        }}
        class="action-btn analytics-btn"
      >
        📊 Analytics
      </button>
    {/if}
    
    {#if stream.chat?.enabled}
      <button 
        onclick={() => {
          activeTab = 'moderation';
          selectedStreamForModeration = stream;
        }}
        class="action-btn moderation-btn"
      >
        🛡️ Moderate Chat
      </button>
      
      <button 
        onclick={() => toggleChat(stream.id, !stream.chat.enabled)}
        class="action-btn chat-toggle-btn"
      >
        {stream.chat.enabled ? '🔇 Disable' : '🔊 Enable'} Chat
      </button>
    {/if}
  </div>
{/if}
```

```typescript
// Add toggle chat function
async function toggleChat(streamId: string, enabled: boolean) {
  try {
    const response = await fetch(`/api/streams/${streamId}/chat/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    
    if (response.ok) {
      // Refresh page or update local state
      window.location.reload();
    } else {
      alert('Failed to toggle chat');
    }
  } catch (error) {
    console.error('Error toggling chat:', error);
    alert('Failed to toggle chat');
  }
}
```

---

## Real-Time Analytics Updates

For live streams, you can add real-time viewer count updates:

```typescript
// Add to page script
let analyticsInterval: NodeJS.Timeout;

onMount(() => {
  // Poll analytics for live streams every 10 seconds
  analyticsInterval = setInterval(async () => {
    const liveStreams = streams.filter(s => s.status === 'live' && s.mux?.liveStreamId);
    
    for (const stream of liveStreams) {
      try {
        const response = await fetch(`/api/streams/${stream.id}/analytics`);
        const data = await response.json();
        
        // Update viewer count display
        const element = document.getElementById(`viewer-count-${stream.id}`);
        if (element) {
          element.textContent = data.realTime.viewerCount.toString();
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    }
  }, 10000);
  
  return () => {
    if (analyticsInterval) clearInterval(analyticsInterval);
  };
});
```

---

## Complete Example Integration

Here's a minimal complete example showing all pieces together:

```svelte
<script lang="ts">
  import type { Stream } from '$lib/types/stream';
  import StreamAnalyticsDashboard from '$lib/components/streaming/StreamAnalyticsDashboard.svelte';
  import ChatModerationPanel from '$lib/components/streaming/ChatModerationPanel.svelte';
  
  let { streams }: { streams: Stream[] } = $props();
  
  let activeTab = $state<'streams' | 'analytics' | 'moderation'>('streams');
  let selectedStream = $state<Stream | null>(null);
</script>

<div class="admin-page">
  <!-- Tab Navigation -->
  <nav class="tabs">
    <button class:active={activeTab === 'streams'} onclick={() => activeTab = 'streams'}>
      🎬 Streams
    </button>
    <button class:active={activeTab === 'analytics'} onclick={() => activeTab = 'analytics'}>
      📊 Analytics
    </button>
    <button class:active={activeTab === 'moderation'} onclick={() => activeTab = 'moderation'}>
      🛡️ Moderation
    </button>
  </nav>
  
  <!-- Tab Content -->
  {#if activeTab === 'analytics'}
    <div class="tab-panel">
      <select onchange={(e) => selectedStream = streams.find(s => s.id === e.target.value) || null}>
        <option value="">Select stream...</option>
        {#each streams as stream}
          <option value={stream.id}>{stream.title}</option>
        {/each}
      </select>
      
      {#if selectedStream?.mux?.liveStreamId}
        <StreamAnalyticsDashboard 
          streamId={selectedStream.id}
          isLive={selectedStream.status === 'live'}
        />
      {/if}
    </div>
  {:else if activeTab === 'moderation'}
    <div class="tab-panel">
      <select onchange={(e) => selectedStream = streams.find(s => s.id === e.target.value) || null}>
        <option value="">Select stream...</option>
        {#each streams as stream}
          <option value={stream.id}>{stream.title}</option>
        {/each}
      </select>
      
      {#if selectedStream?.chat?.spaceId}
        <ChatModerationPanel streamId={selectedStream.id} />
      {/if}
    </div>
  {:else}
    <!-- Existing streams tab content -->
  {/if}
</div>
```

---

## Testing Checklist

After implementing the admin page integration:

- [ ] Analytics tab displays for Mux streams
- [ ] Analytics updates in real-time for live streams
- [ ] Moderation tab shows chat messages
- [ ] Delete message functionality works
- [ ] Chat toggle functionality works
- [ ] Stream selector filters correctly
- [ ] Empty states display appropriately
- [ ] Legacy Cloudflare streams show appropriate messages
- [ ] Mobile responsive layout works
- [ ] Tab navigation persists selection

---

**END OF EXAMPLE**
