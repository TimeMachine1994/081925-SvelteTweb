<script lang="ts">
	import { goto } from '$app/navigation';

	let { data, form } = $props();
	let displayName = $state(data.user?.displayName || '');

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

	{#if form?.message}
		<p>{form.message}</p>
	{/if}

	<form method="POST" action="/logout">
		<button type="submit">Logout</button>
	</form>
{:else}
	<p>Loading profile...</p>
{/if}