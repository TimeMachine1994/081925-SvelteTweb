<script lang="ts">
	import { user } from '$lib/auth';
	import { auth } from '$lib/firebase';
	import { signOut } from 'firebase/auth';
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

{#if $user}
	<p>You are logged in as {$user.email}</p>
	<a href="/profile">Profile</a>
	<button on:click={() => signOut(auth)}>Logout</button>
{:else}
	<a href="/login">Login</a>
	<a href="/register">Register</a>
{/if}