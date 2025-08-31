<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	let { lovedOneName, bookingId }: { lovedOneName: string; bookingId: string | null } = $props();

	let isEditing = $state(false);
	let newName = $state(lovedOneName);

	async function handleNameUpdate() {
		if (!bookingId || newName === lovedOneName) {
			isEditing = false;
			return;
		}

		const formData = new FormData();
		formData.append('lovedOneName', newName);

		const response = await fetch(`/api/bookings/${bookingId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ formData: { lovedOneName: newName } })
		});

		if (response.ok) {
			lovedOneName = newName;
			isEditing = false;
		} else {
			alert('Failed to update name.');
		}
	}
</script>

<header class="border-b bg-white">
	<div class="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Livestream Calculator</h1>
			{#if isEditing}
				<form use:enhance onsubmit={handleNameUpdate}>
					<input type="text" bind:value={newName} class="border rounded px-2 py-1" />
					<button type="submit">Save</button>
					<button type="button" onclick={() => isEditing = false}>Cancel</button>
				</form>
			{:else}
				<p class="text-xs text-gray-600">
					Tribute Link: /tributes/celebration-of-life-for-{lovedOneName}
					<button onclick={() => isEditing = true} class="ml-2 text-blue-500">(edit)</button>
				</p>
			{/if}
		</div>
		<div class="flex gap-2">
			<button class="border rounded-xl px-3 py-2 text-sm">Copy</button>
			<button class="border rounded-xl px-3 py-2 text-sm">Share</button>
			<button class="border rounded-xl px-3 py-2 text-sm">Edit</button>
		</div>
	</div>
</header>