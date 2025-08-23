<script lang="ts">
	import type { PageData } from './$types';
    import RolePreviewer from '$lib/components/RolePreviewer.svelte';
    import OwnerPortal from '$lib/components/portals/OwnerPortal.svelte';
    import FuneralDirectorPortal from '$lib/components/portals/FuneralDirectorPortal.svelte';
    import FamilyMemberPortal from '$lib/components/portals/FamilyMemberPortal.svelte';
    import ViewerPortal from '$lib/components/portals/ViewerPortal.svelte';
    import RemoteProducerPortal from '$lib/components/portals/RemoteProducerPortal.svelte';
    import OnsiteVideographerPortal from '$lib/components/portals/OnsiteVideographerPortal.svelte';

	export let data: PageData;
</script>

<RolePreviewer user={data.user} />

<div class="container mx-auto p-8">
	<h1 class="text-2xl font-bold mb-4">My Portal</h1>
    <p class="mb-6">Welcome, {data.user?.displayName}! Your role is: <strong>{data.user?.role ?? 'Not Assigned'}</strong></p>

    {#if data.user?.role === 'owner'}
        <OwnerPortal memorials={data.memorials} />
    {:else if data.user?.role === 'funeral_director'}
        <FuneralDirectorPortal />
    {:else if data.user?.role === 'family_member'}
        <FamilyMemberPortal />
    {:else if data.user?.role === 'viewer'}
        <ViewerPortal />
    {:else if data.user?.role === 'remote_producer'}
        <RemoteProducerPortal />
    {:else if data.user?.role === 'onsite_videographer'}
        <OnsiteVideographerPortal />
    {:else}
        <!-- Fallback for users with no role or an unrecognized role -->
        <OwnerPortal memorials={data.memorials} />
    {/if}
</div>