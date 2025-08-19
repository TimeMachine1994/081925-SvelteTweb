<script lang="ts">
	import { goto } from '$app/navigation';

	let { data, form } = $props();
	let displayName = $state(data.profile?.displayName || '');

	async function logout() {
		const response = await fetch('/api/session', {
			method: 'DELETE'
		});

		if (response.ok) {
			await goto('/login');
		} else {
			console.error('Logout failed');
		}
	}
</script>

{#if data.profile}
	<h2>Profile</h2>
	<p>Email: {data.profile.email}</p>
	<p>Created At: {new Date(data.profile.createdAt).toLocaleDateString()}</p>

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

	<button onclick={logout}>Logout</button>
{:else}
	<p>Loading profile...</p>
{/if}