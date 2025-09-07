<script lang="ts">
	import { page } from '$app/stores';
	import OwnerPortal from '$lib/components/portals/OwnerPortal.svelte';
	import FamilyMemberPortal from '$lib/components/portals/FamilyMemberPortal.svelte';
	import ViewerPortal from '$lib/components/portals/ViewerPortal.svelte';
	import FuneralDirectorPortal from '$lib/components/portals/FuneralDirectorPortal.svelte';
	import AdminPortal from '$lib/components/portals/AdminPortal.svelte';
	
	let { data } = $props();
	
	console.log('🏠 My Portal loaded for role:', data.role);
	console.log('📊 Portal data:', {
		memorials: data.memorials?.length || 0,
		invitations: data.invitations?.length || 0,
		isAdmin: data.user?.admin
	});
</script>

<svelte:head>
	<title>My Portal - {data.user?.displayName || 'User'}</title>
	<meta name="description" content="Your personal memorial management portal" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
	{#if data.error}
		<div class="max-w-4xl mx-auto px-4 py-12">
			<div class="bg-red-50 border border-red-200 rounded-lg p-6">
				<h2 class="text-lg font-semibold text-red-800 mb-2">Error Loading Portal</h2>
				<p class="text-red-600">{data.error}</p>
				<a href="/login" class="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
					Return to Login
				</a>
			</div>
		</div>
	{:else}
		<!-- Admin Portal (takes precedence if user is admin) -->
		{#if data.user?.admin}
			<AdminPortal memorials={data.memorials} />
		
		<!-- Role-based Portal Rendering -->
		{:else if data.role === 'owner'}
			<OwnerPortal memorials={data.memorials} invitations={data.invitations} />
		
		{:else if data.role === 'family_member'}
			<FamilyMemberPortal memorials={data.memorials} />
		
		{:else if data.role === 'viewer'}
			<ViewerPortal memorials={data.memorials} />
		
		{:else if data.role === 'funeral_director'}
			<FuneralDirectorPortal memorials={data.memorials} />
		
		{:else}
			<!-- Fallback for unknown roles -->
			<div class="max-w-4xl mx-auto px-4 py-12">
				<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
					<h2 class="text-lg font-semibold text-yellow-800 mb-2">Role Not Recognized</h2>
					<p class="text-yellow-600 mb-4">
						Your account role "{data.role || 'undefined'}" is not recognized. 
						Please contact support for assistance.
					</p>
					<div class="space-y-2 text-sm text-yellow-700">
						<p><strong>User:</strong> {data.user?.email}</p>
						<p><strong>Role:</strong> {data.role || 'Not set'}</p>
						<p><strong>Admin:</strong> {data.user?.admin ? 'Yes' : 'No'}</p>
					</div>
					<a href="/profile" class="inline-block mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors">
						View Profile
					</a>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	/* Add any portal-specific styles here */
</style>
