<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import { adminToast } from '$lib/stores/adminToast';
	import { goto } from '$app/navigation';

	let formData = $state({
		lovedOneName: '',
		creatorEmail: '',
		creatorName: '',
		serviceDate: '',
		serviceTime: '',
		location: '',
		content: ''
	});

	let loading = $state(false);
	let error = $state('');

	// Mirrors the slug logic in /api/admin/create-memorial
	let slugPreview = $derived(
		formData.lovedOneName
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '')
	);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		loading = true;
		error = '';

		try {
			const response = await fetch('/api/admin/create-memorial', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					serviceDate: formData.serviceDate || null,
					serviceTime: formData.serviceTime || null
				})
			});
			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Failed to create memorial';
				return;
			}

			adminToast.success(
				!result.hasOwner
					? 'Memorial created. No owner assigned yet.'
					: result.userCreated
						? 'Memorial created. Welcome email sent to the family contact.'
						: 'Memorial created and linked to the existing account.'
			);
			await goto(`/admin/services/memorials/${result.memorialId}`);
		} catch (err) {
			console.error('Failed to create memorial:', err);
			error = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<AdminLayout
	title="Create Memorial"
	subtitle="Set up a new memorial page on behalf of a family"
	actions={[
		{
			label: 'Cancel',
			icon: '✖️',
			onclick: () => goto('/admin/services/memorials')
		}
	]}
>
	<div class="create-memorial-form">
		{#if error}
			<div class="error-banner">
				<span class="error-icon">⚠️</span>
				<span>{error}</span>
			</div>
		{/if}

		<form onsubmit={handleSubmit}>
			<div class="form-section">
				<h3 class="section-title">Loved One</h3>

				<div class="form-group">
					<label for="lovedOneName">Loved One's Full Name *</label>
					<input
						type="text"
						id="lovedOneName"
						bind:value={formData.lovedOneName}
						required
						placeholder="e.g. Jane Marie Doe"
					/>
					<div class="field-hint">
						Memorial URL: /celebration-of-life-for-{slugPreview || 'loved-one-name'}
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="serviceDate">Service Date</label>
						<input type="date" id="serviceDate" bind:value={formData.serviceDate} />
					</div>
					<div class="form-group">
						<label for="serviceTime">Service Time</label>
						<input type="time" id="serviceTime" bind:value={formData.serviceTime} />
					</div>
				</div>

				<div class="form-group">
					<label for="location">Service Location</label>
					<input
						type="text"
						id="location"
						bind:value={formData.location}
						placeholder="Funeral home, church, or venue"
					/>
				</div>

				<div class="form-group">
					<label for="content">Obituary / Description</label>
					<textarea
						id="content"
						bind:value={formData.content}
						rows="5"
						placeholder="Optional. Can be edited later by the family or an admin."
					></textarea>
				</div>
			</div>

			<div class="form-section">
				<h3 class="section-title">Family Contact (Memorial Owner) — optional</h3>
				<p class="section-note">
					Leave blank to create the memorial without an owner. You can assign a family member
					later from the memorial's admin page.
				</p>

				<div class="form-row">
					<div class="form-group">
						<label for="creatorEmail">Email</label>
						<input
							type="email"
							id="creatorEmail"
							bind:value={formData.creatorEmail}
							placeholder="family@example.com"
						/>
						<div class="field-hint">
							If no account exists for this email, one is created and a welcome email with a
							login link is sent.
						</div>
					</div>
					<div class="form-group">
						<label for="creatorName">Name</label>
						<input
							type="text"
							id="creatorName"
							bind:value={formData.creatorName}
							placeholder="Defaults to “{formData.lovedOneName || 'Loved One'} Family”"
						/>
					</div>
				</div>
			</div>

			<div class="form-actions">
				<button
					type="button"
					class="btn-secondary"
					onclick={() => goto('/admin/services/memorials')}
				>
					Cancel
				</button>
				<button type="submit" class="btn-primary" disabled={loading}>
					{loading ? 'Creating...' : 'Create Memorial'}
				</button>
			</div>
		</form>
	</div>
</AdminLayout>

<style>
	.create-memorial-form {
		max-width: 800px;
		margin: 0 auto;
	}

	.error-banner {
		background: #fee;
		border: 1px solid #fcc;
		color: #c33;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.error-icon {
		font-size: 1.25rem;
	}

	.form-section {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		border: 1px solid #e5e7eb;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 1.5rem 0;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.section-note {
		font-size: 0.875rem;
		color: #6b7280;
		margin: -0.75rem 0 1.25rem 0;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-group:last-child {
		margin-bottom: 0;
	}

	.form-group label {
		display: block;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		transition: all 0.15s;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-group textarea {
		resize: vertical;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.field-hint {
		font-size: 0.75rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.625rem 1.5rem;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
		border: none;
		font-size: 0.875rem;
	}

	.btn-primary {
		background: #d5ba7f;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #c4a86e;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-secondary:hover {
		background: #f3f4f6;
	}

	@media (max-width: 768px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
