<script lang="ts">
	import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
	import { auth } from '$lib/firebase';
	import { enhance } from '$app/forms';
	import type { ActionData } from '../../routes/login/$types';

	let { form, redirectTo, bookingId }: { form: ActionData, redirectTo: string | null, bookingId: string | null } = $props();

	let email = $state('');
	let password = $state('');
	let error: string | null = $state(null);
	let loading = $state(false);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		console.log('[Login.svelte] Starting login process...');
		loading = true;
		error = null;

		try {
			console.log('[Login.svelte] Calling signInWithEmailAndPassword...');
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			console.log('[Login.svelte] Sign-in successful, user:', userCredential.user.uid);

			console.log('[Login.svelte] Getting ID token...');
			const idToken = await userCredential.user.getIdToken();
			console.log('[Login.svelte] Got ID token.');

			// Submit the token to the server-side form action
			const formData = new FormData();
			formData.append('idToken', idToken);
			if (bookingId) {
				formData.append('bookingId', bookingId);
			}

			const actionUrl = `/login${redirectTo ? `?redirectTo=${redirectTo}` : ''}`;
			const response = await fetch(actionUrl, {
				method: 'POST',
				body: formData
			});

			if (response.redirected) {
				window.location.href = response.url;
			} else if (!response.ok) {
				const result = await response.json();
				error = result.message;
			}

		} catch (e: any) {
			error = e.message;
			console.error('[Login.svelte] An error occurred during login:', e);
		} finally {
			loading = false;
			console.log('[Login.svelte] Login process finished.');
		}
	}

	async function handleGoogleSignIn() {
		console.log('[Login.svelte] Starting Google sign-in process...');
		loading = true;
		error = null;

		try {
			const provider = new GoogleAuthProvider();
			const userCredential = await signInWithPopup(auth, provider);
			console.log('[Login.svelte] Google sign-in successful, user:', userCredential.user.uid);

			const idToken = await userCredential.user.getIdToken();
			console.log('[Login.svelte] Got ID token from Google sign-in.');

			// Submit the token to the server-side form action
			const formData = new FormData();
			formData.append('idToken', idToken);
			if (bookingId) {
				formData.append('bookingId', bookingId);
			}

			const actionUrl = `/login${redirectTo ? `?redirectTo=${redirectTo}` : ''}`;
			const response = await fetch(actionUrl, {
				method: 'POST',
				body: formData
			});

			if (response.redirected) {
				window.location.href = response.url;
			} else if (!response.ok) {
				const result = await response.json();
				error = result.message;
			}
		} catch (e: any) {
			error = e.message;
			console.error('[Login.svelte] An error occurred during Google sign-in:', e);
		} finally {
			loading = false;
			console.log('[Login.svelte] Google sign-in process finished.');
		}
	}
	</script>
	
	<!-- PAGE WRAPPER -->
	<div class="min-h-screen bg-gray-50 flex justify-center items-center py-12 px-4">
		<div class="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden">
	
			<!-- HEADER -->
			<header class="text-center px-8 py-10 bg-[#0f0f0f]">
				<h1 class="text-3xl font-bold mb-4 text-[#D5BA7F]">🔑 Login to Your Account</h1>
				<p class="max-w-2xl mx-auto text-gray-200/90">
					Access your memorial coordination dashboard.
				</p>
			</header>
	
			<form method="POST" action="/login{redirectTo ? `?redirectTo=${redirectTo}` : ''}" onsubmit={handleSubmit} class="p-10 space-y-6">
				<div class="space-y-4">
					<div>
						<label for="email" class="block text-sm font-medium mb-1">Email:</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							required
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>
					<div>
						<label for="password" class="block text-sm font-medium mb-1">Password:</label>
						<input
							id="password"
							type="password"
							bind:value={password}
							required
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>
				</div>
	
				{#if error}
					<div class="bg-red-50 border border-red-300 text-red-700 rounded-lg p-4 space-y-2">
						<p class="font-semibold">❌ Login Error:</p>
						<p>{error}</p>
					</div>
				{/if}
	
				<button
					type="submit"
					disabled={loading}
					class="w-full bg-[#D5BA7F] hover:bg-[#caa767] text-[#070707] font-semibold px-8 py-3 rounded-lg shadow-md transition">
					{#if loading}Logging in...{:else}Login{/if}
				</button>
			</form>
	
			<div class="relative flex items-center justify-center py-5">
				<div class="absolute inset-x-0 h-px bg-gray-200"></div>
				<div class="relative bg-white px-4 text-sm text-gray-500">OR</div>
			</div>
	
			<div class="p-10 pt-0 space-y-4">
				<button
					class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2"
					onclick={handleGoogleSignIn}
					disabled={loading}>
					Sign in with Google
				</button>
	
				<p class="text-sm text-gray-500 text-center">
					Don't have an account? <a href="/register" class="text-[#D5BA7F] hover:underline">Register here</a>
				</p>
			</div>
		</div>
	</div>
