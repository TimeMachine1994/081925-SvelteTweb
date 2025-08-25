<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let enhancing = $state(false);

	// Cast the form to a type that includes the optional error property to resolve the type error.
	const typedForm = form as { error?: string };
</script>

<div class="container">
	<h1>Create a new Tribute</h1>
	<form
		method="POST"
		use:enhance={() => {
			enhancing = true;
			return async ({ update }) => {
				await update();
				enhancing = false;
			};
		}}
	>
		<label for="lovedOneName">Loved One's Name</label>
		<input type="text" id="lovedOneName" name="lovedOneName" required />

		<button type="submit" disabled={enhancing}>{enhancing ? 'Creating...' : 'Create Tribute'}</button>
	</form>
	{#if typedForm?.error}
		<p class="error">{typedForm.error}</p>
	{/if}
</div>
