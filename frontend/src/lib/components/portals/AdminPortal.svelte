<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';
	import { invalidateAll } from '$app/navigation';

	let { memorials, allUsers }: { memorials: Memorial[], allUsers: {uid: string, email: string, displayName: string}[] } = $props();

	import type { Embed } from '$lib/types/memorial';

	let reassigningMemorialId = $state<string | null>(null);
	let selectedOwnerUid = $state<string | null>(null);
	let managingEmbedsMemorial = $state<Memorial | null>(null);

	// State for the new embed form
	let newEmbedTitle = $state('');
	let newEmbedType = $state<'youtube' | 'vimeo'>('youtube');
	let newEmbedUrl = $state('');

	function handleReassignClick(memorialId: string) {
		reassigningMemorialId = memorialId;
		selectedOwnerUid = null;
	}

	function handleManageEmbedsClick(memorial: Memorial) {
		console.log('Managing embeds for:', memorial.lovedOneName, 'with embeds:', memorial.embeds);
		managingEmbedsMemorial = memorial;
		// Reset form fields when opening the modal
		newEmbedTitle = '';
		newEmbedType = 'youtube';
		newEmbedUrl = '';
	}

	async function handleAddEmbed() {
		if (!managingEmbedsMemorial || !newEmbedTitle || !newEmbedUrl) {
			alert('Please fill out all fields for the new embed.');
			return;
		}

		console.log(`🚀 Adding embed to ${managingEmbedsMemorial.lovedOneName}`);

		const response = await fetch(`/api/memorials/${managingEmbedsMemorial.id}/embeds`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				title: newEmbedTitle,
				type: newEmbedType,
				embedUrl: newEmbedUrl
			})
		});

		if (response.ok) {
			alert('Embed added successfully!');
			await invalidateAll(); // Refresh data
			managingEmbedsMemorial = null; // Close modal
		} else {
			const errorData = await response.json();
			alert(`Failed to add embed: ${errorData.error}`);
		}
	}

	async function handleDeleteEmbed(embedId: string) {
		if (!managingEmbedsMemorial) return;

		if (!confirm('Are you sure you want to delete this embed?')) {
			return;
		}

		console.log(`🚀 Deleting embed ${embedId} from ${managingEmbedsMemorial.lovedOneName}`);

		const response = await fetch(`/api/memorials/${managingEmbedsMemorial.id}/embeds`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ embedId })
		});

		if (response.ok) {
			alert('Embed deleted successfully!');
			await invalidateAll(); // Refresh data
			managingEmbedsMemorial = null; // Close modal
		} else {
			const errorData = await response.json();
			alert(`Failed to delete embed: ${errorData.error}`);
		}
	}

	async function handleConfirmReassign(memorialId: string) {
		if (!selectedOwnerUid) {
			alert('Please select a new owner.');
			return;
		}

		console.log(`🚀 Reassigning memorial ${memorialId} to ${selectedOwnerUid}`);

		const response = await fetch(`/api/memorials/${memorialId}/assign`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ newOwnerUid: selectedOwnerUid })
		});

		if (response.ok) {
			alert('Memorial owner reassigned successfully!');
			reassigningMemorialId = null;
			await invalidateAll(); // Refresh the data
		} else {
			const errorData = await response.json();
			alert(`Failed to reassign owner: ${errorData.error}`);
		}
	}
</script>

