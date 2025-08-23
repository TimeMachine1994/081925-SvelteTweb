<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData, form: ActionData } = $props();
	const { memorial } = data;
</script>

<div class="container">
	<h2>Create Livestream for {memorial.lovedOneName}</h2>

	<form method="POST">
		<label for="name">Livestream Name</label>
		<input type="text" id="name" name="name" required />

		{#if form?.error}
			<p class="error">{form.error}</p>
		{/if}

		<button type="submit">Create Livestream</button>
	</form>
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
	/* Add other styles as needed */
</style>