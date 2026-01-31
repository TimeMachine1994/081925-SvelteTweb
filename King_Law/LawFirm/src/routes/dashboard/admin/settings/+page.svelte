<script lang="ts">
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let success = $state('');
	let loading = $state(false);

	async function updateStaffPassword() {
		error = '';
		success = '';

		if (!newPassword || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}

		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (newPassword.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		loading = true;

		try {
			const response = await fetch('/api/admin/settings/staff-password', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: newPassword })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to update password');
			}

			success = 'Staff sign-up password updated successfully';
			newPassword = '';
			confirmPassword = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update password';
		} finally {
			loading = false;
		}
	}
</script>

<div>
	<div class="mb-8">
		<h1 class="text-3xl font-title">Settings</h1>
		<p class="text-muted-foreground mt-1">Configure system settings</p>
	</div>

	<!-- Staff Password Section -->
	<div class="bg-card border border-border rounded-lg p-6 max-w-xl">
		<h2 class="text-lg font-semibold mb-4">Staff Sign-Up Password</h2>
		<p class="text-sm text-muted-foreground mb-4">
			This password is required for staff members to access the registration page at /staff-sign-up
		</p>

		{#if error}
			<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded mb-4">
				{error}
			</div>
		{/if}

		{#if success}
			<div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded mb-4">
				{success}
			</div>
		{/if}

		<div class="space-y-4">
			<div>
				<label for="newPassword" class="block text-sm font-medium mb-2">New Password</label>
				<input
					type="password"
					id="newPassword"
					bind:value={newPassword}
					class="w-full px-3 py-2 border border-input rounded-md bg-background"
				/>
			</div>

			<div>
				<label for="confirmPassword" class="block text-sm font-medium mb-2">Confirm Password</label>
				<input
					type="password"
					id="confirmPassword"
					bind:value={confirmPassword}
					class="w-full px-3 py-2 border border-input rounded-md bg-background"
				/>
			</div>

			<button
				onclick={updateStaffPassword}
				disabled={loading}
				class="bg-gold hover:bg-gold-dark text-black font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
			>
				{loading ? 'Updating...' : 'Update Password'}
			</button>
		</div>
	</div>
</div>
