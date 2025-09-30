<script lang="ts">
  import { onMount } from 'svelte';
  import { streams, streamActions, loading, error } from '../../lib/stores/streamStore.js';
  import { streamAPI } from '../../lib/api/streamAPI.js';
  import MVPTwoButton from '../shared/MVPTwoButton.svelte';
  import MVPTwoModal from '../shared/MVPTwoModal.svelte';
  import MVPTwoStatusIndicator from '../shared/MVPTwoStatusIndicator.svelte';
  import MVPTwoStreamCreator from './MVPTwoStreamCreator.svelte';
  import MVPTwoStreamEditor from './MVPTwoStreamEditor.svelte';
  import type { MVPTwoStream } from '../../lib/types/streamTypes.js';

  let showCreateModal = false;
  let showEditModal = false;
  let selectedStream: MVPTwoStream | null = null;

  onMount(async () => {
    await loadStreams();
  });

  async function loadStreams() {
    streamActions.setLoading(true);
    try {
      const data = await streamAPI.getStreams();
      streamActions.setStreams(data);
    } catch (err) {
      streamActions.setError(err instanceof Error ? err.message : 'Failed to load streams');
    } finally {
      streamActions.setLoading(false);
    }
  }

  async function handleCreateStream(event: CustomEvent) {
    try {
      const newStream = await streamAPI.createStream(event.detail);
      streamActions.addStream(newStream);
      showCreateModal = false;
    } catch (err) {
      streamActions.setError(err instanceof Error ? err.message : 'Failed to create stream');
    }
  }

  async function handleUpdateStream(event: CustomEvent) {
    if (!selectedStream) return;
    try {
      const updatedStream = await streamAPI.updateStream(selectedStream.id, event.detail);
      streamActions.updateStream(selectedStream.id, updatedStream);
      showEditModal = false;
      selectedStream = null;
    } catch (err) {
      streamActions.setError(err instanceof Error ? err.message : 'Failed to update stream');
    }
  }

  async function toggleVisibility(stream: MVPTwoStream) {
    try {
      await streamAPI.updateStream(stream.id, { isVisible: !stream.isVisible });
      streamActions.toggleVisibility(stream.id);
    } catch (err) {
      streamActions.setError(err instanceof Error ? err.message : 'Failed to toggle visibility');
    }
  }

  async function handleDeleteStream(stream: MVPTwoStream) {
    if (!confirm(`Delete "${stream.title}"? This cannot be undone.`)) return;
    try {
      await streamAPI.deleteStream(stream.id);
      streamActions.removeStream(stream.id);
    } catch (err) {
      streamActions.setError(err instanceof Error ? err.message : 'Failed to delete stream');
    }
  }

  function openEditModal(stream: MVPTwoStream) {
    selectedStream = stream;
    showEditModal = true;
  }

  function openStreamConsole(stream: MVPTwoStream) {
    // Console functionality removed for clean slate approach
    console.log('Stream console requested for:', stream.id);
    alert('Stream console functionality has been simplified. Use the funeral director profile to view streams.');
  }

  async function startStream(stream: MVPTwoStream) {
    try {
      const credentials = await streamAPI.startStream(stream.id);
      streamActions.updateStream(stream.id, { status: 'live' });
      // TODO: Show stream credentials to user
      console.log('Stream credentials:', credentials);
    } catch (err) {
      streamActions.setError(err instanceof Error ? err.message : 'Failed to start stream');
    }
  }

  async function stopStream(stream: MVPTwoStream) {
    try {
      await streamAPI.stopStream(stream.id);
      streamActions.updateStream(stream.id, { status: 'completed' });
    } catch (err) {
      streamActions.setError(err instanceof Error ? err.message : 'Failed to stop stream');
    }
  }
</script>

<div class="p-6">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Stream Manager</h1>
    <MVPTwoButton onclick={() => showCreateModal = true}>
      Create Stream
    </MVPTwoButton>
  </div>

  <!-- Error Display -->
  {#if $error}
    <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-800">{$error}</p>
      <MVPTwoButton size="sm" variant="secondary" onclick={() => streamActions.clearError()}>
        Dismiss
      </MVPTwoButton>
    </div>
  {/if}

  <!-- Loading State -->
  {#if $loading}
    <div class="text-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p class="text-gray-600">Loading streams...</p>
    </div>
  {:else if $streams.length === 0}
    <!-- Empty State -->
    <div class="text-center py-12 bg-gray-50 rounded-lg">
      <div class="text-6xl mb-4">📹</div>
      <h3 class="text-lg font-semibold mb-2">No streams yet</h3>
      <p class="text-gray-600">Click "Create Stream" above to get started</p>
    </div>
  {:else}
    <!-- Streams Grid -->
    <div class="grid gap-4">
      {#each $streams as stream}
        <div class="border rounded-lg p-4 bg-white shadow-sm">
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1">
              <h3 class="font-semibold text-lg">{stream.title}</h3>
              {#if stream.description}
                <p class="text-gray-600 text-sm mt-1">{stream.description}</p>
              {/if}
              <div class="flex items-center gap-3 mt-2">
                <MVPTwoStatusIndicator status={stream.status} />
                <span class="text-xs text-gray-500">Order: {stream.displayOrder}</span>
                {#if !stream.isVisible}
                  <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Hidden</span>
                {/if}
              </div>
            </div>
          </div>
          
          <div class="flex gap-2 flex-wrap">
            <!-- Stream Control Buttons -->
            {#if stream.status === 'scheduled'}
              <MVPTwoButton size="sm" onclick={() => openStreamConsole(stream)}>
                Setup Stream
              </MVPTwoButton>
            {:else if stream.status === 'live'}
              <MVPTwoButton size="sm" onclick={() => openStreamConsole(stream)}>
                Stream Console
              </MVPTwoButton>
            {:else if stream.status === 'completed'}
              <MVPTwoButton size="sm" variant="secondary" onclick={() => openStreamConsole(stream)}>
                View Console
              </MVPTwoButton>
            {/if}
            
            <!-- Management Buttons -->
            <MVPTwoButton size="sm" variant="secondary" onclick={() => openEditModal(stream)}>
              Edit
            </MVPTwoButton>
            <MVPTwoButton 
              size="sm" 
              variant="secondary" 
              onclick={() => toggleVisibility(stream)}
            >
              {stream.isVisible ? 'Hide' : 'Show'}
            </MVPTwoButton>
            <MVPTwoButton size="sm" variant="danger" onclick={() => handleDeleteStream(stream)}>
              Delete
            </MVPTwoButton>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Create Stream Modal -->
<MVPTwoModal bind:isOpen={showCreateModal} title="Create New Stream">
  <MVPTwoStreamCreator 
    on:create={handleCreateStream}
    on:cancel={() => showCreateModal = false}
  />
</MVPTwoModal>

<!-- Edit Stream Modal -->
<MVPTwoModal bind:isOpen={showEditModal} title="Edit Stream">
  {#if selectedStream}
    <MVPTwoStreamEditor 
      stream={selectedStream}
      on:update={handleUpdateStream}
      on:cancel={() => { showEditModal = false; selectedStream = null; }}
    />
  {/if}
</MVPTwoModal>