<div class="admin-portal">
	<h2 class="text-xl font-semibold mb-4">Admin Dashboard</h2>
	<p>Welcome to the admin dashboard. All memorials are listed below.</p>

	<div class="my-4">
		<a href="/my-portal/tributes/new" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
			Create New Memorial
		</a>
	</div>
	
	<!-- Memorials Table -->
	<div class="mt-6 overflow-x-auto">
		<table class="min-w-full bg-white">
			<thead class="bg-gray-800 text-white">
				<tr>
					<th class="w-1/3 px-4 py-2 text-left">Loved One</th>
					<th class="w-1/3 px-4 py-2 text-left">Creator Email</th>
					<th class="px-4 py-2 text-left">Livestream Status</th>
					<th class="px-4 py-2 text-left">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#if memorials && memorials.length > 0}
					{#each memorials as memorial}
						<tr class="border-b">
							<td class="px-4 py-2">{memorial.lovedOneName}</td>
							<td class="px-4 py-2">{memorial.creatorEmail}</td>
							<td class="px-4 py-2">
								{#if memorial.livestream}
									<span class="inline-block bg-green-200 text-green-800 text-xs px-2 rounded-full uppercase font-semibold tracking-wide">Active</span>
								{:else}
									<span class="inline-block bg-gray-200 text-gray-800 text-xs px-2 rounded-full uppercase font-semibold tracking-wide">None</span>
								{/if}
							</td>
							<td class="px-4 py-2 space-x-2">
								<a href="/my-portal/tributes/{memorial.id}/edit" class="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-1 px-2 rounded">Edit / Photos</a>
								
								<!-- Technical Livestream Action -->
								{#if memorial.livestream}
									<span class="bg-gray-400 text-white text-xs font-semibold py-1 px-2 rounded cursor-not-allowed" title="RTMP details have been generated">RTMP Active</span>
								{:else}
									<a href="/my-portal/tributes/{memorial.id}/livestream/new" class="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1 px-2 rounded">Create Livestream RTMP</a>
								{/if}

								<!-- Scheduling Action -->
								{#if memorial.livestreamConfig}
									<a href="/app/calculator?memorialId={memorial.id}" class="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold py-1 px-2 rounded">Manage Schedule</a>
								{:else}
									<a href="/app/calculator?memorialId={memorial.id}" class="bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold py-1 px-2 rounded">Schedule Livestream</a>
								{/if}

								<button onclick={() => handleReassignClick(memorial.id)} class="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold py-1 px-2 rounded">Reassign Owner</button>
								<button onclick={() => handleManageEmbedsClick(memorial)} class="bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold py-1 px-2 rounded">Manage Embeds</button>
							</td>
						</tr>
						{#if reassigningMemorialId === memorial.id}
							<tr class="border-b bg-gray-100">
								<td colspan="4" class="px-4 py-2">
									<div class="flex items-center">
										<span class="mr-2 font-semibold">Reassign to:</span>
										<select bind:value={selectedOwnerUid} class="border rounded px-2 py-1">
											<option value={null} disabled>Select a user</option>
											{#each allUsers as user}
												<option value={user.uid}>{user.displayName || user.email}</option>
											{/each}
										</select>
										<button onclick={() => handleConfirmReassign(memorial.id)} class="ml-2 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1 px-2 rounded">Confirm</button>
										<button onclick={() => reassigningMemorialId = null} class="ml-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1 px-2 rounded">Cancel</button>
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				{:else}
					<tr>
						<td colspan="4" class="text-center py-4">No memorials found.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>

<style>
	/* Scoped styles for the admin portal table */
	.admin-portal {
		padding: 2rem;
		background-color: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
	}
</style>

{#if managingEmbedsMemorial}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-8 max-w-3xl w-full">
			<h3 class="text-2xl font-bold mb-6">Manage Embeds for {managingEmbedsMemorial.lovedOneName}</h3>

			<!-- List of existing embeds -->
			<div class="mb-6">
				<h4 class="text-xl font-semibold mb-2">Existing Embeds</h4>
				{#if managingEmbedsMemorial.embeds && managingEmbedsMemorial.embeds.length > 0}
					<ul>
						{#each managingEmbedsMemorial.embeds as embed}
							<li class="flex justify-between items-center p-2 border-b">
								<span>{embed.title} ({embed.type})</span>
								<button
									class="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1 px-2 rounded"
									onclick={() => handleDeleteEmbed(embed.id)}
								>
									Delete
								</button>
							</li>
						{/each}
					</ul>
				{:else}
					<p>No embeds have been added yet.</p>
				{/if}
			</div>

			<!-- Form to add a new embed -->
			<div class="border-t pt-6">
				<h4 class="text-xl font-semibold mb-4">Add New Embed</h4>
				<div class="grid grid-cols-1 gap-4">
					<div>
						<label for="embedTitle" class="block text-sm font-medium text-gray-700">Title</label>
						<input type="text" id="embedTitle" bind:value={newEmbedTitle} class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
					</div>
					<div>
						<label for="embedType" class="block text-sm font-medium text-gray-700">Type</label>
						<select id="embedType" bind:value={newEmbedType} class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
							<option value="youtube">YouTube</option>
							<option value="vimeo">Vimeo</option>
						</select>
					</div>
					<div>
						<label for="embedUrl" class="block text-sm font-medium text-gray-700">Embed URL</label>
						<input type="text" id="embedUrl" bind:value={newEmbedUrl} class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
					</div>
				</div>
				<div class="mt-6 flex justify-end gap-4">
					<button
						class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
						onclick={() => (managingEmbedsMemorial = null)}
					>
						Close
					</button>
					<button
						class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
						onclick={handleAddEmbed}
					>
						Add Embed
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}