<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let { data } = $props();
	let error: string | null = $state(data?.error || null);
	let isLoading = $state(true);

	// Process custom token client-side
	onMount(async () => {
		if (data?.token) {
			console.log('🔄 Processing custom token client-side...');
			console.log('🔄 Token:', data.token.substring(0, 20) + '...');
			console.log('🔄 Slug:', data.slug);

			try {
				// Import Firebase dynamically to avoid SSR issues
				const { auth } = await import('$lib/firebase');
				const { signInWithCustomToken } = await import('firebase/auth');

				console.log('🔄 Attempting signInWithCustomToken...');
				console.log('🔄 Auth instance:', auth);
				console.log('🔄 Auth config:', auth.config);

				// Add timeout to prevent hanging
				const signInPromise = signInWithCustomToken(auth, data.token);
				const timeoutPromise = new Promise((_, reject) =>
					setTimeout(() => reject(new Error('Authentication timeout')), 10000)
				);

				const userCredential = (await Promise.race([signInPromise, timeoutPromise])) as any;
				console.log('✅ Custom token sign-in successful, user:', userCredential.user.uid);

				console.log('🔄 Getting ID token...');
				const idToken = await userCredential.user.getIdToken();
				console.log('✅ ID token obtained, length:', idToken.length);

				console.log('🔄 Calling /api/session...');
				const response = await fetch('/api/session', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ idToken, slug: data.slug })
				});

				console.log('🔄 Session API response status:', response.status);
				const result = await response.json();
				console.log('🔄 Session API response:', result);

				if (response.ok && result.redirectTo) {
					console.log('✅ Client-side auth successful, redirecting to:', result.redirectTo);
					window.location.href = result.redirectTo;
					return;
				}

				error = result.message || 'Failed to create session.';
				console.error('❌ Session creation failed:', result);
			} catch (e: any) {
				console.error('❌ Client-side auth failed:', e);
				console.error('❌ Error details:', {
					name: e.name,
					message: e.message,
					code: e.code,
					stack: e.stack
				});

				// Provide more specific error messages
				if (e.code === 'auth/network-request-failed') {
					error =
						'Network connection failed. Please check if Firebase emulators are running properly.';
				} else if (e.code === 'auth/invalid-custom-token') {
					error = 'Invalid authentication token. Please try registering again.';
				} else if (e.message?.includes('timeout')) {
					error = 'Authentication timed out. Please check your network connection and try again.';
				} else {
					error = 'Authentication failed. Please try logging in manually.';
				}
			}
		} else if (data?.error === 'missing-token') {
			error = 'No authentication token provided.';
		} else {
			error = 'Invalid authentication data.';
		}

		isLoading = false;
	});
</script>

<h1>Signing in...</h1>

{#if error}
	<p style="color: red;">{error}</p>
{:else}
	<p>Please wait while we securely sign you in.</p>
{/if}
