<!-- TODO: Remove Tailwind CSS classes and replace with styles from tribute-theme.css -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { User, Mail, Lock, Eye, EyeOff, UserPlus, ArrowRight, Heart } from 'lucide-svelte';
	import type { ActionData } from './$types';

	let { form }: { form?: ActionData } = $props();

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let selectedRole = $state<'viewer' | 'funeral_director' | 'owner' | null>(null);
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let loading = $state(false);
	let error = $state<string | null>(null);

	function handleRoleSelection(role: 'viewer' | 'funeral_director' | 'owner') {
		selectedRole = role;
		error = null;
	}

	function handleSubmit() {
		loading = true;
		error = null;

		// Basic validation
		if (!name.trim()) {
			error = 'Name is required';
			loading = false;
			return;
		}

		if (!email.trim()) {
			error = 'Email is required';
			loading = false;
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			loading = false;
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			loading = false;
			return;
		}

		if (!selectedRole) {
			error = 'Please select a role';
			loading = false;
			return;
		}

		// Store registration data in sessionStorage for prefilling
		const registrationData = {
			name: name.trim(),
			email: email.trim(),
			password,
			role: selectedRole
		};
		sessionStorage.setItem('registrationData', JSON.stringify(registrationData));

		// Route based on role selection
		if (selectedRole === 'funeral_director') {
			goto('/register/funeral-director');
		} else {
			// For owners and viewers, proceed with direct registration
			// This will be handled by the form submission
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
			<p class="mt-2 text-center text-sm text-gray-600">Join TributeStream to honor and remember</p>
		</div>

		<form
			method="POST"
			action={selectedRole === 'owner' ? '?/registerOwner' : '?/registerViewer'}
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success' && result.data?.customToken) {
						try {
							// Sign in with custom token
							const { signInWithCustomToken } = await import('firebase/auth');
							const { auth } = await import('$lib/firebase');
							
							const userCredential = await signInWithCustomToken(auth, result.data.customToken);
							const idToken = await userCredential.user.getIdToken();
							
							// Create session
							const response = await fetch('/api/session', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ idToken })
							});
							
							if (response.ok) {
								sessionStorage.removeItem('registrationData');
								goto('/profile');
							} else {
								error = 'Registration successful but session creation failed';
							}
						} catch (err) {
							error = 'Registration successful but login failed. Please try logging in manually.';
						}
					} else if (result.type === 'failure') {
						error = result.data?.message || 'Registration failed';
					}
					loading = false;
				};
			}}
			class="mt-8 space-y-6"
		>
			<div class="space-y-4 rounded-md shadow-sm">
				<div>
					<label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
					<input
						id="name"
						name="name"
						type="text"
						bind:value={name}
						placeholder="Enter your full name"
						class="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						required
					/>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
					<input
						id="email"
						name="email"
						type="email"
						bind:value={email}
						placeholder="Enter your email"
						class="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						required
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						bind:value={password}
						placeholder="Create a password"
						class="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						required
					/>
				</div>

				<div>
					<label for="confirmPassword" class="block text-sm font-medium text-gray-700"
						>Confirm Password</label
					>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						bind:value={confirmPassword}
						placeholder="Confirm your password"
						class="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						required
					/>
				</div>
			</div>

			<!-- Role Selection -->
			<div class="space-y-4">
				<h3 class="text-lg font-medium text-gray-900">How will you be using TributeStream?</h3>
				<div class="space-y-3">
					<button
						type="button"
						class="flex w-full items-center rounded-lg border-2 p-4 transition-colors {selectedRole ===
						'owner'
							? 'border-indigo-500 bg-indigo-50'
							: 'border-gray-300 hover:border-gray-400'}"
						onclick={() => handleRoleSelection('owner')}
					>
						<Heart class="mr-3 h-6 w-6 text-gray-600" />
						<div class="text-left">
							<h4 class="font-medium text-gray-900">Register as Owner</h4>
							<p class="text-sm text-gray-600">I want to create a memorial for a loved one</p>
						</div>
						{#if selectedRole === 'owner'}
							<div class="ml-auto font-bold text-indigo-600">✓</div>
						{/if}
					</button>

					<button
						type="button"
						class="flex w-full items-center rounded-lg border-2 p-4 transition-colors {selectedRole ===
						'viewer'
							? 'border-indigo-500 bg-indigo-50'
							: 'border-gray-300 hover:border-gray-400'}"
						onclick={() => handleRoleSelection('viewer')}
					>
						<User class="mr-3 h-6 w-6 text-gray-600" />
						<div class="text-left">
							<h4 class="font-medium text-gray-900">Register as Viewer</h4>
							<p class="text-sm text-gray-600">
								I want to view and participate in memorial services
							</p>
						</div>
						{#if selectedRole === 'viewer'}
							<div class="ml-auto font-bold text-indigo-600">✓</div>
						{/if}
					</button>

					<button
						type="button"
						class="flex w-full items-center rounded-lg border-2 p-4 transition-colors {selectedRole ===
						'funeral_director'
							? 'border-indigo-500 bg-indigo-50'
							: 'border-gray-300 hover:border-gray-400'}"
						onclick={() => handleRoleSelection('funeral_director')}
					>
						<UserPlus class="mr-3 h-6 w-6 text-gray-600" />
						<div class="text-left">
							<h4 class="font-medium text-gray-900">Register as Funeral Director</h4>
							<p class="text-sm text-gray-600">I want to create and manage memorial services</p>
						</div>
						{#if selectedRole === 'funeral_director'}
							<div class="ml-auto font-bold text-indigo-600">✓</div>
						{/if}
					</button>
				</div>
			</div>

			{#if error || form?.message}
				<div class="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
					{error || form?.message}
				</div>
			{/if}

			<div>
				<button
					type={selectedRole === 'viewer' || selectedRole === 'owner' ? 'submit' : 'button'}
					class="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
					disabled={loading || !selectedRole}
					onclick={selectedRole === 'funeral_director' ? handleSubmit : undefined}
				>
					{#if loading}
						Creating Account...
					{:else if selectedRole === 'funeral_director'}
						Continue to Registration Form
					{:else if selectedRole === 'owner'}
						Create Account & Go to Profile
					{:else}
						Create Account
					{/if}
				</button>
			</div>
		</form>

		<div class="text-center">
			<p class="text-sm text-gray-600">
				Already have an account?
				<a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500"> Sign in </a>
			</p>
		</div>
	</div>
</div>
