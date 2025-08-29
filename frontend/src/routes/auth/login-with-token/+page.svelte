<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getAuth, signInWithCustomToken } from 'firebase/auth';
	import { app } from '$lib/firebase'; // Assuming you have a client-side firebase.ts for initializing client-side Firebase app

	let errorMessage = $state<string | null>(null);

	onMount(async () => {
		const customToken = $page.url.searchParams.get('token');
		const slug = $page.url.searchParams.get('slug');

		if (!customToken) {
			errorMessage = 'Missing custom token for login.';
			return;
		}

		try {
			const auth = getAuth(app);
			console.log('Attempting to sign in with custom token...');
			const userCredential = await signInWithCustomToken(auth, customToken);
			console.log('Signed in with custom token. User UID:', userCredential.user.uid);

			console.log('Fetching ID token...');
			const idToken = await userCredential.user.getIdToken();
			console.log('ID token obtained. Length:', idToken.length);
			console.log('ID token preview:', idToken.substring(0, 50) + '...');

			console.log('Sending ID token to server to create session cookie...');
			const response = await fetch('/api/session', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ idToken, slug })
			});

			console.log('📡 Response from /api/session:', response.status, response.statusText);

			if (!response.ok) {
				const errorData = await response.json();
				console.error('💥 Failed to create session cookie. Server response:', errorData);
				errorMessage = errorData.message || 'Failed to create session cookie.';
			} else {
				// Session was created successfully, parse the JSON response
				const data = await response.json();
				console.log('✅ Session response data:', data);
				
				if (data.redirectUrl) {
					console.log('🚀 Session created successfully. Navigating to:', data.redirectUrl);
					await goto(data.redirectUrl);
				} else {
					console.log('⚠️ Session created but no redirectUrl provided. Navigating to /my-portal as fallback.');
					await goto('/my-portal');
				}
			}
		} catch (error: any) {
			console.error('Error during custom token login or session creation:', error);
			errorMessage = error.message || 'An unexpected error occurred during login.';
		}
	});
</script>

<div class="flex items-center justify-center min-h-screen bg-gray-100">
	<div class="p-8 bg-white rounded-lg shadow-md text-center">
		{#if errorMessage}
			<h1 class="text-2xl font-bold text-red-600 mb-4">Login Error</h1>
			<p class="text-gray-700">{errorMessage}</p>
			<button onclick={() => goto('/login')} class="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
				Go to Login
			</button>
		{:else}
			<h1 class="text-2xl font-bold text-gray-800 mb-4">Logging you in...</h1>
			<p class="text-gray-600">Please wait while we set up your session.</p>
			<div class="mt-4 animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
		{/if}
	</div>
</div>