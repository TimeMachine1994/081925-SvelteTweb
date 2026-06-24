<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { resolveAnyReference, type ResolvedReference } from '$lib/admin/relationships';

	type CollectionConfig = {
		id: string;
		label: string;
		description: string;
		access: 'read-write' | 'read-only';
		softDelete: boolean;
		highRiskFields: string[];
	};

	type DatabaseDocument = {
		id: string;
		path: string;
		data: Record<string, any>;
	};

	let { data } = $props();

	let collections = $state<CollectionConfig[]>(data.collections || []);
	let selectedCollection = $state<CollectionConfig | null>(collections[0] || null);
	let documents = $state<DatabaseDocument[]>([]);
	let selectedDocument = $state<DatabaseDocument | null>(null);
	let subcollections = $state<string[]>([]);
	let collectionSearch = $state('');
	let documentSearch = $state('');
	let editorJson = $state('{}');
	let createDocumentId = $state('');
	let createJson = $state('{\n\t\n}');
	let deleteMode = $state<'soft' | 'hard'>('soft');
	let loading = $state(false);
	let saving = $state(false);
	let error = $state('');
	let notice = $state('');
	let showCreate = $state(false);
	let showDelete = $state(false);
	let loadedCollections = $state<Set<string>>(new Set());
	let navStack = $state<Array<{ collectionId: string | null; documentId: string | null }>>([]);

	let filteredCollections = $derived.by(() => {
		const query = collectionSearch.trim().toLowerCase();
		if (!query) return collections;
		return collections.filter((collection) => {
			return [collection.id, collection.label, collection.description]
				.join(' ')
				.toLowerCase()
				.includes(query);
		});
	});

	let filteredDocuments = $derived.by(() => {
		const query = documentSearch.trim().toLowerCase();
		if (!query) return documents;
		return documents.filter((doc) => {
			return `${doc.id} ${JSON.stringify(doc.data)}`.toLowerCase().includes(query);
		});
	});

	let documentReferences = $derived.by(() => {
		if (!selectedDocument) return [] as Array<{ key: string; ref: ResolvedReference }>;
		const refs: Array<{ key: string; ref: ResolvedReference }> = [];
		for (const [key, value] of Object.entries(selectedDocument.data)) {
			const ref = resolveAnyReference(key, value);
			if (ref) refs.push({ key, ref });
		}
		return refs;
	});

	function compactValue(value: any) {
		if (value === null || value === undefined) return '—';
		if (typeof value === 'object') {
			if (value.__type === 'timestamp') return value.value;
			if (value.__type === 'reference') return value.path;
			return JSON.stringify(value).slice(0, 80);
		}
		return String(value).slice(0, 80);
	}

	function previewFields(doc: DatabaseDocument) {
		return Object.entries(doc.data).slice(0, 4);
	}

	async function api(path: string, options: RequestInit = {}) {
		const response = await fetch(path, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...(options.headers || {})
			}
		});
		const payload = await response.json();
		if (!response.ok) {
			throw new Error(payload.error || 'Request failed');
		}
		return payload;
	}

	async function loadCollection(collection: CollectionConfig) {
		selectedCollection = collection;
		selectedDocument = null;
		subcollections = [];
		error = '';
		notice = '';
		loading = true;
		try {
			const payload = await api(`/api/admin/database?collection=${encodeURIComponent(collection.id)}&limit=50`);
			documents = payload.documents || [];
			loadedCollections = new Set([...loadedCollections, collection.id]);
		} catch (err: any) {
			documents = [];
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function selectDocument(doc: DatabaseDocument) {
		if (!selectedCollection) return;
		selectedDocument = doc;
		error = '';
		notice = '';
		loading = true;
		try {
			const payload = await api(
				`/api/admin/database?collection=${encodeURIComponent(selectedCollection.id)}&document=${encodeURIComponent(doc.id)}`
			);
			selectedDocument = payload.document;
			subcollections = payload.subcollections || [];
			editorJson = JSON.stringify(payload.document.data, null, '\t');
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function openById(collection: CollectionConfig, id: string) {
		loading = true;
		error = '';
		try {
			const payload = await api(
				`/api/admin/database?collection=${encodeURIComponent(collection.id)}&document=${encodeURIComponent(id)}`
			);
			selectedDocument = payload.document;
			subcollections = payload.subcollections || [];
			editorJson = JSON.stringify(payload.document.data, null, '\t');
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function openByField(collection: CollectionConfig, field: string, value: string) {
		loading = true;
		error = '';
		try {
			const payload = await api(
				`/api/admin/database?collection=${encodeURIComponent(collection.id)}&field=${encodeURIComponent(field)}&value=${encodeURIComponent(value)}`
			);
			selectedDocument = payload.document;
			subcollections = [];
			editorJson = JSON.stringify(payload.document.data, null, '\t');
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function openReference(ref: ResolvedReference) {
		const target = collections.find((collection) => collection.id === ref.collection);
		if (!target) {
			error = `Collection "${ref.collection}" is not available in the database browser.`;
			return;
		}
		navStack = [
			...navStack,
			{ collectionId: selectedCollection?.id ?? null, documentId: selectedDocument?.id ?? null }
		];
		await loadCollection(target);
		if (ref.by === 'email') {
			await openByField(target, 'email', ref.value);
		} else {
			await openById(target, ref.value);
		}
	}

	async function goBack() {
		const prev = navStack[navStack.length - 1];
		navStack = navStack.slice(0, -1);
		if (!prev) return;
		const target = collections.find((collection) => collection.id === prev.collectionId);
		if (!target) return;
		await loadCollection(target);
		if (prev.documentId) {
			await openById(target, prev.documentId);
		}
	}

	async function saveDocument() {
		if (!selectedCollection || !selectedDocument) return;
		saving = true;
		error = '';
		notice = '';
		try {
			const parsed = JSON.parse(editorJson);
			await api('/api/admin/database', {
				method: 'PATCH',
				body: JSON.stringify({
					collection: selectedCollection.id,
					documentId: selectedDocument.id,
					data: parsed
				})
			});
			notice = 'Document saved.';
			await loadCollection(selectedCollection);
		} catch (err: any) {
			error = err.message;
		} finally {
			saving = false;
		}
	}

	async function createDocument() {
		if (!selectedCollection) return;
		saving = true;
		error = '';
		notice = '';
		try {
			const parsed = JSON.parse(createJson);
			const payload = await api('/api/admin/database', {
				method: 'POST',
				body: JSON.stringify({
					collection: selectedCollection.id,
					documentId: createDocumentId.trim() || undefined,
					data: parsed
				})
			});
			notice = `Document ${payload.documentId} created.`;
			showCreate = false;
			createDocumentId = '';
			createJson = '{\n\t\n}';
			await loadCollection(selectedCollection);
		} catch (err: any) {
			error = err.message;
		} finally {
			saving = false;
		}
	}

	async function deleteSelectedDocument() {
		if (!selectedCollection || !selectedDocument) return;
		saving = true;
		error = '';
		notice = '';
		try {
			await api('/api/admin/database', {
				method: 'DELETE',
				body: JSON.stringify({
					collection: selectedCollection.id,
					documentId: selectedDocument.id,
					mode: deleteMode
				})
			});
			notice = deleteMode === 'hard' ? 'Document permanently deleted.' : 'Document soft deleted.';
			showDelete = false;
			selectedDocument = null;
			await loadCollection(selectedCollection);
		} catch (err: any) {
			error = err.message;
		} finally {
			saving = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		if (showCreate) showCreate = false;
		if (showDelete) showDelete = false;
	}

	onMount(() => {
		const params = $page.url.searchParams;
		const requested = params.get('collection');
		const target =
			(requested && collections.find((collection) => collection.id === requested)) ||
			collections[0] ||
			null;
		if (!target) return;
		loadCollection(target).then(() => {
			const field = params.get('field');
			const value = params.get('value');
			const documentId = params.get('document');
			if (field && value !== null) {
				return openByField(target, field, value);
			}
			if (documentId) {
				return openById(target, documentId);
			}
		});
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<AdminLayout
	title="Database"
	subtitle="Browse and manage allowlisted Firestore collections"
	actions={[
		{
			label: 'Refresh',
			icon: 'refresh',
			onclick: () => selectedCollection && loadCollection(selectedCollection)
		},
		{
			label: 'Create Document',
			icon: 'add',
			onclick: () => (showCreate = true)
		}
	]}
>
	<div class="database-shell">
		<aside class="collection-panel">
			<div class="panel-header">
				<h2>Collections</h2>
				<input bind:value={collectionSearch} placeholder="Search collections" />
			</div>

			<div class="collection-list">
				{#each filteredCollections as collection}
					<button
						class="collection-card"
						class:active={selectedCollection?.id === collection.id}
						onclick={() => loadCollection(collection)}
					>
						<div>
							<strong>{collection.label}</strong>
							<span>{collection.id}</span>
						</div>
						<small class:risk={collection.access === 'read-only'}>{collection.access}</small>
					</button>
				{/each}
			</div>
		</aside>

		<section class="documents-panel">
			<div class="panel-header row">
				<div>
					<h2>{selectedCollection?.label || 'Select a collection'}</h2>
					<p>{selectedCollection?.description}</p>
				</div>
				<input bind:value={documentSearch} placeholder="Search loaded documents" />
			</div>

			{#if error}
				<div class="alert error">{error}</div>
			{/if}
			{#if notice}
				<div class="alert success">{notice}</div>
			{/if}

			{#if loading}
				<div class="empty-state">Loading database records...</div>
			{:else if filteredDocuments.length === 0}
				<div class="empty-state">No documents found for this collection.</div>
			{:else}
				<div class="document-grid">
					{#each filteredDocuments as doc}
						<button
							class="document-row"
							class:active={selectedDocument?.id === doc.id}
							onclick={() => selectDocument(doc)}
						>
							<div class="doc-id">{doc.id}</div>
							<div class="doc-preview">
								{#each previewFields(doc) as [key, value]}
									<span><strong>{key}</strong>: {compactValue(value)}</span>
								{/each}
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</section>

		<section class="editor-panel">
			{#if selectedDocument && selectedCollection}
				<div class="panel-header row">
					<div>
						<h2>Document</h2>
						<p>{selectedDocument.path}</p>
					</div>
					{#if navStack.length > 0}
						<button class="back-btn" onclick={goBack} disabled={loading}>← Back</button>
					{/if}
				</div>

				{#if documentReferences.length > 0}
					<div class="references">
						<strong>References</strong>
						<div class="reference-chips">
							{#each documentReferences as { key, ref } (key)}
								<button
									class="reference-chip"
									onclick={() => openReference(ref)}
									disabled={loading}
									title={`Open ${ref.collection}/${ref.value}`}
								>
									<span class="ref-key">{key}</span>
									<span class="ref-arrow">→</span>
									<span class="ref-target">{ref.collection}</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if selectedCollection.highRiskFields.length > 0}
					<div class="risk-box">
						High-risk fields: {selectedCollection.highRiskFields.join(', ')}
					</div>
				{/if}

				{#if subcollections.length > 0}
					<div class="subcollections">
						<strong>Subcollections</strong>
						{#each subcollections as subcollection}
							<span>{subcollection}</span>
						{/each}
					</div>
				{/if}

				<textarea bind:value={editorJson} spellcheck="false"></textarea>

				<div class="editor-actions">
					<button onclick={() => selectDocument(selectedDocument!)} disabled={saving}>Reset</button>
					<button onclick={() => (showDelete = true)} disabled={saving || selectedCollection.access === 'read-only'} class="danger">
						Delete
					</button>
					<button onclick={saveDocument} disabled={saving || selectedCollection.access === 'read-only'} class="primary">
						{saving ? 'Saving...' : 'Save'}
					</button>
				</div>
			{:else}
				<div class="empty-state">Select a document to view and edit JSON.</div>
			{/if}
		</section>
	</div>

	{#if showCreate && selectedCollection}
		<div class="modal-overlay">
			<button class="modal-backdrop" aria-label="Close dialog" onclick={() => (showCreate = false)}></button>
			<div class="modal-content" role="dialog" aria-modal="true">
				<div class="modal-header">
					<h3>Create document in {selectedCollection.id}</h3>
					<button onclick={() => (showCreate = false)}>✕</button>
				</div>
				{#if selectedCollection.access === 'read-only'}
					<div class="alert error">This collection is read-only.</div>
				{:else}
					<label>
						Document ID (optional)
						<input bind:value={createDocumentId} placeholder="Leave blank to auto-generate" />
					</label>
					<label>
						JSON data
						<textarea bind:value={createJson} spellcheck="false"></textarea>
					</label>
					<div class="editor-actions">
						<button onclick={() => (showCreate = false)}>Cancel</button>
						<button onclick={createDocument} disabled={saving} class="primary">Create</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if showDelete && selectedDocument && selectedCollection}
		<div class="modal-overlay">
			<button class="modal-backdrop" aria-label="Close dialog" onclick={() => (showDelete = false)}></button>
			<div class="modal-content" role="dialog" aria-modal="true">
				<div class="modal-header">
					<h3>Delete {selectedDocument.id}</h3>
					<button onclick={() => (showDelete = false)}>✕</button>
				</div>
				<p>This action will be audit logged.</p>
				<label>
					Delete mode
					<select bind:value={deleteMode}>
						<option value="soft">Soft delete</option>
						<option value="hard">Hard delete</option>
					</select>
				</label>
				<div class="editor-actions">
					<button onclick={() => (showDelete = false)}>Cancel</button>
					<button onclick={deleteSelectedDocument} disabled={saving} class="danger">Confirm Delete</button>
				</div>
			</div>
		</div>
	{/if}
</AdminLayout>

<style>
	.database-shell {
		display: grid;
		grid-template-columns: 280px minmax(360px, 1fr) minmax(420px, 0.9fr);
		gap: 1rem;
		min-height: calc(100vh - 180px);
	}

	.collection-panel,
	.documents-panel,
	.editor-panel {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 16px;
		box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
		overflow: hidden;
	}

	.panel-header {
		padding: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.panel-header.row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	h2,
	p {
		margin: 0;
	}

	h2 {
		font-size: 1rem;
		color: #111827;
	}

	p {
		margin-top: 0.25rem;
		color: #6b7280;
		font-size: 0.875rem;
	}

	input,
	select,
	textarea {
		width: 100%;
		border: 1px solid #d1d5db;
		border-radius: 10px;
		padding: 0.65rem 0.75rem;
		font: inherit;
	}

	.panel-header input {
		margin-top: 0.75rem;
	}

	.row input {
		max-width: 260px;
		margin-top: 0;
	}

	.collection-list,
	.document-grid {
		max-height: calc(100vh - 270px);
		overflow: auto;
	}

	.collection-card,
	.document-row {
		width: 100%;
		border: 0;
		border-bottom: 1px solid #f3f4f6;
		background: white;
		padding: 0.9rem 1rem;
		text-align: left;
		cursor: pointer;
	}

	.collection-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.collection-card:hover,
	.document-row:hover,
	.collection-card.active,
	.document-row.active {
		background: #f8fafc;
	}

	.collection-card.active,
	.document-row.active {
		box-shadow: inset 4px 0 #2563eb;
	}

	.collection-card span,
	.collection-card small,
	.doc-preview span {
		display: block;
		color: #6b7280;
		font-size: 0.75rem;
	}

	.collection-card small {
		border-radius: 999px;
		background: #ecfdf5;
		color: #047857;
		padding: 0.25rem 0.5rem;
		white-space: nowrap;
	}

	.collection-card small.risk {
		background: #fef3c7;
		color: #92400e;
	}

	.doc-id {
		font-weight: 700;
		color: #111827;
		margin-bottom: 0.35rem;
		word-break: break-all;
	}

	.editor-panel {
		display: flex;
		flex-direction: column;
	}

	.editor-panel textarea,
	.modal-content textarea {
		min-height: 420px;
		border-radius: 0;
		border-left: 0;
		border-right: 0;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 0.8rem;
		line-height: 1.5;
		resize: vertical;
	}

	.risk-box,
	.subcollections,
	.alert,
	.empty-state {
		margin: 1rem;
		padding: 0.85rem 1rem;
		border-radius: 12px;
		font-size: 0.875rem;
	}

	.risk-box {
		background: #fff7ed;
		color: #9a3412;
	}

	.subcollections {
		background: #eff6ff;
		color: #1d4ed8;
	}

	.subcollections span {
		display: inline-block;
		margin: 0.5rem 0.35rem 0 0;
		border-radius: 999px;
		background: white;
		padding: 0.25rem 0.55rem;
	}

	.references {
		margin: 1rem;
		padding: 0.85rem 1rem;
		border-radius: 12px;
		background: #f5f3ff;
		color: #5b21b6;
		font-size: 0.875rem;
	}

	.reference-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.6rem;
	}

	.reference-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		border: 1px solid #ddd6fe;
		border-radius: 999px;
		background: white;
		padding: 0.3rem 0.7rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: #5b21b6;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.reference-chip:hover:not(:disabled) {
		background: #ede9fe;
		border-color: #a78bfa;
		transform: translateY(-1px);
	}

	.reference-chip .ref-key {
		color: #6d28d9;
	}

	.reference-chip .ref-arrow {
		color: #9ca3af;
	}

	.reference-chip .ref-target {
		color: #1d4ed8;
		text-decoration: underline;
	}

	.back-btn {
		padding: 0.45rem 0.8rem;
		font-weight: 700;
		white-space: nowrap;
	}

	.alert.error {
		background: #fef2f2;
		color: #b91c1c;
	}

	.alert.success {
		background: #ecfdf5;
		color: #047857;
	}

	.empty-state {
		background: #f9fafb;
		color: #6b7280;
		text-align: center;
	}

	.editor-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem;
	}

	button {
		border: 1px solid #d1d5db;
		border-radius: 10px;
		background: white;
		padding: 0.65rem 0.9rem;
		font-weight: 700;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	button.primary {
		background: #2563eb;
		border-color: #2563eb;
		color: white;
	}

	button.danger {
		background: #dc2626;
		border-color: #dc2626;
		color: white;
	}

	.modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: rgba(15, 23, 42, 0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.modal-backdrop {
		position: absolute;
		inset: 0;
		padding: 0;
		margin: 0;
		border: 0;
		border-radius: 0;
		background: transparent;
		cursor: default;
	}

	.modal-content {
		position: relative;
		z-index: 1;
		width: min(720px, 100%);
		max-height: 90vh;
		overflow: auto;
		background: white;
		border-radius: 18px;
		box-shadow: 0 24px 60px rgba(15, 23, 42, 0.35);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h3 {
		margin: 0;
	}

	.modal-content label {
		display: block;
		padding: 1rem 1rem 0;
		font-weight: 700;
		color: #374151;
	}

	.modal-content label input,
	.modal-content label select,
	.modal-content label textarea {
		margin-top: 0.5rem;
	}

	@media (max-width: 1280px) {
		.database-shell {
			grid-template-columns: 260px 1fr;
		}

		.editor-panel {
			grid-column: 1 / -1;
		}
	}

	@media (max-width: 860px) {
		.database-shell {
			grid-template-columns: 1fr;
		}
	}
</style>
