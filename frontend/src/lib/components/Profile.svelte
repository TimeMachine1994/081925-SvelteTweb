<script lang="ts">
	import { user } from '$lib/auth';
	import { auth } from '$lib/firebase';
	import { signOut } from 'firebase/auth';
</script>

{#if $user}
	<h2>Profile</h2>
	<p>Email: {$user.email}</p>
	<button on:click={() => signOut(auth)}>Logout</button>
{:else}
	<p>You are not logged in.</p>
{/if}