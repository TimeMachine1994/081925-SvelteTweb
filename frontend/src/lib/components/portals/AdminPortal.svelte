<!-- TODO: Remove Tailwind CSS classes and replace with styles from tribute-theme.css -->
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

<div class="TODO: replace-with-theme-class">
	<h2 class="TODO: replace-with-theme-class">Admin Dashboard</h2>
	<p>Welcome to the admin dashboard. All memorials are listed below.</p>

	<div class="TODO: replace-with-theme-class">
		<a href="/my-portal/tributes/new" class="TODO: replace-with-theme-class">
			Create New Memorial
		</a>
	</div>
	
	<!-- Memorials Table -->
	<div class="TODO: replace-with-theme-class">
		<table class="TODO: replace-with-theme-class">
			<thead class="TODO: replace-with-theme-class">
				<tr>
					<th class="TODO: replace-with-theme-class">Loved One</th>
					<th class="TODO: replace-with-theme-class">Creator Email</th>
					<th class="TODO: replace-with-theme-class">Livestream Status</th>
					<th class="TODO: replace-with-theme-class">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#if memorials && memorials.length > 0}
					{#each memorials as memorial}
						<tr class="TODO: replace-with-theme-class">
							<td class="TODO: replace-with-theme-class">{memorial.lovedOneName}</td>
							<td class="TODO: replace-with-theme-class">{memorial.creatorEmail}</td>
							<td class="TODO: replace-with-theme-class">
								{#if memorial.livestream}
									<span class="TODO: replace-with-theme-class">Active</span>
								{:else}
									<span class="TODO: replace-with-theme-class">None</span>
								{/if}
							</td>
							<td class="px-4 py-2 space-x-2">
								<a href="/my-portal/tributes/{memorial.id}/edit" class="TODO: replace-with-theme-class">Edit / Photos</a>
								
								<!-- Technical Livestream Action -->
								{#if memorial.livestream}
									<span class="TODO: replace-with-theme-class" title="RTMP details have been generated">RTMP Active</span>
								{:else}
									<a href="/my-portal/tributes/{memorial.id}/livestream/new" class="TODO: replace-with-theme-class">Create Livestream RTMP</a>
								{/if}

								<!-- Scheduling Action -->
								{#if memorial.livestreamConfig}
									<a href="/app/calculator?memorialId={memorial.id}" class="TODO: replace-with-theme-class">Manage Schedule</a>
								{:else}
									<a href="/app/calculator?memorialId={memorial.id}" class="TODO: replace-with-theme-class">Schedule Livestream</a>
								{/if}

								<button onclick={() => handleReassignClick(memorial.id)} class="TODO: replace-with-theme-class">Reassign Owner</button>
								<button onclick={() => handleManageEmbedsClick(memorial)} class="TODO: replace-with-theme-class">Manage Embeds</button>
							</td>
						</tr>
						{#if reassigningMemorialId === memorial.id}
							<tr class="TODO: replace-with-theme-class">
								<td colspan="4" class="TODO: replace-with-theme-class">
									<div class="TODO: replace-with-theme-class">
										<span class="TODO: replace-with-theme-class">Reassign to:</span>
										<select bind:value={selectedOwnerUid} class="TODO: replace-with-theme-class">
											<option value={null} disabled>Select a user</option>
											{#each allUsers as user}
												<option value={user.uid}>{user.displayName || user.email}</option>
											{/each}
										</select>
										<button onclick={() => handleConfirmReassign(memorial.id)} class="TODO: replace-with-theme-class">Confirm</button>
										<button onclick={() => reassigningMemorialId = null} class="TODO: replace-with-theme-class">Cancel</button>
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				{:else}
					<tr>
						<td colspan="4" class="TODO: replace-with-theme-class">No memorials found.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>


{#if managingEmbedsMemorial}
	<div class="TODO: replace-with-theme-class">
		<div class="TODO: replace-with-theme-class">
			<h3 class="TODO: replace-with-theme-class">Manage Embeds for {managingEmbedsMemorial.lovedOneName}</h3>

			<!-- List of existing embeds -->
			<div class="TODO: replace-with-theme-class">
				<h4 class="TODO: replace-with-theme-class">Existing Embeds</h4>
				{#if managingEmbedsMemorial.embeds && managingEmbedsMemorial.embeds.length > 0}
					<ul>
						{#each managingEmbedsMemorial.embeds as embed}
							<li class="TODO: replace-with-theme-class">
								<span>{embed.title} ({embed.type})</span>
								<button
									class="TODO: replace-with-theme-class"
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
			<div class="TODO: replace-with-theme-class">
				<h4 class="TODO: replace-with-theme-class">Add New Embed</h4>
				<div class="TODO: replace-with-theme-class">
					<div>
						<label for="embedTitle" class="TODO: replace-with-theme-class">Title</label>
						<input type="text" id="embedTitle" bind:value={newEmbedTitle} class="TODO: replace-with-theme-class" />
					</div>
					<div>
						<label for="embedType" class="TODO: replace-with-theme-class">Type</label>
						<select id="embedType" bind:value={newEmbedType} class="TODO: replace-with-theme-class">
							<option value="youtube">YouTube</option>
							<option value="vimeo">Vimeo</option>
						</select>
					</div>
					<div>
						<label for="embedUrl" class="TODO: replace-with-theme-class">Embed URL</label>
						<input type="text" id="embedUrl" bind:value={newEmbedUrl} class="TODO: replace-with-theme-class" />
					</div>
				</div>
				<div class="TODO: replace-with-theme-class">
					<button
						class="TODO: replace-with-theme-class"
						onclick={() => (managingEmbedsMemorial = null)}
					>
						Close
					</button>
					<button
						class="TODO: replace-with-theme-class"
						onclick={handleAddEmbed}
					>
						Add Embed
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}