<!--
ENCODERS ADMIN PAGE

Manage streaming encoder devices
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import { Copy, Check, Plus, Edit, Trash2, Radio, Wrench, CheckCircle } from 'lucide-svelte';
	import type { Encoder } from '$lib/types/encoder';

	let { data } = $props();

	// State
	let search = $state(data.searchQuery || '');
	let showCreateModal = $state(false);
	let editingEncoder = $state<Encoder | null>(null);
	let loading = $state(false);

	// Create form state
	let createForm = $state({
		name: '',
		description: '',
		deviceType: 'phone' as 'phone' | 'hardware' | 'obs',
		location: ''
	});

	// Copy state
	let copiedId = $state<string | null>(null);

	// Status badge colors
	function getStatusBadge(status: string) {
		switch (status) {
			case 'available':
				return { class: 'bg-green-100 text-green-800', icon: '✅', label: 'Available' };
			case 'assigned':
				return { class: 'bg-blue-100 text-blue-800', icon: '📡', label: 'Assigned' };
			case 'maintenance':
				return { class: 'bg-yellow-100 text-yellow-800', icon: '🔧', label: 'Maintenance' };
			default:
				return { class: 'bg-gray-100 text-gray-800', icon: '❓', label: status };
		}
	}

	// Device type labels
	function getDeviceTypeLabel(type: string | null) {
		switch (type) {
			case 'phone':
				return '📱 Phone';
			case 'hardware':
				return '🎥 Hardware';
			case 'obs':
				return '💻 OBS';
			default:
				return '—';
		}
	}

	// Copy to clipboard
	async function copyToClipboard(text: string, id: string) {
		try {
			await navigator.clipboard.writeText(text);
			copiedId = id;
			setTimeout(() => (copiedId = null), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	// Create encoder
	async function handleCreate() {
		if (!createForm.name.trim()) {
			alert('Please enter an encoder name');
			return;
		}

		loading = true;
		try {
			const response = await fetch('/api/admin/encoders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(createForm)
			});

			if (response.ok) {
				showCreateModal = false;
				createForm = { name: '', description: '', deviceType: 'phone', location: '' };
				location.reload();
			} else {
				const error = await response.json();
				alert(`Failed to create encoder: ${error.message || 'Unknown error'}`);
			}
		} catch (err) {
			console.error('Error creating encoder:', err);
			alert('Failed to create encoder');
		} finally {
			loading = false;
		}
	}

	// Update encoder status
	async function updateStatus(encoder: Encoder, newStatus: string) {
		if (!confirm(`Set ${encoder.name} to ${newStatus}?`)) return;

		loading = true;
		try {
			const response = await fetch(`/api/admin/encoders/${encoder.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			});

			if (response.ok) {
				location.reload();
			} else {
				alert('Failed to update encoder status');
			}
		} catch (err) {
			console.error('Error updating encoder:', err);
			alert('Failed to update encoder');
		} finally {
			loading = false;
		}
	}

	// Delete encoder
	async function handleDelete(encoder: Encoder) {
		if (!confirm(`Delete encoder "${encoder.name}"? This cannot be undone.`)) return;

		loading = true;
		try {
			const response = await fetch(`/api/admin/encoders/${encoder.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				location.reload();
			} else {
				const error = await response.json();
				alert(`Failed to delete encoder: ${error.message || 'Unknown error'}`);
			}
		} catch (err) {
			console.error('Error deleting encoder:', err);
			alert('Failed to delete encoder');
		} finally {
			loading = false;
		}
	}
</script>

<AdminLayout
	title="Encoders"
	subtitle="Manage streaming encoder devices for funeral directors"
	actions={[
		{
			label: 'Add Encoder',
			icon: '➕',
			variant: 'primary',
			onclick: () => (showCreateModal = true)
		}
	]}
>
	<!-- Stats Cards -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-value">{data.stats.total}</div>
			<div class="stat-label">Total Encoders</div>
		</div>
		<div class="stat-card available">
			<div class="stat-value">{data.stats.available}</div>
			<div class="stat-label">Available</div>
		</div>
		<div class="stat-card assigned">
			<div class="stat-value">{data.stats.assigned}</div>
			<div class="stat-label">Assigned</div>
		</div>
		<div class="stat-card maintenance">
			<div class="stat-value">{data.stats.maintenance}</div>
			<div class="stat-label">Maintenance</div>
		</div>
	</div>

	<!-- Search & Filters -->
	<div class="filters-bar">
		<form class="search-form" method="GET">
			<input
				type="text"
				name="q"
				placeholder="Search encoders..."
				value={search}
				class="search-input"
			/>
			<button type="submit" class="search-btn">Search</button>
		</form>

		<div class="filter-buttons">
			<a href="/admin/services/encoders" class="filter-btn" class:active={!data.statusFilter}>
				All
			</a>
			<a
				href="/admin/services/encoders?status=available"
				class="filter-btn"
				class:active={data.statusFilter === 'available'}
			>
				Available
			</a>
			<a
				href="/admin/services/encoders?status=assigned"
				class="filter-btn"
				class:active={data.statusFilter === 'assigned'}
			>
				Assigned
			</a>
			<a
				href="/admin/services/encoders?status=maintenance"
				class="filter-btn"
				class:active={data.statusFilter === 'maintenance'}
			>
				Maintenance
			</a>
		</div>
	</div>

	<!-- Encoders List -->
	{#if data.encoders.length === 0}
		<div class="empty-state">
			<div class="empty-icon">📡</div>
			<h3>No Encoders Found</h3>
			<p>Create your first encoder to get started with streaming.</p>
			<button class="create-btn" onclick={() => (showCreateModal = true)}>
				<Plus class="icon" />
				Add First Encoder
			</button>
		</div>
	{:else}
		<div class="encoders-grid">
			{#each data.encoders as encoder (encoder.id)}
				{@const statusBadge = getStatusBadge(encoder.status)}
				<div class="encoder-card">
					<div class="card-header">
						<div class="header-left">
							<h3 class="encoder-name">{encoder.name}</h3>
							<span class="status-badge {statusBadge.class}">
								{statusBadge.icon} {statusBadge.label}
							</span>
						</div>
						<div class="header-actions">
							<button
								class="icon-btn"
								title="Edit"
								onclick={() => (editingEncoder = encoder)}
							>
								<Edit class="h-4 w-4" />
							</button>
							<button
								class="icon-btn danger"
								title="Delete"
								onclick={() => handleDelete(encoder)}
								disabled={encoder.status === 'assigned'}
							>
								<Trash2 class="h-4 w-4" />
							</button>
						</div>
					</div>

					{#if encoder.description}
						<p class="encoder-description">{encoder.description}</p>
					{/if}

					<div class="encoder-meta">
						<span class="meta-item">
							<strong>Type:</strong> {getDeviceTypeLabel(encoder.deviceType)}
						</span>
						{#if encoder.location}
							<span class="meta-item">
								<strong>Location:</strong> {encoder.location}
							</span>
						{/if}
					</div>

					<!-- Current Assignment -->
					{#if encoder.currentAssignment}
						<div class="assignment-box">
							<div class="assignment-header">📌 Currently Assigned</div>
							<div class="assignment-details">
								<span class="memorial-name">
									{encoder.currentAssignment.memorialName || 'Memorial'}
								</span>
								<span class="assigned-date">
									Since {new Date(encoder.currentAssignment.assignedAt).toLocaleDateString()}
								</span>
							</div>
						</div>
					{/if}

					<!-- Credentials (collapsed by default) -->
					<details class="credentials-section">
						<summary>🔑 Streaming Credentials</summary>
						<div class="credentials-content">
							<div class="credential-row">
								<label>RTMP URL</label>
								<div class="credential-value">
									<code>{encoder.credentials.rtmpUrl}</code>
									<button
										class="copy-btn"
										onclick={() => copyToClipboard(encoder.credentials.rtmpUrl, `rtmp-${encoder.id}`)}
									>
										{#if copiedId === `rtmp-${encoder.id}`}
											<Check class="h-4 w-4" />
										{:else}
											<Copy class="h-4 w-4" />
										{/if}
									</button>
								</div>
							</div>
							<div class="credential-row">
								<label>Stream Key</label>
								<div class="credential-value">
									<code>{encoder.credentials.streamKey}</code>
									<button
										class="copy-btn"
										onclick={() => copyToClipboard(encoder.credentials.streamKey, `key-${encoder.id}`)}
									>
										{#if copiedId === `key-${encoder.id}`}
											<Check class="h-4 w-4" />
										{:else}
											<Copy class="h-4 w-4" />
										{/if}
									</button>
								</div>
							</div>
						</div>
					</details>

					<!-- Status Actions -->
					<div class="status-actions">
						{#if encoder.status !== 'available'}
							<button
								class="status-btn available"
								onclick={() => updateStatus(encoder, 'available')}
								disabled={loading || encoder.status === 'assigned'}
							>
								<CheckCircle class="h-4 w-4" />
								Mark Available
							</button>
						{/if}
						{#if encoder.status !== 'maintenance'}
							<button
								class="status-btn maintenance"
								onclick={() => updateStatus(encoder, 'maintenance')}
								disabled={loading || encoder.status === 'assigned'}
							>
								<Wrench class="h-4 w-4" />
								Maintenance
							</button>
						{/if}
					</div>

					<div class="card-footer">
						<span class="created-date">
							Created {new Date(encoder.createdAt).toLocaleDateString()}
						</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</AdminLayout>

<!-- Create Modal -->
{#if showCreateModal}
	<div class="modal-overlay" onclick={() => (showCreateModal = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>Create New Encoder</h2>
				<button class="close-btn" onclick={() => (showCreateModal = false)}>✕</button>
			</div>

			<form class="modal-form" onsubmit={(e) => { e.preventDefault(); handleCreate(); }}>
				<div class="form-group">
					<label for="name">Encoder Name *</label>
					<input
						id="name"
						type="text"
						bind:value={createForm.name}
						placeholder="e.g., Encoder #1 - Main Chapel"
						required
					/>
				</div>

				<div class="form-group">
					<label for="description">Description</label>
					<textarea
						id="description"
						bind:value={createForm.description}
						placeholder="Optional notes about this encoder..."
						rows="2"
					></textarea>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="deviceType">Device Type</label>
						<select id="deviceType" bind:value={createForm.deviceType}>
							<option value="phone">📱 Phone</option>
							<option value="hardware">🎥 Hardware Encoder</option>
							<option value="obs">💻 OBS Software</option>
						</select>
					</div>

					<div class="form-group">
						<label for="location">Location</label>
						<input
							id="location"
							type="text"
							bind:value={createForm.location}
							placeholder="e.g., Orlando Office"
						/>
					</div>
				</div>

				<div class="form-info">
					<p>
						⚡ Creating an encoder will provision persistent RTMP credentials from Cloudflare.
						These can be configured once on the physical device.
					</p>
				</div>

				<div class="modal-actions">
					<button type="button" class="btn-secondary" onclick={() => (showCreateModal = false)}>
						Cancel
					</button>
					<button type="submit" class="btn-primary" disabled={loading}>
						{loading ? 'Creating...' : 'Create Encoder'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
		text-align: center;
	}

	.stat-card.available {
		border-left: 4px solid #48bb78;
	}

	.stat-card.assigned {
		border-left: 4px solid #4299e1;
	}

	.stat-card.maintenance {
		border-left: 4px solid #ecc94b;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: #1a202c;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #718096;
	}

	.filters-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.search-form {
		display: flex;
		gap: 0.5rem;
	}

	.search-input {
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		min-width: 250px;
	}

	.search-btn {
		padding: 0.5rem 1rem;
		background: #4a5568;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
	}

	.filter-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.filter-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		color: #4a5568;
		text-decoration: none;
		font-size: 0.875rem;
	}

	.filter-btn:hover {
		background: #f7fafc;
	}

	.filter-btn.active {
		background: #4299e1;
		color: white;
		border-color: #4299e1;
	}

	.encoders-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		gap: 1.5rem;
	}

	.encoder-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.encoder-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1a202c;
		margin: 0;
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}

	.icon-btn {
		padding: 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		cursor: pointer;
		color: #4a5568;
	}

	.icon-btn:hover {
		background: #f7fafc;
	}

	.icon-btn.danger:hover {
		background: #fed7d7;
		color: #c53030;
	}

	.icon-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.encoder-description {
		color: #718096;
		font-size: 0.875rem;
		margin-bottom: 0.75rem;
	}

	.encoder-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.875rem;
		color: #4a5568;
		margin-bottom: 1rem;
	}

	.assignment-box {
		background: #ebf8ff;
		border: 1px solid #90cdf4;
		border-radius: 0.5rem;
		padding: 0.75rem;
		margin-bottom: 1rem;
	}

	.assignment-header {
		font-size: 0.75rem;
		font-weight: 600;
		color: #2c5282;
		margin-bottom: 0.25rem;
	}

	.assignment-details {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.memorial-name {
		font-weight: 500;
		color: #2c5282;
	}

	.assigned-date {
		font-size: 0.75rem;
		color: #4a5568;
	}

	.credentials-section {
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.credentials-section summary {
		padding: 0.75rem;
		cursor: pointer;
		font-weight: 500;
		color: #4a5568;
		user-select: none;
	}

	.credentials-content {
		padding: 0 0.75rem 0.75rem;
	}

	.credential-row {
		margin-bottom: 0.75rem;
	}

	.credential-row label {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		color: #718096;
		margin-bottom: 0.25rem;
	}

	.credential-value {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.credential-value code {
		flex: 1;
		padding: 0.5rem;
		background: #f7fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.copy-btn {
		padding: 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.25rem;
		background: white;
		cursor: pointer;
		color: #4a5568;
	}

	.copy-btn:hover {
		background: #f7fafc;
	}

	.status-actions {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.status-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.status-btn.available:hover {
		background: #c6f6d5;
		border-color: #48bb78;
	}

	.status-btn.maintenance:hover {
		background: #fefcbf;
		border-color: #ecc94b;
	}

	.status-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.card-footer {
		border-top: 1px solid #e2e8f0;
		padding-top: 0.75rem;
	}

	.created-date {
		font-size: 0.75rem;
		color: #a0aec0;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border: 2px dashed #e2e8f0;
		border-radius: 0.75rem;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		font-size: 1.25rem;
		color: #1a202c;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		color: #718096;
		margin-bottom: 1.5rem;
	}

	.create-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #4299e1;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
	}

	.create-btn:hover {
		background: #3182ce;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.modal {
		background: white;
		border-radius: 0.75rem;
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.modal-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #718096;
	}

	.modal-form {
		padding: 1.5rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #4a5568;
		margin-bottom: 0.375rem;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-info {
		background: #ebf8ff;
		border: 1px solid #90cdf4;
		border-radius: 0.5rem;
		padding: 0.75rem;
		margin-bottom: 1rem;
	}

	.form-info p {
		margin: 0;
		font-size: 0.8125rem;
		color: #2c5282;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.btn-secondary {
		padding: 0.625rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		cursor: pointer;
	}

	.btn-primary {
		padding: 0.625rem 1.25rem;
		border: none;
		border-radius: 0.375rem;
		background: #4299e1;
		color: white;
		cursor: pointer;
	}

	.btn-primary:hover {
		background: #3182ce;
	}

	.btn-primary:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.encoders-grid {
			grid-template-columns: 1fr;
		}

		.filters-bar {
			flex-direction: column;
			align-items: stretch;
		}

		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
