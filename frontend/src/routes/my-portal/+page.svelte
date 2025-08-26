<!-- TODO: Remove Tailwind CSS classes and replace with styles from tribute-theme.css -->
<script lang="ts">
	import type { PageData } from './$types';
    import RolePreviewer from '$lib/components/RolePreviewer.svelte';
    import OwnerPortal from '$lib/components/portals/OwnerPortal.svelte';
    import FuneralDirectorPortal from '$lib/components/portals/FuneralDirectorPortal.svelte';
    import FamilyMemberPortal from '$lib/components/portals/FamilyMemberPortal.svelte';
    import ViewerPortal from '$lib/components/portals/ViewerPortal.svelte';
    import RemoteProducerPortal from '$lib/components/portals/RemoteProducerPortal.svelte';
    import OnsiteVideographerPortal from '$lib/components/portals/OnsiteVideographerPortal.svelte';
    import AdminPortal from '$lib/components/portals/AdminPortal.svelte';

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

{#if data.user?.admin}
    <RolePreviewer user={data.user} />
{/if}

<div class="TODO: replace-with-theme-class">
	<div class="flex justify-between items-center">
		<h1 class="TODO: replace-with-theme-class">My Portal</h1>
		<form action="/logout" method="POST">
			<button type="submit" class="btn btn-sm btn-outline-primary">Logout</button>
		</form>
	</div>
    <p class="TODO: replace-with-theme-class">Welcome, {data.user?.displayName}! Your role is: <strong>{data.previewingRole ? data.previewingRole.replace(/_/g, ' ') : (data.user?.admin ? 'Admin' : (data.user?.role ?? 'Not Assigned'))}</strong></p>

    {#if data.previewingRole === 'admin' || (!data.previewingRole && data.user?.admin)}
        <AdminPortal memorials={data.memorials} allUsers={data.allUsers || []} />
    {:else if data.previewingRole === 'owner' || (!data.previewingRole && data.user?.role === 'owner')}
        <OwnerPortal memorials={data.memorials} invitations={data.invitations || []} />
    {:else if data.previewingRole === 'funeral_director' || (!data.previewingRole && data.user?.role === 'funeral_director')}
        <FuneralDirectorPortal />
    {:else if data.previewingRole === 'family_member' || (!data.previewingRole && data.user?.role === 'family_member')}
        <FamilyMemberPortal memorials={data.memorials} />
    {:else if data.previewingRole === 'viewer' || (!data.previewingRole && data.user?.role === 'viewer')}
        <ViewerPortal memorials={data.memorials} />
    {:else if data.user?.role === 'remote_producer'}
        <RemoteProducerPortal />
    {:else if data.user?.role === 'onsite_videographer'}
        <OnsiteVideographerPortal />
    {:else}
        <!-- Fallback for users with no role or an unrecognized role -->
        <p>You do not have a role assigned. Please contact support.</p>
    {/if}
</div>