<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import MVPTwoButton from '../shared/MVPTwoButton.svelte';
  import type { MVPTwoStream } from '../../lib/types/streamTypes.js';

  export let streams: MVPTwoStream[];
  const dispatch = createEventDispatcher();
  
  let orderedStreams = [...streams];

  function moveUp(index: number) {
    if (index === 0) return;
    [orderedStreams[index - 1], orderedStreams[index]] = [orderedStreams[index], orderedStreams[index - 1]];
  }

  function moveDown(index: number) {
    if (index === orderedStreams.length - 1) return;
    [orderedStreams[index], orderedStreams[index + 1]] = [orderedStreams[index + 1], orderedStreams[index]];
  }

  function saveOrder() {
    dispatch('reorder', { streamIds: orderedStreams.map(s => s.id) });
  }
</script>

<div class="space-y-4">
  <div class="flex justify-between">
    <h3 class="text-lg font-semibold">Reorder Streams</h3>
    <MVPTwoButton onclick={saveOrder}>Save Order</MVPTwoButton>
  </div>

  {#each orderedStreams as stream, index}
    <div class="flex items-center gap-3 p-3 border rounded-lg">
      <span class="font-mono text-sm">{index + 1}</span>
      <span class="flex-1">{stream.title}</span>
      <MVPTwoButton size="sm" onclick={() => moveUp(index)} disabled={index === 0}>↑</MVPTwoButton>
      <MVPTwoButton size="sm" onclick={() => moveDown(index)} disabled={index === orderedStreams.length - 1}>↓</MVPTwoButton>
    </div>
  {/each}
</div>
