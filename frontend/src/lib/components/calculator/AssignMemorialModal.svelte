<script lang="ts">
    import type { Memorial } from '$lib/types/memorial';

    let { memorials, onSelect, onCreate, onCancel }: {
        memorials: Memorial[],
        onSelect: (memorialId: string) => void,
        onCreate: () => void,
        onCancel: () => void
    } = $props();

    let selectedMemorialId = $state<string | null>(null);
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Assign to a Memorial</h2>
        
        {#if memorials.length > 0}
            <p class="text-gray-600 mb-4">Select an existing memorial for this booking:</p>
            <select bind:value={selectedMemorialId} class="w-full border rounded-lg px-4 py-2 mb-4">
                <option value={null} disabled>-- Select a memorial --</option>
                {#each memorials as memorial}
                    <option value={memorial.id}>{memorial.lovedOneName}</option>
                {/each}
            </select>
            <button
                onclick={() => selectedMemorialId && onSelect(selectedMemorialId)}
                disabled={!selectedMemorialId}
                class="w-full bg-purple-600 text-white font-semibold px-8 py-3 rounded-lg shadow-md transition disabled:opacity-50"
            >
                Confirm Selection
            </button>
            <div class="relative flex items-center justify-center my-4">
                <div class="absolute inset-x-0 h-px bg-gray-200"></div>
                <div class="relative bg-white px-4 text-sm text-gray-500">OR</div>
            </div>
        {/if}

        <button
            onclick={onCreate}
            class="w-full bg-green-600 text-white font-semibold px-8 py-3 rounded-lg shadow-md transition"
        >
            Create a New Memorial
        </button>

        <button
            onclick={onCancel}
            class="w-full mt-4 text-gray-600 hover:underline"
        >
            Cancel
        </button>
    </div>
</div>