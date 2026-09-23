<script lang="ts">
	import { Card, SectionHeader, Button, Alert, CopyButton, ConfirmDialog } from './ui';
	import { memorialPublicUrl, PUBLIC_SITE_ORIGIN } from '$lib/utils/memorial-url';
	import { adminToast } from '$lib/stores/adminToast';

	interface Memorial {
		id: string;
		lovedOneName: string;
		fullSlug: string;
		additionalSlugs?: string[];
	}

	interface Props {
		memorial: Memorial;
		onUpdate?: () => void | Promise<void>;
	}

	let { memorial, onUpdate }: Props = $props();

	function suggestSlug(name: string): string {
		return `celebration-of-life-for-${name
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '')}`.substring(0, 100);
	}

	// Change URL form
	let showChangeUrl = $state(false);
	let newSlugInput = $state('');
	let changeUrlChecking = $state(false);
	let changeUrlAvailable = $state<boolean | null>(null);
	let isChangingUrl = $state(false);
	let changeUrlError = $state<string | null>(null);
	let checkDebounce: ReturnType<typeof setTimeout>;

	// Add mirror form
	let showAddMirror = $state(false);
	let mirrorInput = $state('');
	let mirrorChecking = $state(false);
	let mirrorAvailable = $state<boolean | null>(null);
	let isAddingMirror = $state(false);
	let mirrorError = $state<string | null>(null);

	let aliasPendingRemoval = $state<string | null>(null);
	let isRemovingAlias = $state(false);

	async function checkAvailability(slug: string) {
		const response = await fetch(
			`/api/admin/memorials/${memorial.id}/slug/check?slug=${encodeURIComponent(slug)}`
		);
		return response.json() as Promise<{
			available: boolean;
			cleanedSlug: string | null;
			error?: string;
		}>;
	}

	function openChangeUrl() {
		newSlugInput = memorial.fullSlug || suggestSlug(memorial.lovedOneName);
		changeUrlAvailable = null;
		changeUrlError = null;
		showChangeUrl = true;
	}

	function onChangeUrlInput() {
		changeUrlAvailable = null;
		changeUrlError = null;
		clearTimeout(checkDebounce);
		const value = newSlugInput;
		checkDebounce = setTimeout(async () => {
			if (!value.trim()) return;
			changeUrlChecking = true;
			try {
				const result = await checkAvailability(value);
				changeUrlAvailable = result.cleanedSlug === memorial.fullSlug ? true : result.available;
				if (result.error) changeUrlError = result.error;
			} finally {
				changeUrlChecking = false;
			}
		}, 400);
	}

	async function submitChangeUrl() {
		isChangingUrl = true;
		changeUrlError = null;

		try {
			const response = await fetch(`/api/admin/memorials/${memorial.id}/slug`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ newSlug: newSlugInput })
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.message || 'Failed to change URL');
			}

			adminToast.success('URL changed — the previous link now mirrors this one automatically');
			showChangeUrl = false;
			await onUpdate?.();
		} catch (err: any) {
			changeUrlError = err.message || 'Failed to change URL';
		} finally {
			isChangingUrl = false;
		}
	}

	function openAddMirror() {
		mirrorInput = '';
		mirrorAvailable = null;
		mirrorError = null;
		showAddMirror = true;
	}

	function onMirrorInput() {
		mirrorAvailable = null;
		mirrorError = null;
		clearTimeout(checkDebounce);
		const value = mirrorInput;
		checkDebounce = setTimeout(async () => {
			if (!value.trim()) return;
			mirrorChecking = true;
			try {
				const result = await checkAvailability(value);
				mirrorAvailable = result.available;
				if (result.error) mirrorError = result.error;
			} finally {
				mirrorChecking = false;
			}
		}, 400);
	}

	async function submitAddMirror() {
		isAddingMirror = true;
		mirrorError = null;

		try {
			const response = await fetch(`/api/admin/memorials/${memorial.id}/slug/aliases`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ alias: mirrorInput })
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.message || 'Failed to add mirror link');
			}

			adminToast.success('Mirror link added — both URLs now work');
			showAddMirror = false;
			await onUpdate?.();
		} catch (err: any) {
			mirrorError = err.message || 'Failed to add mirror link';
		} finally {
			isAddingMirror = false;
		}
	}

	async function confirmRemoveAlias() {
		if (!aliasPendingRemoval) return;
		isRemovingAlias = true;

		try {
			const response = await fetch(
				`/api/admin/memorials/${memorial.id}/slug/aliases/${encodeURIComponent(aliasPendingRemoval)}`,
				{ method: 'DELETE' }
			);

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.message || 'Failed to remove mirror link');
			}

			adminToast.success('Mirror link removed');
			await onUpdate?.();
		} catch (err: any) {
			adminToast.error(err.message || 'Failed to remove mirror link');
		} finally {
			isRemovingAlias = false;
			aliasPendingRemoval = null;
		}
	}
</script>

