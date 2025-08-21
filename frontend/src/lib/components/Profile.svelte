<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let displayName = $state(data.user?.displayName || '');

	// Helper to format date for input[type="date"]
	function formatDate(date: Date | null | undefined): string {
		if (!date) return '';
		// Ensure date is a Date object before calling toISOString
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toISOString().split('T')[0];
	}
</script>

{#if data.user}
	<h2>Profile</h2>
	<p>Email: {data.user.email}</p>
	<p>Created At: {new Date(data.user.createdAt).toLocaleDateString()}</p>

	<form method="POST" action="?/updateProfile">
		<label>
			Display Name:
			<input type="text" name="displayName" bind:value={displayName} />
		</label>
		<button type="submit">Save</button>
	</form>

	<hr />

	<h2>Livestream Details</h2>
	<form method="POST" action="?/updateStreamDetails" use:enhance>
		<label>
			Title:
			<input type="text" name="title" bind:value={data.livestreamDetails.title} />
		</label>
		<br />
		<label>
			Description:
			<textarea name="description" bind:value={data.livestreamDetails.description}></textarea>
		</label>
		<br />
		<label>
			Stream Date:
			<input
				type="date"
				name="streamDate"
				value={formatDate(data.livestreamDetails.streamDate)}
			/>
		</label>
		<br />
		<button type="submit">Update Stream Details</button>
	</form>

	{#if form?.message}
		<p>{form.message}</p>
	{/if}

	<form method="POST" action="/logout">
		<button type="submit">Logout</button>
	</form>
{:else}
	<p>Loading profile...</p>
{/if}