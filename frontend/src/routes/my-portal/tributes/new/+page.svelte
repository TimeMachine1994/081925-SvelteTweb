<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getFunctions, httpsCallable } from 'firebase/functions';

	let lovedOneName = '';
	let errorMessage = '';
	let loading = false;

	async function createMemorial() {
		loading = true;
		errorMessage = '';
		try {
			const functions = getFunctions();
			const createMemorial = httpsCallable(functions, 'createMemorial');
			await createMemorial({
				lovedOneName,
				creatorEmail: $page.data.user?.email,
				creatorName: $page.data.user?.displayName
			});
			goto('/my-portal');
		} catch (error) {
			console.error('Error creating memorial:', error);
			errorMessage = 'There was an error creating the memorial. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="container">
	<h1>Create a new Tribute</h1>
	<form on:submit|preventDefault={createMemorial}>
		<label for="lovedOneName">Loved One's Name</label>
		<input type="text" id="lovedOneName" bind:value={lovedOneName} required />

		<button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Tribute'}</button>
	</form>
	{#if errorMessage}
		<p class="error">{errorMessage}</p>
	{/if}
</div>

<style>
	.container {
		max-width: 600px;
		margin: 2rem auto;
		padding: 2rem;
		border: 1px solid #ccc;
		border-radius: 8px;
	}
	.error {
		color: red;
	}
</style>