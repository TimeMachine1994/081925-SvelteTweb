<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let role = $state<'client' | 'lawyer'>('client');
	let showAccessCode = $state(false);

	$effect(() => {
		showAccessCode = role === 'lawyer';
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-background p-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="font-title text-4xl mb-2">Create Account</h1>
			<p class="text-muted-foreground">Join King Law Firm</p>
		</div>

		<div class="bg-card border border-border rounded-lg p-6 shadow-lg">
			<form method="POST" use:enhance>
				{#if form?.error}
					<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded mb-4">
						{form.error}
					</div>
				{/if}

				<div class="mb-4">
					<label class="block text-sm font-medium mb-2">I am registering as a:</label>
					<div class="flex gap-4">
						<label class="flex items-center">
							<input
								type="radio"
								bind:group={role}
								value="client"
								name="role"
								class="mr-2"
							/>
							<span>Client</span>
						</label>
						<label class="flex items-center">
							<input
								type="radio"
								bind:group={role}
								value="lawyer"
								name="role"
								class="mr-2"
							/>
							<span>Lawyer</span>
						</label>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4 mb-4">
					<div>
						<label for="firstName" class="block text-sm font-medium mb-2">First Name</label>
						<input
							type="text"
							id="firstName"
							name="firstName"
							required
							class="w-full px-3 py-2 border border-input rounded-md bg-background"
						/>
					</div>
					<div>
						<label for="lastName" class="block text-sm font-medium mb-2">Last Name</label>
						<input
							type="text"
							id="lastName"
							name="lastName"
							required
							class="w-full px-3 py-2 border border-input rounded-md bg-background"
						/>
					</div>
				</div>

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

				<div class="mb-4">
					<label for="email" class="block text-sm font-medium mb-2">Email</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						class="w-full px-3 py-2 border border-input rounded-md bg-background"
					/>
				</div>

				<div class="mb-4">
					<label for="phoneNumber" class="block text-sm font-medium mb-2">Phone Number (Optional)</label>
					<input
						type="tel"
						id="phoneNumber"
						name="phoneNumber"
						class="w-full px-3 py-2 border border-input rounded-md bg-background"
					/>
				</div>

				<div class="mb-4">
					<label for="password" class="block text-sm font-medium mb-2">Password</label>
					<input
						type="password"
						id="password"
						name="password"
						required
						minlength="8"
						class="w-full px-3 py-2 border border-input rounded-md bg-background"
					/>
					<p class="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
				</div>

				<div class="mb-6">
					<label for="confirmPassword" class="block text-sm font-medium mb-2">Confirm Password</label>
					<input
						type="password"
						id="confirmPassword"
						name="confirmPassword"
						required
						class="w-full px-3 py-2 border border-input rounded-md bg-background"
					/>
				</div>

				{#if showAccessCode}
					<div class="mb-6">
						<label for="accessCode" class="block text-sm font-medium mb-2">Lawyer Access Code</label>
						<input
							type="text"
							id="accessCode"
							name="accessCode"
							required
							class="w-full px-3 py-2 border border-input rounded-md bg-background"
						/>
						<p class="text-xs text-muted-foreground mt-1">Required for lawyer registration</p>
					</div>
				{/if}

				<button
					type="submit"
					class="w-full bg-gold hover:bg-gold-dark text-black font-semibold py-2 px-4 rounded-md transition-colors"
				>
					Create Account
				</button>

				<p class="text-center mt-4 text-sm">
					Already have an account?
					<a href="/login" class="text-gold hover:underline">Sign in</a>
				</p>
			</form>
		</div>
	</div>
</div>
