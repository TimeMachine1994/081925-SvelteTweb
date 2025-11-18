<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// Form state
	let formData = $state({
		title: data.post.title,
		slug: data.post.slug,
		excerpt: data.post.excerpt,
		content: data.post.content,
		authorName: data.post.authorName,
		authorEmail: data.post.authorEmail,
		authorBio: data.post.authorBio,
		authorAvatar: data.post.authorAvatar,
		featuredImage: data.post.featuredImage,
		featuredImageAlt: data.post.featuredImageAlt,
		category: data.post.category,
		tags: data.post.tags.join(', '),
		status: data.post.status,
		featured: data.post.featured,
		metaTitle: data.post.metaTitle,
		metaDescription: data.post.metaDescription,
		keywords: data.post.keywords.join(', ')
	});

	let showAdvanced = $state(false);
	let showDeleteConfirm = $state(false);
	let loading = $state(false);
	let deleteLoading = $state(false);
	let error = $state('');
	let successMessage = $state('');

	// Auto-generate slug from title
	function generateSlug() {
		if (formData.title) {
			formData.slug = formData.title
				.toLowerCase()
				.replace(/[^a-z0-9\s-]/g, '')
				.replace(/\s+/g, '-')
				.replace(/-+/g, '-')
				.trim();
		}
	}

	// Category options
	const categories = [
		{ value: 'memorial-planning', label: '💝 Memorial Planning' },
		{ value: 'grief-support', label: '🤝 Grief Support' },
		{ value: 'technology', label: '💻 Technology' },
		{ value: 'funeral-industry', label: '🏥 Funeral Industry' },
		{ value: 'livestreaming', label: '📹 Livestreaming' },
		{ value: 'company-news', label: '📰 Company News' },
		{ value: 'customer-stories', label: '⭐ Customer Stories' }
	];

	// Status options
	const statuses = [
		{ value: 'draft', label: '📝 Draft' },
		{ value: 'published', label: '✅ Published' },
		{ value: 'scheduled', label: '🕒 Scheduled' },
		{ value: 'archived', label: '📦 Archived' }
	];

	// Show form response messages
	$effect(() => {
		if (form?.success) {
			successMessage = form.message || 'Changes saved successfully';
			error = '';
			setTimeout(() => {
				successMessage = '';
			}, 3000);
		} else if (form?.error) {
			error = form.error;
			successMessage = '';
		}
	});
</script>

<AdminLayout
	title="Edit Blog Post"
	subtitle="Update article content and settings"
	actions={[
		{
			label: 'View on Site',
			icon: '🌐',
			onclick: () => window.open(`/blog/${data.post.slug}`, '_blank')
		},
		{
			label: 'Delete',
			icon: '🗑️',
			variant: 'danger',
			onclick: () => (showDeleteConfirm = true)
		},
		{
			label: 'Back to List',
			icon: '◀️',
			onclick: () => goto('/admin/content/blog')
		}
	]}
