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

	   async function makeAdmin() {
	       if (!data.user?.email) {
	           alert('User email not found!');
	           return;
	       }
	       console.log('⚙️ Attempting to make admin...');
	       const res = await fetch('/api/set-admin-claim', {
	           method: 'POST',
	           headers: {
	               'Content-Type': 'application/json'
	           },
	           body: JSON.stringify({ email: data.user.email })
	       });
	       const result = await res.json();
	       if (result.success) {
	           alert('✅ Admin claim set! You may need to refresh or log out/in for it to take effect.');
	       } else {
	           alert(`❌ Error: ${result.error}`);
	       }
	   }

	   async function setOwnerRole() {
	       if (!data.user?.uid) {
	           alert('User UID not found!');
	           return;
	       }
	       console.log('👑 Attempting to set owner role...');
	       const res = await fetch('/api/set-role-claim', {
	           method: 'POST',
	           headers: {
	               'Content-Type': 'application/json'
	           },
	           body: JSON.stringify({ uid: data.user.uid, role: 'owner' })
	       });
	       const result = await res.json();
	       if (result.success) {
	           alert('✅ Owner role set! Refreshing page to see the change.');
	           // Optionally, force a reload to see the change
	           window.location.reload();
	       } else {
	           alert(`❌ Error: ${result.error}`);
	       }
	   }
</script>

<RolePreviewer user={data.user} />

<div class="container mx-auto p-8">
	<h1 class="text-2xl font-bold mb-4">My Portal</h1>
    <p class="mb-6">Welcome, {data.user?.displayName}! Your role is: <strong>{data.user?.role ?? 'Not Assigned'}</strong></p>

    <!-- Temporary Admin Controls -->
    <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
        <p class="font-bold">🛠️ Dev Controls</p>
        <p>These buttons are for development purposes to set user roles.</p>
        <div class="mt-4">
            <button on:click={makeAdmin} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
                Make Admin
            </button>
            <button on:click={setOwnerRole} class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                Set Role to Owner
            </button>
        </div>
    </div>

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