<Card class="mb-6">
	<SectionHeader title="Public URL" icon="external" />

	<div class="flex flex-col gap-2">
		<div class="flex flex-wrap items-center gap-3">
			<span class="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800"
				>Primary</span
			>
			<a
				href={memorialPublicUrl(memorial.fullSlug)}
				target="_blank"
				rel="noopener noreferrer"
				class="min-w-0 flex-1 text-sm font-medium break-all text-sky-700 hover:underline"
			>
				{memorialPublicUrl(memorial.fullSlug)}
			</a>
			<CopyButton
				value={memorialPublicUrl(memorial.fullSlug)}
				label="Copy"
				toastMessage="Memorial link copied"
			/>
		</div>

		{#each memorial.additionalSlugs || [] as alias (alias)}
			<div class="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2">
				<span class="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800"
					>Mirror</span
				>
				<a
					href={memorialPublicUrl(alias)}
					target="_blank"
					rel="noopener noreferrer"
					class="min-w-0 flex-1 text-sm font-medium break-all text-sky-700 hover:underline"
				>
					{memorialPublicUrl(alias)}
				</a>
				<CopyButton
					value={memorialPublicUrl(alias)}
					label="Copy"
					toastMessage="Mirror link copied"
					size="sm"
				/>
				<Button
					variant="danger"
					size="sm"
					icon="delete"
					onclick={() => (aliasPendingRemoval = alias)}
				>
					Remove
				</Button>
			</div>
		{/each}
	</div>

	<div class="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
		{#if !showChangeUrl}
			<Button size="sm" variant="secondary" icon="edit" onclick={openChangeUrl}>Change URL</Button>
		{/if}
		{#if !showAddMirror}
			<Button size="sm" variant="secondary" icon="add" onclick={openAddMirror}>
				Add Mirror Link
			</Button>
		{/if}
	</div>

	{#if showChangeUrl}
		<div class="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4">
			<Alert variant="warning">
				The old link will keep working automatically as a mirror unless you remove it below after
				saving.
			</Alert>
			<div>
				<label for="new-slug" class="mb-1 block text-sm font-semibold text-slate-700"
					>New URL slug</label
				>
				<div class="flex items-stretch overflow-hidden rounded-md border border-slate-300">
					<span class="flex items-center bg-slate-50 px-3 text-sm text-slate-500"
						>{PUBLIC_SITE_ORIGIN}/</span
					>
					<input
						id="new-slug"
						type="text"
						bind:value={newSlugInput}
						oninput={onChangeUrlInput}
						disabled={isChangingUrl}
						class="min-w-0 flex-1 border-0 px-3 py-2 text-base focus:ring-2 focus:ring-sky-200 focus:outline-none"
					/>
				</div>
				{#if changeUrlChecking}
					<p class="mt-1 text-xs text-slate-500">Checking availability…</p>
				{:else if changeUrlAvailable === true}
					<p class="mt-1 text-xs text-green-700">✓ Available</p>
				{:else if changeUrlAvailable === false}
					<p class="mt-1 text-xs text-red-600">✕ Already in use</p>
				{/if}
				{#if changeUrlError}<p class="mt-1 text-xs text-red-600">{changeUrlError}</p>{/if}
			</div>
			<div class="flex flex-wrap gap-2">
				<Button
					variant="primary"
					loading={isChangingUrl}
					disabled={changeUrlAvailable === false || !newSlugInput.trim()}
					onclick={submitChangeUrl}
					class="min-h-11 sm:min-h-0"
				>
					Save New URL
				</Button>
				<Button
					variant="secondary"
					disabled={isChangingUrl}
					onclick={() => (showChangeUrl = false)}
					class="min-h-11 sm:min-h-0"
				>
					Cancel
				</Button>
			</div>
		</div>
	{/if}

	{#if showAddMirror}
		<div class="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4">
			<div>
				<label for="mirror-slug" class="mb-1 block text-sm font-semibold text-slate-700"
					>Mirror URL slug</label
				>
				<div class="flex items-stretch overflow-hidden rounded-md border border-slate-300">
					<span class="flex items-center bg-slate-50 px-3 text-sm text-slate-500"
						>{PUBLIC_SITE_ORIGIN}/</span
					>
					<input
						id="mirror-slug"
						type="text"
						bind:value={mirrorInput}
						oninput={onMirrorInput}
						placeholder="e.g. john-smith-memorial"
						disabled={isAddingMirror}
						class="min-w-0 flex-1 border-0 px-3 py-2 text-base focus:ring-2 focus:ring-sky-200 focus:outline-none"
					/>
				</div>
				{#if mirrorChecking}
					<p class="mt-1 text-xs text-slate-500">Checking availability…</p>
				{:else if mirrorAvailable === true}
					<p class="mt-1 text-xs text-green-700">✓ Available</p>
				{:else if mirrorAvailable === false}
					<p class="mt-1 text-xs text-red-600">✕ Already in use</p>
				{/if}
				{#if mirrorError}<p class="mt-1 text-xs text-red-600">{mirrorError}</p>{/if}
			</div>
			<div class="flex flex-wrap gap-2">
				<Button
					variant="primary"
					loading={isAddingMirror}
					disabled={mirrorAvailable === false || !mirrorInput.trim()}
					onclick={submitAddMirror}
					class="min-h-11 sm:min-h-0"
				>
					Add Mirror Link
				</Button>
				<Button
					variant="secondary"
					disabled={isAddingMirror}
					onclick={() => (showAddMirror = false)}
					class="min-h-11 sm:min-h-0"
				>
					Cancel
				</Button>
			</div>
		</div>
	{/if}
</Card>

<ConfirmDialog
	open={!!aliasPendingRemoval}
	title="Remove mirror link"
	message={`Remove "${memorialPublicUrl(aliasPendingRemoval)}"? It will stop working immediately.`}
	confirmLabel="Remove"
	variant="danger"
	loading={isRemovingAlias}
	onConfirm={confirmRemoveAlias}
	onCancel={() => (aliasPendingRemoval = null)}
/>