>
	<div class="edit-blog-form">
		{#if error}
			<div class="error-banner">
				<span class="error-icon">⚠️</span>
				<span>{error}</span>
			</div>
		{/if}

		{#if successMessage}
			<div class="success-banner">
				<span class="success-icon">✅</span>
				<span>{successMessage}</span>
			</div>
		{/if}

		<div class="metadata-card">
			<div class="metadata-item">
				<span class="metadata-label">Post ID:</span>
				<span class="metadata-value">{data.post.id}</span>
			</div>
			<div class="metadata-item">
				<span class="metadata-label">Views:</span>
				<span class="metadata-value">{data.post.viewCount}</span>
			</div>
			<div class="metadata-item">
				<span class="metadata-label">Reading Time:</span>
				<span class="metadata-value">{data.post.readingTime} min</span>
			</div>
			{#if data.post.publishedAt}
				<div class="metadata-item">
					<span class="metadata-label">Published:</span>
					<span class="metadata-value">{new Date(data.post.publishedAt).toLocaleDateString()}</span>
				</div>
			{/if}
		</div>

		<form method="POST" action="?/update" use:enhance={() => {
			loading = true;
			error = '';
			successMessage = '';
			return async ({ result, update }) => {
				loading = false;
				await update();
			};
		}}>
			<div class="form-section">
				<h3 class="section-title">Basic Information</h3>

				<div class="form-group">
					<label for="title">Title *</label>
					<input
						type="text"
						id="title"
						name="title"
						bind:value={formData.title}
						required
						placeholder="Enter blog post title"
					/>
				</div>

				<div class="form-group">
					<label for="slug">URL Slug *</label>
					<div class="slug-group">
						<input
							type="text"
							id="slug"
							name="slug"
							bind:value={formData.slug}
							required
							placeholder="url-friendly-slug"
						/>
						<button type="button" class="btn-generate" onclick={generateSlug}>
							Generate
						</button>
					</div>
					<div class="field-hint">Preview: /blog/{formData.slug}</div>
				</div>

				<div class="form-group">
					<label for="excerpt">Excerpt *</label>
					<textarea
						id="excerpt"
						name="excerpt"
						bind:value={formData.excerpt}
						required
						rows="3"
						placeholder="Brief summary (150-200 characters recommended)"
					></textarea>
				</div>

				<div class="form-group">
					<label for="content">Content (Markdown) *</label>
					<textarea
						id="content"
						name="content"
						bind:value={formData.content}
						required
						rows="15"
						placeholder="Write your blog post content in Markdown format..."
					></textarea>
					<div class="field-hint">
						Markdown supported: **bold**, *italic*, [links](url), # headings, etc.
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="category">Category *</label>
						<select id="category" name="category" bind:value={formData.category} required>
							{#each categories as cat}
								<option value={cat.value}>{cat.label}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="status">Status *</label>
						<select id="status" name="status" bind:value={formData.status} required>
							{#each statuses as status}
								<option value={status.value}>{status.label}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="form-group">
					<label for="tags">Tags</label>
					<input
						type="text"
						id="tags"
						name="tags"
						bind:value={formData.tags}
						placeholder="memorial, livestreaming, grief (comma-separated)"
					/>
					<div class="field-hint">Separate multiple tags with commas</div>
				</div>

				<div class="form-group checkbox">
					<label>
						<input type="checkbox" name="featured" value="true" bind:checked={formData.featured} />
						<span>Feature this post on homepage</span>
					</label>
				</div>
			</div>

			<div class="form-section">
				<h3 class="section-title">Author Information</h3>

				<div class="form-row">
					<div class="form-group">
						<label for="authorName">Author Name *</label>
						<input
							type="text"
							id="authorName"
							name="authorName"
							bind:value={formData.authorName}
							required
						/>
					</div>

					<div class="form-group">
						<label for="authorEmail">Author Email *</label>
						<input
							type="email"
							id="authorEmail"
							name="authorEmail"
							bind:value={formData.authorEmail}
							required
						/>
					</div>
				</div>

				<div class="form-group">
					<label for="authorBio">Author Bio</label>
					<textarea
						id="authorBio"
						name="authorBio"
						bind:value={formData.authorBio}
						rows="2"
						placeholder="Brief author biography"
					></textarea>
				</div>
			</div>

			<div class="form-section">
				<h3 class="section-title">Featured Image</h3>

				<div class="form-group">
					<label for="featuredImage">Image URL</label>
					<input
						type="url"
						id="featuredImage"
						name="featuredImage"
						bind:value={formData.featuredImage}
						placeholder="https://example.com/image.jpg"
					/>
					<div class="field-hint">Upload images to Firebase Storage or use external URL</div>
				</div>

				{#if formData.featuredImage}
					<div class="image-preview">
						<img src={formData.featuredImage} alt="Featured" />
					</div>
				{/if}

				<div class="form-group">
					<label for="featuredImageAlt">Alt Text</label>
					<input
						type="text"
						id="featuredImageAlt"
						name="featuredImageAlt"
						bind:value={formData.featuredImageAlt}
						placeholder="Describe the image for accessibility"
					/>
				</div>
			</div>

			<button type="button" class="toggle-advanced" onclick={() => (showAdvanced = !showAdvanced)}>
				{showAdvanced ? '▼' : '▶'} SEO Settings
			</button>

			{#if showAdvanced}
				<div class="form-section">
					<h3 class="section-title">SEO Metadata</h3>

					<div class="form-group">
						<label for="metaTitle">Meta Title</label>
						<input
							type="text"
							id="metaTitle"
							name="metaTitle"
							bind:value={formData.metaTitle}
							placeholder="Leave blank to use post title"
						/>
						<div class="field-hint">60 characters max for best display</div>
					</div>

					<div class="form-group">
						<label for="metaDescription">Meta Description</label>
						<textarea
							id="metaDescription"
							name="metaDescription"
							bind:value={formData.metaDescription}
							rows="2"
							placeholder="Leave blank to use excerpt"
						></textarea>
						<div class="field-hint">160 characters max for best display</div>
					</div>

					<div class="form-group">
						<label for="keywords">SEO Keywords</label>
						<input
							type="text"
							id="keywords"
							name="keywords"
							bind:value={formData.keywords}
							placeholder="memorial planning, livestream service (comma-separated)"
						/>
					</div>
				</div>
			{/if}

			<div class="form-actions">
				<button type="button" class="btn-secondary" onclick={() => goto('/admin/content/blog')}>
					Cancel
				</button>
				<button type="submit" class="btn-primary" disabled={loading}>
					{loading ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</form>

		{#if showDeleteConfirm}
			<div class="modal-overlay" onclick={() => (showDeleteConfirm = false)}>
				<div class="modal-content" onclick={(e) => e.stopPropagation()}>
					<h3>Delete Blog Post?</h3>
					<p>
						Are you sure you want to delete "<strong>{data.post.title}</strong>"? This action cannot
						be undone.
					</p>
					<div class="modal-actions">
						<button
							class="btn-secondary"
							onclick={() => (showDeleteConfirm = false)}
							disabled={deleteLoading}
						>
							Cancel
						</button>
						<form method="POST" action="?/delete" use:enhance={() => {
							deleteLoading = true;
							return async ({ result, update }) => {
								deleteLoading = false;
								await update();
							};
						}}>
							<button type="submit" class="btn-danger" disabled={deleteLoading}>
								{deleteLoading ? 'Deleting...' : 'Delete Post'}
							</button>
						</form>
					</div>
				</div>
			</div>
		{/if}
	</div>
</AdminLayout>

<style>
	.edit-blog-form {
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

	.success-banner {
		background: #efe;
		border: 1px solid #cfc;
		color: #363;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.error-icon,
	.success-icon {
		font-size: 1.25rem;
	}

	.metadata-card {
		background: white;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1.5rem;
		border: 1px solid #e5e7eb;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.metadata-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.metadata-label {
		font-size: 0.75rem;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.metadata-value {
		font-size: 1rem;
		font-weight: 600;
		color: #1f2937;
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

	.form-group input[type='text'],
	.form-group input[type='email'],
	.form-group input[type='url'],
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		transition: all 0.15s;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-group textarea {
		resize: vertical;
		font-family: 'Courier New', monospace;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.slug-group {
		display: flex;
		gap: 0.5rem;
	}

	.slug-group input {
		flex: 1;
	}

	.btn-generate {
		padding: 0.625rem 1rem;
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-generate:hover {
		background: #e5e7eb;
	}

	.image-preview {
		margin-top: 0.75rem;
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid #e5e7eb;
	}

	.image-preview img {
		width: 100%;
		height: auto;
		display: block;
	}

	.field-hint {
		font-size: 0.75rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}

	.form-group.checkbox label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.form-group.checkbox input[type='checkbox'] {
		width: auto;
		cursor: pointer;
	}

	.toggle-advanced {
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		padding: 0.75rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		width: 100%;
		text-align: left;
		font-weight: 500;
		color: #374151;
		margin-bottom: 1.5rem;
		transition: all 0.15s;
	}

	.toggle-advanced:hover {
		background: #e5e7eb;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.btn-primary,
	.btn-secondary,
	.btn-danger {
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

	.btn-secondary:hover:not(:disabled) {
		background: #f3f4f6;
	}

	.btn-danger {
		background: #dc2626;
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background: #b91c1c;
	}

	.btn-danger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal-content h3 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		color: #1f2937;
	}

	.modal-content p {
		margin: 0 0 1.5rem 0;
		color: #6b7280;
		line-height: 1.6;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	@media (max-width: 768px) {
		.form-row {
			grid-template-columns: 1fr;
		}

		.form-section {
			padding: 1rem;
		}

		.form-actions,
		.modal-actions {
			flex-direction: column;
		}

		.btn-primary,
		.btn-secondary,
		.btn-danger {
			width: 100%;
		}

		.metadata-card {
			grid-template-columns: 1fr;
		}
	}
</style>
