<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte.ts';

	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let phoneNumber = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let employeeNumber = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (!employeeNumber.trim()) {
			error = 'Employee number is required';
			return;
		}

		loading = true;

		try {
			const response = await fetch('/api/auth/register-staff', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					password,
					firstName,
					lastName,
					phoneNumber: phoneNumber || undefined,
					employeeNumber: employeeNumber.trim().toUpperCase()
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Registration failed');
			}

			// Update auth store with new user
			await authStore.fetchUser();

			// Redirect to appropriate dashboard based on role
			goto(authStore.dashboardRoute);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Registration failed';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-background p-4 pt-24">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="font-title text-4xl mb-2">Staff Registration</h1>
			<p class="text-muted-foreground">Create your staff account</p>
		</div>

		<div class="bg-card border border-border rounded-lg p-6 shadow-lg">
			<form onsubmit={handleSubmit}>
				{#if error}
				<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					<p class="font-medium">Registration Error</p>
					<p class="text-sm">
						{error}
					</p>
				</div>
				{/if}

				<div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
					<label for="employeeNumber" class="block text-sm font-medium mb-2">Employee Number</label>
					<input
						type="text"
						id="employeeNumber"
						bind:value={employeeNumber}
						required
						placeholder="e.g., EMP001"
						class="w-full px-3 py-2 border border-input rounded-md bg-background uppercase"
					/>
					<p class="text-xs text-muted-foreground mt-1">
						Your employee number determines your role. Contact HR if you don't have one.
					</p>
				</div>

				<div class="grid grid-cols-2 gap-4 mb-4">
					<div>
						<label for="firstName" class="block text-sm font-medium mb-2">First Name</label>
						<input
							type="text"
							id="firstName"
							bind:value={firstName}
							required
							class="w-full px-3 py-2 border border-input rounded-md bg-background"
						/>
					</div>
					<div>
						<label for="lastName" class="block text-sm font-medium mb-2">Last Name</label>
						<input
							type="text"
							id="lastName"
							bind:value={lastName}
							required
							class="w-full px-3 py-2 border border-input rounded-md bg-background"
						/>
					</div>
				</div>

				<div class="mb-4">
					<label for="email" class="block text-sm font-medium mb-2">Email</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						required
						class="w-full px-3 py-2 border border-input rounded-md bg-background"
					/>
				</div>

				<div class="mb-4">
					<label for="phoneNumber" class="block text-sm font-medium mb-2">Phone Number (Optional)</label>
					<input
						type="tel"
						id="phoneNumber"
						bind:value={phoneNumber}
						class="w-full px-3 py-2 border border-input rounded-md bg-background"
					/>
				</div>

				<div class="mb-4">
					<label for="password" class="block text-sm font-medium mb-2">Password</label>
					<input
						type="password"
						id="password"
						bind:value={password}
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
						bind:value={confirmPassword}
						required
						class="w-full px-3 py-2 border border-input rounded-md bg-background"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full bg-gold hover:bg-gold-dark text-king-blue font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? 'Creating Account...' : 'Create Account'}
				</button>

				<p class="text-center mt-4 text-sm">
					Already have an account?
					<a href="/login" class="text-gold hover:underline">Sign in</a>
				</p>
			</form>
		</div>
	</div>
</div>
