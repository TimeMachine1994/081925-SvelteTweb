<script lang="ts">
	import type { ActionData } from '../../routes/register/$types';

	export let form: ActionData;
</script>

<h2>Register</h2>

<form method="POST" action="?/register">
	<label>
		Email:
		<input type="email" name="email" required />
	</label>
	<label>
		Password:
		<input type="password" name="password" required />
	</label>
	<button type="submit">Register</button>
</form>

{#if form?.message}
	<p style="color: {form?.status === 201 ? 'green' : 'red'};">
		{form.message}
	</p>
{/if}