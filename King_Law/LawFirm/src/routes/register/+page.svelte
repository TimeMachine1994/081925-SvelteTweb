<script lang="ts">
	import { faUserPlus, faUser, faEnvelope, faLock, faPhone } from '@fortawesome/free-solid-svg-icons';
	import Icon from '$lib/components/Icon.svelte';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	interface Props {
		form?: ActionData;
	}

	let { form }: Props = $props();
	let isSubmitting = $state(false);
	let selectedRole = $state('client');
</script>

<svelte:head>
	<title>Register - King Law Firm</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-2xl w-full space-y-8">
		<div class="text-center">
			<Icon icon={faUserPlus} size="2xl" class="text-gold mx-auto mb-4" />
			<h2 class="font-title text-4xl font-bold mb-2">Create Account</h2>
			<p class="text-muted-foreground">Register to access our legal services</p>
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

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="firstName" class="block text-sm font-semibold mb-2">First Name</label>
					<input
						type="text"
						id="firstName"
						name="firstName"
						required
						class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
					/>
				</div>

				<div>
					<label for="lastName" class="block text-sm font-semibold mb-2">Last Name</label>
					<input
						type="text"
						id="lastName"
						name="lastName"
						required
						class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
					/>
				</div>
			</div>

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
				/>
			</div>

			<div>
				<label for="email" class="block text-sm font-semibold mb-2">
					<Icon icon={faEnvelope} size="sm" class="inline mr-2" />
					Email
				</label>
				<input
					type="email"
					id="email"
					name="email"
					required
					autocomplete="email"
					class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
				/>
			</div>

			<div>
				<label for="phoneNumber" class="block text-sm font-semibold mb-2">
					<Icon icon={faPhone} size="sm" class="inline mr-2" />
					Phone Number (optional)
				</label>
				<input
					type="tel"
					id="phoneNumber"
					name="phoneNumber"
					class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
				/>
			</div>

			<div>
				<label for="role" class="block text-sm font-semibold mb-2">I am a</label>
				<select
					id="role"
					name="role"
					bind:value={selectedRole}
					class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
				>
					<option value="client">Client (seeking legal services)</option>
					<option value="lawyer">Lawyer (joining the firm)</option>
				</select>
			</div>

			{#if selectedRole === 'lawyer'}
				<div>
					<label for="lawyerCode" class="block text-sm font-semibold mb-2">
						<Icon icon={faLock} size="sm" class="inline mr-2" />
						Firm Access Code
					</label>
					<input
						type="password"
						id="lawyerCode"
						name="lawyerCode"
						required
						placeholder="Enter the firm access code"
						class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
					/>
					<p class="text-xs text-muted-foreground mt-1">Contact the firm administrator for the access code</p>
				</div>
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
						autocomplete="new-password"
						minlength="8"
						class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
					/>
				</div>

				<div>
					<label for="confirmPassword" class="block text-sm font-semibold mb-2">
						<Icon icon={faLock} size="sm" class="inline mr-2" />
						Confirm Password
					</label>
					<input
						type="password"
						id="confirmPassword"
						name="confirmPassword"
						required
						autocomplete="new-password"
						minlength="8"
						class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
					/>
				</div>
			</div>

			<button
				type="submit"
				disabled={isSubmitting}
				class="w-full px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isSubmitting ? 'Creating account...' : 'Create Account'}
			</button>

			<div class="text-center text-sm text-muted-foreground">
				Already have an account?
				<a href="/login" class="text-gold hover:underline font-semibold">Sign in here</a>
			</div>
		</form>
	</div>
</div>
