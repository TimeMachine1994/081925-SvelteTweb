<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { signInWithCustomToken } from 'firebase/auth';
	import { auth } from '$lib/firebase';

	onMount(async () => {
		const token = $page.url.searchParams.get('token');
		const slug = $page.url.searchParams.get('slug');

		if (token) {
			try {
				await signInWithCustomToken(auth, token);
				const user = auth.currentUser;
				if (user) {
					const idToken = await user.getIdToken();
					const response = await fetch('/api/session', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ idToken })
					});

					if (response.ok) {
						goto(`/tributes/${slug}`);
					}
				}
			} catch (error) {
				console.error('Failed to sign in with custom token:', error);
			}
		}
	});
</script>

<div>
	<p>Logging you in...</p>
</div>