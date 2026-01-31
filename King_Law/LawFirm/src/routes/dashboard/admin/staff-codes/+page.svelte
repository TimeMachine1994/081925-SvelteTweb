<script lang="ts">
	import { onMount } from 'svelte';

	type StaffCode = {
		id: string;
		employeeNumber: string;
		role: 'lawyer' | 'staff' | 'admin';
		assignedToUserId: string | null;
		assignedUser?: { firstName: string; lastName: string; email: string } | null;
		createdAt: number;
		usedAt: number | null;
	};

	let codes = $state<StaffCode[]>([]);
	let loading = $state(true);
	let error = $state('');
	let showCreateModal = $state(false);

	// Create form
	let newEmployeeNumber = $state('');
	let newRole = $state<'lawyer' | 'staff' | 'admin'>('lawyer');
	let creating = $state(false);

	onMount(async () => {
		await loadCodes();
	});

	async function loadCodes() {
		try {
			const response = await fetch('/api/admin/staff-codes');
			if (response.ok) {
				codes = await response.json();
			} else {
				error = 'Failed to load staff codes';
			}
		} catch (err) {
			error = 'Failed to load staff codes';
		} finally {
			loading = false;
		}
	}

	async function createCode() {
		if (!newEmployeeNumber.trim()) {
			error = 'Employee number is required';
			return;
		}

		creating = true;
		error = '';

		try {
			const response = await fetch('/api/admin/staff-codes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeNumber: newEmployeeNumber.trim().toUpperCase(),
					role: newRole
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to create code');
			}

			await loadCodes();
			showCreateModal = false;
			newEmployeeNumber = '';
			newRole = 'lawyer';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create code';
		} finally {
			creating = false;
		}
	}

	async function deleteCode(id: string) {
		if (!confirm('Are you sure you want to delete this code?')) return;

		try {
			const response = await fetch(`/api/admin/staff-codes/${id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to delete code');
			}

			await loadCodes();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete code';
		}
	}
</script>

<div>
	<div class="flex justify-between items-center mb-8">
		<div>
			<h1 class="text-3xl font-title">Staff Codes</h1>
			<p class="text-muted-foreground mt-1">Manage employee registration codes</p>
		</div>
		<button
			onclick={() => showCreateModal = true}
			class="bg-gold hover:bg-gold-dark text-black font-semibold py-2 px-4 rounded-md transition-colors"
		>
			Create Code
		</button>
	</div>

	{#if error}
		<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded mb-4">
			{error}
			<button onclick={() => error = ''} class="float-right">×</button>
		</div>
	{/if}

	<!-- Codes Table -->
	<div class="bg-card border border-border rounded-lg overflow-hidden">
		<table class="w-full">
			<thead class="bg-muted">
				<tr>
					<th class="px-4 py-3 text-left text-sm font-medium">Employee Number</th>
					<th class="px-4 py-3 text-left text-sm font-medium">Role</th>
					<th class="px-4 py-3 text-left text-sm font-medium">Status</th>
					<th class="px-4 py-3 text-left text-sm font-medium">Assigned To</th>
					<th class="px-4 py-3 text-left text-sm font-medium">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#if loading}
					<tr>
						<td colspan="5" class="px-4 py-8 text-center text-muted-foreground">Loading...</td>
					</tr>
				{:else if codes.length === 0}
					<tr>
						<td colspan="5" class="px-4 py-8 text-center text-muted-foreground">No staff codes created yet</td>
					</tr>
				{:else}
					{#each codes as code}
						<tr>
							<td class="px-4 py-3 font-mono">{code.employeeNumber}</td>
							<td class="px-4 py-3">
								<span class="px-2 py-1 text-xs rounded capitalize {
									code.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
									code.role === 'lawyer' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
									'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
								}">
									{code.role}
								</span>
							</td>
							<td class="px-4 py-3">
								{#if code.assignedToUserId}
									<span class="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 rounded">Used</span>
								{:else}
									<span class="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 rounded">Available</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-sm">
								{#if code.assignedUser}
									{code.assignedUser.firstName} {code.assignedUser.lastName}
									<span class="text-muted-foreground">({code.assignedUser.email})</span>
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</td>
							<td class="px-4 py-3">
								{#if !code.assignedToUserId}
									<button
										onclick={() => deleteCode(code.id)}
										class="text-red-600 hover:text-red-800 text-sm"
									>
										Delete
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>

<!-- Create Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
		<div class="bg-card border border-border rounded-lg p-6 w-full max-w-md">
			<h2 class="text-xl font-semibold mb-4">Create Staff Code</h2>
			
			<div class="mb-4">
				<label for="employeeNumber" class="block text-sm font-medium mb-2">Employee Number</label>
				<input
					type="text"
					id="employeeNumber"
					bind:value={newEmployeeNumber}
					placeholder="e.g., EMP001"
					class="w-full px-3 py-2 border border-input rounded-md bg-background uppercase"
				/>
			</div>

			<div class="mb-6">
				<label for="role" class="block text-sm font-medium mb-2">Role</label>
				<select
					id="role"
					bind:value={newRole}
					class="w-full px-3 py-2 border border-input rounded-md bg-background"
				>
					<option value="lawyer">Lawyer</option>
					<option value="staff">Staff</option>
					<option value="admin">Admin</option>
				</select>
			</div>

			<div class="flex gap-3">
				<button
					onclick={() => showCreateModal = false}
					class="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
				>
					Cancel
				</button>
				<button
					onclick={createCode}
					disabled={creating}
					class="flex-1 bg-gold hover:bg-gold-dark text-black font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
				>
					{creating ? 'Creating...' : 'Create'}
				</button>
			</div>
		</div>
	</div>
{/if}
