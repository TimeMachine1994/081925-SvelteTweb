<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import MVPTwoButton from '../shared/MVPTwoButton.svelte';
  import type { MVPTwoStream } from '../../lib/types/streamTypes.js';

  export let stream: MVPTwoStream;
  
  const dispatch = createEventDispatcher();

  let title = stream.title;
  let description = stream.description || '';
  let isVisible = stream.isVisible;
  let loading = false;

  async function handleSubmit() {
    loading = true;
    try {
      dispatch('update', { title, description, isVisible });
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
  <div>
    <label class="block text-sm font-medium mb-1">Title</label>
    <input
      type="text"
      bind:value={title}
      required
      class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div>
    <label class="block text-sm font-medium mb-1">Description</label>
    <textarea
      bind:value={description}
      rows="3"
      class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
    ></textarea>
  </div>

  <div>
    <label class="flex items-center">
      <input type="checkbox" bind:checked={isVisible} class="mr-2" />
      Visible to public
    </label>
  </div>

  <div class="flex justify-end gap-2">
    <MVPTwoButton variant="secondary" onclick={() => dispatch('cancel')}>
      Cancel
    </MVPTwoButton>
    <MVPTwoButton type="submit" {loading}>
      Update Stream
    </MVPTwoButton>
  </div>
</form>
