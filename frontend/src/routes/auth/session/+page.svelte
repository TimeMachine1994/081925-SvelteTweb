<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { auth } from '$lib/firebase';
	import { signInWithCustomToken } from 'firebase/auth';

	let error: string | null = null;

	onMount(async () => {
		const token = $page.url.searchParams.get('token');
		const slug = $page.url.searchParams.get('slug');

		if (!token || !slug) {
			error = 'Missing token or slug.';
			return;
		}

		try {
			const userCredential = await signInWithCustomToken(auth, token);
			const idToken = await userCredential.user.getIdToken();

			// This form will auto-submit, sending the idToken to the server
			// to create the session cookie.
			const form = document.getElementById('session-form') as HTMLFormElement;
			const idTokenInput = document.getElementById('idToken-input') as HTMLInputElement;
			const slugInput = document.getElementById('slug-input') as HTMLInputElement;

			if (form && idTokenInput && slugInput) {
				idTokenInput.value = idToken;
				slugInput.value = slug;
				form.submit();
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

<form id="session-form" method="POST" action="/api/session" style="display: none;">
	<input type="hidden" name="idToken" id="idToken-input" />
	<input type="hidden" name="slug" id="slug-input" />
</form>