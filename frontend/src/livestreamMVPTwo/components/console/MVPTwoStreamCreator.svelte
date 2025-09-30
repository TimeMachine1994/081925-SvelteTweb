<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import MVPTwoButton from '../shared/MVPTwoButton.svelte';

  const dispatch = createEventDispatcher();

  let title = '';
  let description = '';
  let loading = false;

  async function handleSubmit() {
    if (!title.trim()) return;
    
    loading = true;
    try {
      dispatch('create', { title: title.trim(), description: description.trim() || undefined });
      title = '';
      description = '';
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
  <div>
    <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
      Stream Title *
    </label>
    <input
      id="title"
      type="text"
      bind:value={title}
      required
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Enter stream title"
    />
  </div>

  <div>
    <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
      Description
    </label>
    <textarea
      id="description"
      bind:value={description}
      rows="3"
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Optional description"
    ></textarea>
  </div>

  <div class="flex justify-end gap-2">
    <MVPTwoButton type="button" variant="secondary" onclick={() => dispatch('cancel')}>
      Cancel
    </MVPTwoButton>
    <MVPTwoButton type="submit" {loading} disabled={!title.trim()}>
      Create Stream
    </MVPTwoButton>
  </div>
</form>
