<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';

	// Form state
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

	// Live URL slug preview (mirrors the API's slug generation)
	let slugPreview = $derived.by(() => {
		const baseSlug = formData.lovedOneName
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');
		return baseSlug ? `celebration-of-life-for-${baseSlug}` : '';
	});
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

		<form method="POST" action="?/create" use:enhance={() => {
			loading = true;
			error = '';
			return async ({ result, update }) => {
				loading = false;
				if (result.type === 'failure') {
					error = (result.data as any)?.error || 'Failed to create memorial';
				} else if (result.type === 'success' && (result.data as any)?.error) {
					error = (result.data as any).error;
				}
				await update();
			};
		}}>
			<div class="form-section">
				<h3 class="section-title">Memorial Details</h3>

				<div class="form-group">
					<label for="lovedOneName">Loved One's Name *</label>
					<input
						type="text"
						id="lovedOneName"
						name="lovedOneName"
						bind:value={formData.lovedOneName}
						required
						placeholder="Enter the loved one's full name"
					/>
					{#if slugPreview}
						<div class="field-hint">Memorial URL: tributestream.com/{slugPreview}</div>
					{/if}
				</div>

				<div class="form-group">
					<label for="content">Memorial Description</label>
					<textarea
						id="content"
						name="content"
						bind:value={formData.content}
						rows="4"
						placeholder="Optional description or obituary text for the memorial page"
					></textarea>
				</div>
			</div>

			<div class="form-section">
				<h3 class="section-title">Family Contact (Memorial Owner)</h3>

				<div class="form-row">
					<div class="form-group">
						<label for="creatorEmail">Contact Email *</label>
						<input
							type="email"
							id="creatorEmail"
							name="creatorEmail"
							bind:value={formData.creatorEmail}
							required
							placeholder="family@example.com"
						/>
						<div class="field-hint">
							If no account exists for this email, one will be created and login credentials
							will be sent automatically.
						</div>
					</div>

					<div class="form-group">
						<label for="creatorName">Contact Name</label>
						<input
							type="text"
							id="creatorName"
							name="creatorName"
							bind:value={formData.creatorName}
							placeholder="Family contact's name"
						/>
					</div>
				</div>
			</div>

			<div class="form-section">
				<h3 class="section-title">Service Information (Optional)</h3>

				<div class="form-row">
					<div class="form-group">
						<label for="serviceDate">Service Date</label>
						<input
							type="date"
							id="serviceDate"
							name="serviceDate"
							bind:value={formData.serviceDate}
						/>
					</div>

					<div class="form-group">
						<label for="serviceTime">Service Time</label>
						<input
							type="time"
							id="serviceTime"
							name="serviceTime"
							bind:value={formData.serviceTime}
						/>
					</div>
				</div>

				<div class="form-group">
					<label for="location">Location</label>
					<input
						type="text"
						id="location"
						name="location"
						bind:value={formData.location}
						placeholder="Funeral home, church, or venue name"
					/>
				</div>
			</div>

			<div class="form-actions">
				<button type="button" class="btn-secondary" onclick={() => goto('/admin/services/memorials')}>
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
		max-width: 1000px;
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

		.form-section {
			padding: 1rem;
		}

		.form-actions {
			flex-direction: column;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
		}
	}
</style>
