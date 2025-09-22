# Livestream Video Player Integration

## Problem
Current memorial pages have hardcoded video player that doesn't show live streams from Livestream Control Center.

## Solution

### 1. Create LivestreamPlayer Component
```svelte
<!-- LivestreamPlayer.svelte -->
<script lang="ts">
  let { memorial } = $props();
  let isLive = $state(false);
  let viewerCount = $state(0);

  onMount(async () => {
    const response = await fetch(`/api/memorials/${memorial.id}/livestream`);
    const data = await response.json();
    isLive = data.livestream?.isActive || false;
    viewerCount = data.livestream?.currentSession?.viewerCount || 0;
  });
</script>

{#if isLive}
  <div class="live-badge">🔴 LIVE • {viewerCount} viewers</div>
{/if}

{#if memorial.livestream?.playbackUrl}
  <iframe src={memorial.livestream.playbackUrl} allowfullscreen></iframe>
{:else}
  <div class="offline">Stream offline</div>
{/if}
```

### 2. Update Memorial Page
Replace hardcoded iframe in `[fullSlug]/+page.svelte`:
```svelte
<LivestreamPlayer {memorial} />
```

### 3. Fix Environment Variable
Use `CLOUDFLARE_CUSTOMER_CODE` from environment instead of hardcoded value.

### 4. Add Real-time Updates
Poll stream status every 30 seconds to update live indicator and viewer count.

## Result
Memorial pages will show live streams when funeral directors start them via Livestream Control Center.
