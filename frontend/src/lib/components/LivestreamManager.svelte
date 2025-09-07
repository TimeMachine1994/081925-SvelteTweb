<script lang="ts">
  import { onMount } from 'svelte';
  import type { LivestreamSession } from '$lib/types/funeral-director';

  export let memorialId: string;
  export let canManage: boolean = false;

  let livestreams: LivestreamSession[] = [];
  let loading = true;
  let error = '';
  let showStartForm = false;

  let newStreamData = {
    title: '',
    description: '',
    streamProvider: 'custom' as 'youtube' | 'facebook' | 'custom',
    streamUrl: '',
    streamKey: '',
    isPublic: true,
    requiresPassword: false,
    password: ''
  };

  onMount(async () => {
    await loadLivestreams();
  });

  async function loadLivestreams() {
    try {
      const response = await fetch(`/api/memorials/${memorialId}/livestreams`);
      if (response.ok) {
        const data = await response.json();
        livestreams = data.livestreams;
      } else {
        error = 'Failed to load livestreams';
      }
    } catch (err) {
      error = 'Network error loading livestreams';
    } finally {
      loading = false;
    }
  }

  async function startLivestream() {
    try {
      const response = await fetch(`/api/memorials/${memorialId}/livestream/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStreamData)
      });

      if (response.ok) {
        showStartForm = false;
        newStreamData = {
          title: '',
          description: '',
          streamProvider: 'custom',
          streamUrl: '',
          streamKey: '',
          isPublic: true,
          requiresPassword: false,
          password: ''
        };
        await loadLivestreams();
      } else {
        const result = await response.json();
        error = result.error || 'Failed to start livestream';
      }
    } catch (err) {
      error = 'Network error starting livestream';
    }
  }

  async function endLivestream(streamId: string) {
    try {
      const response = await fetch(`/api/memorials/${memorialId}/livestream/${streamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended' })
      });

      if (response.ok) {
        await loadLivestreams();
      }
    } catch (err) {
      error = 'Failed to end livestream';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'live': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<div class="bg-white shadow rounded-lg p-6">
  <div class="flex justify-between items-center mb-4">
    <h3 class="text-lg font-semibold text-gray-900">Livestreams</h3>
    {#if canManage}
      <button
        on:click={() => showStartForm = !showStartForm}
        class="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
      >
        Start Livestream
      </button>
    {/if}
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
      <p class="text-red-800 text-sm">{error}</p>
    </div>
  {/if}

  {#if showStartForm}
    <div class="bg-gray-50 p-4 rounded-lg mb-6">
      <h4 class="font-medium text-gray-900 mb-3">Start New Livestream</h4>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            bind:value={newStreamData.title}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            placeholder="Memorial Service Livestream"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            bind:value={newStreamData.description}
            rows="2"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Stream Provider</label>
            <select
              bind:value={newStreamData.streamProvider}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            >
              <option value="custom">Custom/RTMP</option>
              <option value="youtube">YouTube</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Stream Key/URL</label>
            <input
              type="text"
              bind:value={newStreamData.streamKey}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              placeholder="Enter stream key or URL"
            />
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <label class="flex items-center">
            <input
              type="checkbox"
              bind:checked={newStreamData.isPublic}
              class="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200"
            />
            <span class="ml-2 text-sm text-gray-700">Public stream</span>
          </label>

          <label class="flex items-center">
            <input
              type="checkbox"
              bind:checked={newStreamData.requiresPassword}
              class="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200"
            />
            <span class="ml-2 text-sm text-gray-700">Require password</span>
          </label>
        </div>

        {#if newStreamData.requiresPassword}
          <div>
            <label class="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              bind:value={newStreamData.password}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            />
          </div>
        {/if}

        <div class="flex justify-end space-x-3">
          <button
            on:click={() => showStartForm = false}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            on:click={startLivestream}
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Start Stream
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
    </div>
  {:else if livestreams.length === 0}
    <div class="text-center py-8">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No livestreams</h3>
      <p class="mt-1 text-sm text-gray-500">
        {canManage ? 'Start your first livestream to share this memorial service.' : 'No livestreams are currently available.'}
      </p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each livestreams as stream}
        <div class="border border-gray-200 rounded-lg p-4">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-2">
                <h4 class="font-medium text-gray-900">{stream.title}</h4>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(stream.status)}">
                  {stream.status.toUpperCase()}
                </span>
              </div>
              
              {#if stream.description}
                <p class="text-sm text-gray-600 mb-2">{stream.description}</p>
              {/if}
              
              <div class="text-xs text-gray-500">
                Started: {new Date(stream.actualStartTime?.seconds * 1000).toLocaleString()}
                {#if stream.endTime}
                  • Ended: {new Date(stream.endTime.seconds * 1000).toLocaleString()}
                {/if}
              </div>

              {#if stream.analytics}
                <div class="flex space-x-4 mt-2 text-xs text-gray-500">
                  <span>Peak Viewers: {stream.analytics.peakViewers}</span>
                  <span>Total Views: {stream.analytics.totalViews}</span>
                </div>
              {/if}
            </div>

            <div class="flex space-x-2">
              {#if stream.status === 'live' && canManage}
                <button
                  on:click={() => endLivestream(stream.id)}
                  class="text-red-600 hover:text-red-900 text-sm font-medium"
                >
                  End Stream
                </button>
              {/if}
              
              {#if stream.status === 'live'}
                <button class="text-blue-600 hover:text-blue-900 text-sm font-medium">
                  Watch Live
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
