<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="portal-container">
	<h1>Welcome to Your Portal</h1>
	<p>This is your personal space. Only you can see this!</p>

	{#if data.user}
		<div class="user-info">
			<p><strong>Email:</strong> {data.user.email}</p>
			<p><strong>UID:</strong> {data.user.uid}</p>
		</div>
	{:else}
		<p>Loading user data...</p>
	{/if}

	<form action="/logout" method="POST">
		<button type="submit">Logout</button>
	</form>
</div>

<style>
	.portal-container {
		max-width: 600px;
		margin: 2rem auto;
		padding: 2rem;
		border: 1px solid #ccc;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.user-info {
		margin: 2rem 0;
		padding: 1rem;
		background-color: #f9f9f9;
		border-radius: 4px;
	}

	button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		background-color: #dc3545;
		color: white;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	button:hover {
		background-color: #c82333;
	}
</style>