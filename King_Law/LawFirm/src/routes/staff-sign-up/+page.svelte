<script lang="ts">
	import { goto } from '$app/navigation';

	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const response = await fetch('/api/auth/verify-staff-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Invalid password');
			}

			// Password verified, redirect to registration
			goto('/staff-sign-up/register');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Verification failed';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Staff Sign Up | King Law</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-background p-4 pt-24">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="font-title text-4xl mb-2">Staff Sign Up</h1>
			<p class="text-muted-foreground">Enter the staff access password to continue</p>
		</div>

		<div class="bg-card border border-border rounded-lg p-6 shadow-lg">
			<form onsubmit={handleSubmit}>
				{#if error}
					<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded mb-4">
						{error}
					</div>
				{/if}

				<div class="mb-6">
					<label for="password" class="block text-sm font-medium mb-2">Staff Password</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						required
						placeholder="Enter staff access password"
						class="w-full px-3 py-2 border border-input rounded-md bg-background"
					/>
					<p class="text-xs text-muted-foreground mt-1">
						Contact your administrator if you don't have the password
					</p>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full bg-gold hover:bg-gold-dark text-king-blue font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? 'Verifying...' : 'Continue'}
				</button>

				<p class="text-center mt-4 text-sm">
					Are you a client?
					<a href="/register" class="text-gold hover:underline">Register here</a>
				</p>
			</form>
		</div>
	</div>
</div>
