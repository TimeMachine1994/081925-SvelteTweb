<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let displayName = $state(data.profile?.displayName || '');
</script>

{#if data.profile}
	<h2>Profile</h2>
	<p>Email: {data.profile.email}</p>

	<form method="POST" action="?/updateProfile" use:enhance>
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