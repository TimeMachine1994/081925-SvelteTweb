<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import MVPTwoButton from '../shared/MVPTwoButton.svelte';
  import type { MVPTwoStream } from '../../lib/types/streamTypes.js';

  export let stream: MVPTwoStream;
  
  const dispatch = createEventDispatcher();
  
  let scheduledDate = '';
  let scheduledTime = '';
  let loading = false;

  // Initialize with existing scheduled time if available
  if (stream.scheduledStartTime) {
    const date = new Date(stream.scheduledStartTime);
    scheduledDate = date.toISOString().split('T')[0];
    scheduledTime = date.toTimeString().slice(0, 5);
  }

  async function handleSchedule() {
    if (!scheduledDate || !scheduledTime) return;
    
    loading = true;
    try {
      const scheduledStartTime = new Date(`${scheduledDate}T${scheduledTime}`);
      dispatch('schedule', { scheduledStartTime });
    } finally {
      loading = false;
    }
  }

  function clearSchedule() {
    dispatch('schedule', { scheduledStartTime: null });
  }
</script>

<div class="space-y-4">
  <h3 class="text-lg font-semibold">Schedule Stream</h3>
  
  <div class="grid grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium mb-1">Date</label>
      <input
        type="date"
        bind:value={scheduledDate}
        min={new Date().toISOString().split('T')[0]}
        class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
      />
    </div>
    
    <div>
      <label class="block text-sm font-medium mb-1">Time</label>
      <input
        type="time"
        bind:value={scheduledTime}
        class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>

  <div class="flex gap-2">
    <MVPTwoButton 
      onclick={handleSchedule} 
      {loading}
      disabled={!scheduledDate || !scheduledTime}
    >
      Schedule Stream
    </MVPTwoButton>
    
    {#if stream.scheduledStartTime}
      <MVPTwoButton variant="secondary" onclick={clearSchedule}>
        Clear Schedule
      </MVPTwoButton>
    {/if}
  </div>

  {#if stream.scheduledStartTime}
    <p class="text-sm text-gray-600">
      Scheduled for: {new Date(stream.scheduledStartTime).toLocaleString()}
    </p>
  {/if}
</div>
