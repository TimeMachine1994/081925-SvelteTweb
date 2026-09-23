<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { adminToast } from '$lib/stores/adminToast';
	import { Card, SectionHeader, Button, Alert, ConfirmDialog } from '$lib/components/admin/ui';
	import SlugManager from '$lib/components/admin/SlugManager.svelte';

	let { data } = $props();
	const { memorial } = data;

	// ─── Owner assignment ──────────────────────────────────────────────
	let showAssignOwner = $state(false);
	let assignEmail = $state('');
	let assignName = $state('');
	let isAssigning = $state(false);
	let assignError = $state('');

	async function handleAssignOwner(event: SubmitEvent) {
		event.preventDefault();
		isAssigning = true;
		assignError = '';
		try {
			const response = await fetch(`/api/memorials/${memorial.id}/assign`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: assignEmail, name: assignName })
			});
			const result = await response.json();
			if (!response.ok) {
				assignError = result.error || 'Failed to assign owner';
				return;
			}
			showAssignOwner = false;
			assignEmail = '';
			assignName = '';
			adminToast.success('Owner assigned');
			await invalidateAll();
		} catch (err) {
			console.error('Failed to assign owner:', err);
			assignError = 'Network error. Please try again.';
		} finally {
			isAssigning = false;
		}
	}

	// ─── Display settings ───────────────────────────────────────────────
	let isEditingDisplay = $state(false);
	let isSavingDisplay = $state(false);
	let displayError = $state<string | null>(null);
	let customTitleInput = $state(memorial.customTitle || '');

	async function handleSaveDisplaySettings() {
		isSavingDisplay = true;
		displayError = null;
		try {
			const response = await fetch(`/api/admin/memorials/${memorial.id}/display-settings`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ customTitle: customTitleInput.trim() })
			});
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to save display settings');
			}
			adminToast.success('Display settings saved');
			isEditingDisplay = false;
			await invalidateAll();
		} catch (err: any) {
			displayError = err.message || 'Failed to save display settings';
		} finally {
			isSavingDisplay = false;
		}
	}

	function cancelDisplayEdit() {
		isEditingDisplay = false;
		customTitleInput = memorial.customTitle || '';
		displayError = null;
	}

	let confirmClearDisplay = $state(false);

	async function clearDisplaySettings() {
		confirmClearDisplay = false;
		isSavingDisplay = true;
		displayError = null;
		try {
			const response = await fetch(`/api/admin/memorials/${memorial.id}/display-settings`, {
				method: 'DELETE'
			});
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to clear display settings');
			}
			customTitleInput = '';
			adminToast.success('Display settings cleared');
			isEditingDisplay = false;
			await invalidateAll();
		} catch (err: any) {
			displayError = err.message || 'Failed to clear display settings';
		} finally {
			isSavingDisplay = false;
		}
	}

	// ─── Danger zone: delete ────────────────────────────────────────────
	let confirmDelete = $state(false);
	let isDeleting = $state(false);

	async function handleDelete() {
		isDeleting = true;
		try {
			const response = await fetch('/api/admin/bulk-actions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'delete', ids: [memorial.id], resourceType: 'memorial' })
			});
			const result = await response.json();

			if (response.ok && result.success?.length > 0) {
				adminToast.success('Memorial deleted');
				goto('/admin/services/memorials');
				return;
			}

			const errorMsg = result.failed?.[0]?.error || result.error || 'Failed to delete memorial';
			adminToast.error(errorMsg);
		} catch (err) {
			console.error('❌ [DELETE] Exception:', err);
			adminToast.error('An error occurred while deleting the memorial');
		} finally {
			isDeleting = false;
			confirmDelete = false;
		}
	}
</script>

