<script lang="ts">
	import { faRightToBracket, faUser, faLock } from '@fortawesome/free-solid-svg-icons';
	import Icon from '$lib/components/Icon.svelte';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	interface Props {
		form?: ActionData;
	}

	let { form }: Props = $props();
	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Login - King Law Firm</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			<Icon icon={faRightToBracket} size="2xl" class="text-gold mx-auto mb-4" />
			<h2 class="font-title text-4xl font-bold mb-2">Welcome Back</h2>
			<p class="text-muted-foreground">Sign in to access your dashboard</p>
		</div>

		<form
			method="POST"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
				};
			}}
			class="mt-8 space-y-6 bg-background p-8 rounded-lg border border-gray-300 dark:border-gray-700 shadow-lg"
		>
			{#if form?.message}
				<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
					{form.message}
				</div>
			{/if}

			<div class="space-y-4">
				<div>
					<label for="username" class="block text-sm font-semibold mb-2">
						<Icon icon={faUser} size="sm" class="inline mr-2" />
						Username
					</label>
					<input
						type="text"
						id="username"
						name="username"
						required
						autocomplete="username"
						class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
						placeholder="Enter your username"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-semibold mb-2">
						<Icon icon={faLock} size="sm" class="inline mr-2" />
						Password
					</label>
					<input
						type="password"
						id="password"
						name="password"
						required
						autocomplete="current-password"
						class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
						placeholder="Enter your password"
					/>
				</div>
			</div>

			<button
				type="submit"
				disabled={isSubmitting}
				class="w-full px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isSubmitting ? 'Signing in...' : 'Sign In'}
			</button>

			<div class="text-center text-sm text-muted-foreground">
				Don't have an account?
				<a href="/register" class="text-gold hover:underline font-semibold">Register here</a>
			</div>
		</form>
	</div>
</div>
