<script lang="ts">
    import type { Memorial } from '$lib/types/memorial';

    let { memorials }: { memorials: Memorial[] } = $props();
</script>

<h2 class="text-xl font-semibold mb-4">Memorials You Own</h2>
{#if memorials && memorials.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each memorials as memorial}
            <div class="card">
                <h2 class="text-xl font-semibold">{memorial.lovedOneName}</h2>
                <a href="/tributes/{memorial.slug}" class="btn btn-primary mt-4">View Memorial</a>
                <a href="/my-portal/tributes/{memorial.id}/edit" class="btn btn-secondary mt-2">Edit / Manage Photos</a>
                {#if memorial.livestream}
                    <a href="/my-portal/tributes/{memorial.id}/edit" class="btn btn-secondary mt-2">View Livestream Details</a>
                {:else}
                    <a href="/app/calculator?memorialId={memorial.id}" class="btn btn-secondary mt-2">Schedule Livestream</a>
                {/if}
            </div>
        {/each}
    </div>
{:else}
    <p>You have not created any memorials yet.</p>
{/if}
<a href="/my-portal/tributes/new" class="btn btn-primary mt-4">Create a New Memorial</a>