<!-- Owner -->
<Card class="mb-6">
	<SectionHeader title="Owner" icon="user" />
	<p class="text-sm text-slate-700">
		{#if memorial.ownerUid}
			<a
				href={`/admin/users/memorial-owners/${memorial.ownerUid}`}
				class="font-medium text-sky-700 hover:underline">{memorial.creatorEmail}</a
			>
		{:else}
			<em class="text-slate-500">none assigned</em>
		{/if}
	</p>
	<div class="mt-3">
		<Button size="sm" variant="secondary" onclick={() => (showAssignOwner = !showAssignOwner)}>
			{memorial.ownerUid ? 'Change Owner' : 'Assign Owner'}
		</Button>
	</div>
	{#if showAssignOwner}
		<form
			class="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4"
			onsubmit={handleAssignOwner}
		>
			<input
				type="email"
				placeholder="family@example.com"
				bind:value={assignEmail}
				required
				class="w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
			/>
			<input
				type="text"
				placeholder="Name (optional)"
				bind:value={assignName}
				class="w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
			/>
			<div class="flex flex-wrap gap-2">
				<Button type="submit" variant="primary" loading={isAssigning} class="min-h-11 sm:min-h-0">
					Save
				</Button>
				<Button
					type="button"
					variant="secondary"
					onclick={() => (showAssignOwner = false)}
					class="min-h-11 sm:min-h-0"
				>
					Cancel
				</Button>
			</div>
			{#if assignError}<p class="text-sm text-red-600">{assignError}</p>{/if}
			<p class="text-xs text-slate-500">
				If no account exists for this email, one is created and a welcome email with login details
				is sent.
			</p>
		</form>
	{/if}
</Card>

<!-- URL Slug + mirror links -->
<SlugManager {memorial} onUpdate={() => invalidateAll()} />

<!-- Display settings -->
<Card class="mb-6">
	<SectionHeader title="Display Settings" icon="settings-gear">
		{#snippet actions()}
			{#if !isEditingDisplay}
				<Button size="sm" variant="secondary" onclick={() => (isEditingDisplay = true)}>Edit</Button
				>
			{/if}
		{/snippet}
	</SectionHeader>

	{#if displayError}
		<Alert variant="danger" class="mb-3">{displayError}</Alert>
	{/if}

	{#if isEditingDisplay}
		<div class="flex flex-col gap-2">
			<label for="custom-title" class="text-sm font-semibold text-slate-700"
				>Custom Title Override</label
			>
			<input
				id="custom-title"
				type="text"
				bind:value={customTitleInput}
				placeholder={`Override the default title (e.g., 'Celebrating the Life of ${memorial.lovedOneName}')`}
				disabled={isSavingDisplay}
				maxlength="200"
				class="w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
			/>
			<p class="text-xs text-slate-500">
				Leave blank to use "{memorial.lovedOneName}" as the title
			</p>
			<div class="mt-2 flex flex-wrap gap-2">
				<Button
					variant="primary"
					loading={isSavingDisplay}
					onclick={handleSaveDisplaySettings}
					class="min-h-11 sm:min-h-0"
				>
					Save Display Settings
				</Button>
				<Button
					variant="secondary"
					disabled={isSavingDisplay}
					onclick={cancelDisplayEdit}
					class="min-h-11 sm:min-h-0"
				>
					Cancel
				</Button>
				{#if memorial.customTitle}
					<Button
						variant="danger"
						disabled={isSavingDisplay}
						onclick={() => (confirmClearDisplay = true)}
						class="min-h-11 sm:min-h-0"
					>
						Clear All
					</Button>
				{/if}
			</div>
		</div>
	{:else}
		<p class="text-sm">
			<span class="font-semibold text-slate-600">Custom Title:</span>
			{#if memorial.customTitle}
				<span class="text-slate-800">{memorial.customTitle}</span>
			{:else}
				<em class="text-slate-500">Using default: "{memorial.lovedOneName}"</em>
			{/if}
		</p>
	{/if}
</Card>

<!-- Danger Zone -->
<Card class="border-2 border-red-200">
	<SectionHeader title="Danger Zone" icon="incomplete" />
	<p class="mb-3 text-sm text-slate-600">
		Deleting a memorial marks it as deleted and hides it from the admin list and public site. This
		cannot be undone from this screen.
	</p>
	<Button
		variant="danger"
		icon="delete"
		onclick={() => (confirmDelete = true)}
		class="min-h-11 sm:min-h-0"
	>
		Delete Memorial
	</Button>
</Card>

<ConfirmDialog
	open={confirmDelete}
	title="Delete memorial"
	message={`Are you sure you want to delete "${memorial.lovedOneName}"? This will mark it as deleted and hide it from the admin list.`}
	confirmLabel="Delete"
	variant="danger"
	loading={isDeleting}
	onConfirm={handleDelete}
	onCancel={() => (confirmDelete = false)}
/>

<ConfirmDialog
	open={confirmClearDisplay}
	title="Clear display settings"
	message="Clear the custom title override? This will revert to the default title."
	confirmLabel="Clear"
	variant="danger"
	loading={isSavingDisplay}
	onConfirm={clearDisplaySettings}
	onCancel={() => (confirmClearDisplay = false)}
/>
