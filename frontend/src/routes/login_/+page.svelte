<script lang="ts">
	import Login from '$lib/components/Login.svelte';
	import type { ActionData } from './$types';
	import { page } from '$app/stores';

	export let form: ActionData = null;
</script>

<svelte:window
	on:load={() => {
		console.log('🔒 [/login_] Page loaded');
		console.log('  - Checking $page.data.user:', $page.data.user);
	}}
/>

{#if $page.data.user}
	<div class="text-center">
		<h1 class="text-2xl font-bold mb-4">You are already logged in.</h1>
		<p>
			<a href="/my-portal" class="text-blue-500 hover:underline">Go to your portal</a>
		</p>
	</div>
{:else}
	<Login />
{/if}