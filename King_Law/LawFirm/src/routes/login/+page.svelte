<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-background p-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="font-title text-4xl mb-2">Welcome Back</h1>
			<p class="text-muted-foreground">Sign in to your account</p>
		</div>

		<div class="bg-card border border-border rounded-lg p-6 shadow-lg">
			<form method="POST" use:enhance>
				{#if form?.error}
					<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded mb-4">
						{form.error}
					</div>
				{/if}

				<div class="mb-4">
					<label for="username" class="block text-sm font-medium mb-2">Username</label>
					<input
						type="text"
						id="username"
						name="username"
						required
						class="w-full px-3 py-2 border border-input rounded-md bg-background"
					/>
				</div>

				<div class="mb-6">
					<label for="password" class="block text-sm font-medium mb-2">Password</label>
					<input
						type="password"
						id="password"
						name="password"
						required
						class="w-full px-3 py-2 border border-input rounded-md bg-background"
					/>
				</div>

				<button
					type="submit"
					class="w-full bg-gold hover:bg-gold-dark text-black font-semibold py-2 px-4 rounded-md transition-colors"
				>
					Sign In
				</button>

				<p class="text-center mt-4 text-sm">
					Don't have an account?
					<a href="/register" class="text-gold hover:underline">Create one</a>
				</p>
			</form>
		</div>
	</div>
</div>
