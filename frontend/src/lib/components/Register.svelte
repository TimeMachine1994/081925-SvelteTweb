<script lang="ts">
	import { signInWithCustomToken } from 'firebase/auth';
	import { auth } from '$lib/firebase';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let error: string | null = null;
	let loading = false;

	const handleRegister: SubmitFunction = () => {
		loading = true;
		error = null;

		return async ({ result, update }) => {
			if (result.type === 'success' && result.data?.customToken) {
				try {
					// Step 2: Sign in with the custom token
					const userCredential = await signInWithCustomToken(auth, result.data.customToken);
					const user = userCredential.user;

					// Step 3: Get the ID token
					const idToken = await user.getIdToken();

					// Step 4: Call the session API endpoint
					const sessionResponse = await fetch('/api/session', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ idToken })
					});

					if (!sessionResponse.ok) {
						throw new Error('Failed to create session');
					}

					// Step 5: Redirect to the portal
					await goto('/my-portal');
				} catch (err: any) {
					error = err.message;
				}
			} else if (result.type === 'failure') {
				error = result.data?.message ?? 'Registration failed.';
			} else if (result.type === 'error') {
				error = result.error.message;
			}

			loading = false;
			// We call update to avoid a full-page reload and apply the action result.
			// Since we handle navigation manually with `goto`, we don't need SvelteKit to do anything else.
			await update({ reset: false });
		};
	};
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Create your account
			</h2>
		</div>
		<form class="mt-8 space-y-6" method="POST" action="?/register" use:enhance={handleRegister}>
			<div class="rounded-md shadow-sm -space-y-px">
				<div>
					<label for="email-address" class="sr-only">Email address</label>
					<input
						id="email-address"
						name="email"
						type="email"
						autocomplete="email"
						required
						class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Email address"
					/>
				</div>
				<div>
					<label for="password" class="sr-only">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						required
						class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Password"
					/>
				</div>
			</div>

			{#if error}
				<p class="text-red-500 text-sm">{error}</p>
			{/if}

			<div>
				<button
					type="submit"
					disabled={loading}
					class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					{loading ? 'Registering...' : 'Register'}
				</button>
			</div>
		</form>
	</div>
</div>