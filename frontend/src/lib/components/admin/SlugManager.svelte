<script lang="ts">
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

	const baseUrl = 'https://tributestream.com';

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
	let changeUrlCleaned = $state('');
	let isChangingUrl = $state(false);
	let changeUrlError = $state<string | null>(null);
	let changeUrlSuccess = $state<string | null>(null);
	let checkDebounce: ReturnType<typeof setTimeout>;

	// Add mirror form
	let showAddMirror = $state(false);
	let mirrorInput = $state('');
	let mirrorChecking = $state(false);
	let mirrorAvailable = $state<boolean | null>(null);
	let mirrorCleaned = $state('');
	let isAddingMirror = $state(false);
	let mirrorError = $state<string | null>(null);
	let mirrorSuccess = $state<string | null>(null);

	let removingAlias = $state<string | null>(null);
	let removeError = $state<string | null>(null);

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
				changeUrlCleaned = result.cleanedSlug || '';
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
		changeUrlSuccess = null;

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

			changeUrlSuccess = 'URL changed! The previous link now mirrors this one automatically.';
			showChangeUrl = false;
			await onUpdate?.();

			setTimeout(() => {
				changeUrlSuccess = null;
			}, 5000);
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
				mirrorCleaned = result.cleanedSlug || '';
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
		mirrorSuccess = null;

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

			mirrorSuccess = 'Mirror link added — both URLs now work.';
			showAddMirror = false;
			await onUpdate?.();

			setTimeout(() => {
				mirrorSuccess = null;
			}, 5000);
		} catch (err: any) {
			mirrorError = err.message || 'Failed to add mirror link';
		} finally {
			isAddingMirror = false;
		}
	}

	async function removeAlias(alias: string) {
		if (!confirm(`Remove mirror link "${baseUrl}/${alias}"? It will stop working immediately.`)) {
			return;
		}

		removingAlias = alias;
		removeError = null;

		try {
			const response = await fetch(
				`/api/admin/memorials/${memorial.id}/slug/aliases/${encodeURIComponent(alias)}`,
				{ method: 'DELETE' }
			);

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.message || 'Failed to remove mirror link');
			}

			await onUpdate?.();
		} catch (err: any) {
			removeError = err.message || 'Failed to remove mirror link';
		} finally {
			removingAlias = null;
		}
	}

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// Clipboard API unavailable — ignore, the URL is still visible to copy manually.
		}
	}
</script>

