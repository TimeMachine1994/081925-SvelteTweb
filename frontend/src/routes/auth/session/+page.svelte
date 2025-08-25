<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { auth } from '$lib/firebase';
	import { signInWithCustomToken } from 'firebase/auth';

	let error: string | null = null;

	onMount(async () => {
		const token = $page.url.searchParams.get('token');
		const slug = $page.url.searchParams.get('slug');

		if (!token) {
			error = 'Missing token.';
			return;
		}

		try {
			const userCredential = await signInWithCustomToken(auth, token);
			const idToken = await userCredential.user.getIdToken();

			const response = await fetch('/api/session', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ idToken, slug })
			});

			if (response.ok) {
				// The server will handle the redirect, but we can also redirect client-side
				// as a fallback. The response.url will be the final destination after redirects.
				window.location.href = response.url;
			} else {
				const result = await response.json();
				error = result.message || 'Failed to create session.';
			}
		} catch (e: any) {
			error = 'Failed to sign in. Please try again.';
			console.error('Error signing in with custom token:', e);
		}
	});
</script>

<h1>Signing in...</h1>

{#if error}
	<p style="color: red;">{error}</p>
{:else}
	<p>Please wait while we securely sign you in.</p>
{/if}