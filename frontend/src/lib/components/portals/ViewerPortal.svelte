<script lang="ts">
    import type { Memorial } from '$lib/types/memorial';

    let { memorials }: { memorials: Memorial[] } = $props();
</script>

<div class="TODO: replace-with-theme-class">
    <h2 class="TODO: replace-with-theme-class">Memorials You Follow</h2>
    {#if memorials && memorials.length > 0}
        <div class="TODO: replace-with-theme-class">
            {#each memorials as memorial}
                <div class="TODO: replace-with-theme-class">
                    <h2 class="TODO: replace-with-theme-class">{memorial.lovedOneName}</h2>
                    <a href="/tributes/{memorial.slug}" class="TODO: replace-with-theme-class">View Memorial</a>
                </div>
            {/each}
        </div>
    {:else}
        <p>You are not following any memorials yet.</p>
    {/if}
</div>