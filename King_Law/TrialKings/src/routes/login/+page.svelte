<script lang="ts">
	let email = $state('');
	let loading = $state(false);
	let message = $state('');
	let error = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!email) return;

		loading = true;
		error = '';
		message = '';

		try {
			const res = await fetch('/api/auth/magic-link', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const result = await res.json();

			if (res.ok) {
				message = 'Check your email for a login link!';
				email = '';
			} else {
				error = result.error || 'Failed to send login link.';
			}
		} catch {
			error = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Login - TrialKings</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 px-6 dark:from-slate-900 dark:to-slate-800">
	<div class="w-full max-w-md">
		<div class="text-center">
			<a href="/" class="text-3xl font-bold text-slate-900 dark:text-white">TrialKings</a>
			<p class="mt-2 text-slate-600 dark:text-slate-400">Enter your email to receive a login link</p>
		</div>

		<form onsubmit={handleSubmit} class="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800/50 dark:shadow-none dark:ring-0 dark:backdrop-blur">
			<div class="space-y-6">
				<div>
					<label for="email" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						required
						placeholder="you@example.com"
						class="mt-2 block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
					/>
				</div>

				{#if error}
					<div class="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/50 dark:text-red-300">{error}</div>
				{/if}

				{#if message}
					<div class="rounded-lg bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/50 dark:text-green-300">{message}</div>
				{/if}

				<button
					type="submit"
					disabled={loading}
					class="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if loading}
						Sending...
					{:else}
						Send Login Link
					{/if}
				</button>
			</div>
		</form>

		<p class="mt-6 text-center text-sm text-slate-500">
			Don't have an account? <a href="/" class="text-blue-600 hover:underline dark:text-blue-400">Upload a file to get started</a>
		</p>
	</div>
</div>
