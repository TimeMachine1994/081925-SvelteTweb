<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';

    let { user } = $props();
    let selectedRole = $state(page.url.searchParams.get('preview_role') || 'admin');

    const roles = [
        'admin',
        'family_member',
        'viewer',
        'owner',
        'funeral_director',
        'remote_producer',
        'onsite_videographer'
    ];

    $effect(() => {
        const url = new URL(page.url);
        if (selectedRole && selectedRole !== 'admin') {
            url.searchParams.set('preview_role', selectedRole);
        } else {
            url.searchParams.delete('preview_role');
        }
        
        // Avoid navigation loops by checking if the URL is already correct
        if (url.href !== page.url.href) {
            goto(url.toString(), { keepFocus: true, noScroll: true, replaceState: true });
        }
    });
</script>

{#if user?.admin}
    <div class="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50">
        <h3 class="font-bold mb-2">Admin Role Preview</h3>
        <select bind:value={selectedRole} class="bg-gray-700 border border-gray-600 rounded-md p-2">
            {#each roles as role}
                <option value={role}>
                    {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
            {/each}
        </select>
    </div>
{/if}