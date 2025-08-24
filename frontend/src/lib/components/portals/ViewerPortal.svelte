<script lang="ts">
    import type { Memorial } from '$lib/types/memorial';

    let { memorials }: { memorials: Memorial[] } = $props();
</script>

<div class="p-4 border rounded-lg bg-gray-50">
    <h2 class="text-xl font-semibold mb-4">Memorials You Follow</h2>
    {#if memorials && memorials.length > 0}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each memorials as memorial}
                <div class="card">
                    <h2 class="text-xl font-semibold">{memorial.lovedOneName}</h2>
                    <a href="/tributes/{memorial.slug}" class="btn btn-primary mt-4">View Memorial</a>
                </div>
            {/each}
        </div>
    {:else}
        <p>You are not following any memorials yet.</p>
    {/if}
</div>