<div class="card">
	<div class="section-header">
		<h2>🔗 Public URL</h2>
	</div>

	<div class="url-row primary-url">
		<span class="url-badge">Primary</span>
		<code>{baseUrl}/{memorial.fullSlug}</code>
		<button class="icon-btn" onclick={() => copyToClipboard(`${baseUrl}/${memorial.fullSlug}`)}>
			📋 Copy
		</button>
	</div>

	{#if memorial.additionalSlugs && memorial.additionalSlugs.length > 0}
		<div class="mirrors-list">
			{#each memorial.additionalSlugs as alias (alias)}
				<div class="url-row">
					<span class="url-badge mirror-badge">Mirror</span>
					<code>{baseUrl}/{alias}</code>
					<button class="icon-btn" onclick={() => copyToClipboard(`${baseUrl}/${alias}`)}>
						📋 Copy
					</button>
					<button
						class="icon-btn danger"
						onclick={() => removeAlias(alias)}
						disabled={removingAlias === alias}
					>
						{removingAlias === alias ? '⏳' : '🗑️ Remove'}
					</button>
				</div>
			{/each}
		</div>
	{/if}

	{#if removeError}<div class="error-message">{removeError}</div>{/if}
	{#if changeUrlSuccess}<div class="success-message">{changeUrlSuccess}</div>{/if}
	{#if mirrorSuccess}<div class="success-message">{mirrorSuccess}</div>{/if}

	<div class="url-actions">
		{#if !showChangeUrl}
			<button onclick={openChangeUrl}>✏️ Change URL</button>
		{/if}
		{#if !showAddMirror}
			<button onclick={openAddMirror}>➕ Add Mirror Link</button>
		{/if}
	</div>

	{#if showChangeUrl}
		<div class="url-form">
			<p class="warn-text">
				⚠️ The old link will keep working automatically as a mirror unless you remove it below after
				saving.
			</p>
			<div class="form-group">
				<label for="new-slug">New URL slug</label>
				<div class="slug-input-row">
					<span class="slug-prefix">{baseUrl}/</span>
					<input
						id="new-slug"
						type="text"
						bind:value={newSlugInput}
						oninput={onChangeUrlInput}
						disabled={isChangingUrl}
					/>
				</div>
				{#if changeUrlChecking}
					<p class="help-text">Checking availability…</p>
				{:else if changeUrlAvailable === true}
					<p class="help-text available">✅ Available</p>
				{:else if changeUrlAvailable === false}
					<p class="help-text unavailable">❌ Already in use</p>
				{/if}
				{#if changeUrlError}<div class="error-message">{changeUrlError}</div>{/if}
			</div>
			<div class="form-actions">
				<button
					class="primary-btn"
					onclick={submitChangeUrl}
					disabled={isChangingUrl || changeUrlAvailable === false || !newSlugInput.trim()}
				>
					{isChangingUrl ? '⏳ Saving...' : '💾 Save New URL'}
				</button>
				<button onclick={() => (showChangeUrl = false)} disabled={isChangingUrl}>Cancel</button>
			</div>
		</div>
	{/if}

	{#if showAddMirror}
		<div class="url-form">
			<div class="form-group">
				<label for="mirror-slug">Mirror URL slug</label>
				<div class="slug-input-row">
					<span class="slug-prefix">{baseUrl}/</span>
					<input
						id="mirror-slug"
						type="text"
						bind:value={mirrorInput}
						oninput={onMirrorInput}
						placeholder="e.g. john-smith-memorial"
						disabled={isAddingMirror}
					/>
				</div>
				{#if mirrorChecking}
					<p class="help-text">Checking availability…</p>
				{:else if mirrorAvailable === true}
					<p class="help-text available">✅ Available</p>
				{:else if mirrorAvailable === false}
					<p class="help-text unavailable">❌ Already in use</p>
				{/if}
				{#if mirrorError}<div class="error-message">{mirrorError}</div>{/if}
			</div>
			<div class="form-actions">
				<button
					class="primary-btn"
					onclick={submitAddMirror}
					disabled={isAddingMirror || mirrorAvailable === false || !mirrorInput.trim()}
				>
					{isAddingMirror ? '⏳ Saving...' : '💾 Add Mirror Link'}
				</button>
				<button onclick={() => (showAddMirror = false)} disabled={isAddingMirror}>Cancel</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}
	h2 {
		font-size: 1.25rem;
		margin: 0;
	}
	.section-header {
		margin-bottom: 1rem;
	}
	.url-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0;
		flex-wrap: wrap;
	}
	.url-row code {
		flex: 1;
		min-width: 200px;
		background: #f7fafc;
		padding: 0.375rem 0.625rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
	}
	.url-badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		background: #bee3f8;
		color: #2a4365;
	}
	.mirror-badge {
		background: #e9d8fd;
		color: #44337a;
	}
	.mirrors-list {
		border-top: 1px solid #e2e8f0;
		margin-top: 0.5rem;
	}
	.url-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1rem;
	}
	.url-form {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}
	.warn-text {
		font-size: 0.8125rem;
		color: #975a16;
		background: #fefcbf;
		padding: 0.625rem 0.875rem;
		border-radius: 0.375rem;
		margin: 0 0 1rem 0;
	}
	.form-group {
		margin-bottom: 1rem;
	}
	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #4a5568;
		font-size: 0.875rem;
	}
	.slug-input-row {
		display: flex;
		align-items: center;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		overflow: hidden;
	}
	.slug-prefix {
		padding: 0.625rem;
		background: #edf2f7;
		color: #718096;
		font-size: 0.8125rem;
		white-space: nowrap;
	}
	.slug-input-row input {
		flex: 1;
		border: none;
		padding: 0.625rem;
		font-size: 0.875rem;
	}
	.slug-input-row input:focus {
		outline: none;
	}
	.help-text {
		margin: 0.375rem 0 0 0;
		font-size: 0.8125rem;
		color: #718096;
	}
	.help-text.available {
		color: #22543d;
	}
	.help-text.unavailable {
		color: #742a2a;
	}
	.form-actions {
		display: flex;
		gap: 0.75rem;
	}
	button {
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
	}
	button:hover {
		background: #f7fafc;
	}
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	button.primary-btn {
		background: #3182ce;
		color: white;
		border-color: #3182ce;
		font-weight: 600;
	}
	button.primary-btn:hover {
		background: #2c5282;
	}
	.icon-btn {
		padding: 0.25rem 0.625rem;
		font-size: 0.8125rem;
	}
	.icon-btn.danger {
		color: #c53030;
	}
	.success-message {
		padding: 0.75rem 1rem;
		background: #c6f6d5;
		color: #22543d;
		border-radius: 0.375rem;
		margin-top: 0.75rem;
	}
	.error-message {
		padding: 0.5rem 0.75rem;
		background: #fed7d7;
		color: #742a2a;
		border-radius: 0.375rem;
		margin-top: 0.5rem;
		font-size: 0.8125rem;
	}
</style>
