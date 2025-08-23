<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';

    let { user } = $props();

    const roles = [
        'family_member',
        'viewer',
        'owner',
        'funeral_director',
        'remote_producer',
        'onsite_videographer'
    ];

    function handleChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const selectedRole = target.value;

        if (selectedRole) {
            const url = new URL(page.url);
            url.searchParams.set('preview_role', selectedRole);
            goto(url.toString(), { keepFocus: true, noScroll: true });
        } else {
            const url = new URL(page.url);
            url.searchParams.delete('preview_role');
            goto(url.toString(), { keepFocus: true, noScroll: true });
        }
    }
</script>

{#if user?.admin}
    <div class="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50">
        <h3 class="font-bold mb-2">Admin Role Preview</h3>
        <select onchange={handleChange} class="bg-gray-700 border border-gray-600 rounded-md p-2">
            <option value="">-- My Role --</option>
            {#each roles as role}
                <option value={role} selected={page.url.searchParams.get('preview_role') === role}>
                    {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
            {/each}
        </select>
    </div>
{/if}