<!--
BLOG POST CREATE PAGE

Create new blog post
Following UX principles: Progressive disclosure, Clear feedback
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';

	// Form state
	let title = $state('');
	let slug = $state('');
	let content = $state('');
	let excerpt = $state('');
	let category = $state('');
	let tags = $state('');
	let featuredImage = $state('');
	let status = $state('draft');
	let metaTitle = $state('');
	let metaDescription = $state('');
	let keywords = $state('');
	
	// UI state
	let isProcessing = $state(false);
	let processingMessage = $state('');
	let showSEO = $state(false);
	let imageFile = $state<File | null>(null);

	// Validation
	const isValid = $derived(title.trim().length > 0 && slug.trim().length > 0);

	// Auto-generate slug from title
	function generateSlug() {
		if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) {
			slug = title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '');
		}
	}

	// Handle image selection
	function handleImageSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			imageFile = file;
			// Preview image
			const reader = new FileReader();
			reader.onload = (e) => {
				featuredImage = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	// Create post
	async function handleCreate() {
		if (!isValid) {
			alert('Title and slug are required');
			return;
		}

		isProcessing = true;
		processingMessage = 'Creating blog post...';

		try {
			// Upload image if file selected
			let imageUrl = featuredImage;
			if (imageFile) {
				// TODO: Implement Firebase Storage upload
				// For now, use the data URL
				console.log('Image upload would happen here');
			}

			const postData = {
				title,
				slug,
				content,
				excerpt,
				category,
				tags: tags.split(',').map(t => t.trim()).filter(t => t),
				featuredImage: imageUrl,
				status,
				seo: {
					metaTitle: metaTitle || title,
					metaDescription: metaDescription || excerpt,
					keywords: keywords.split(',').map(k => k.trim()).filter(k => k)
				}
			};

			const response = await fetch('/api/admin/blog', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(postData)
			});

			const result = await response.json();

			if (response.ok) {
				alert('Blog post created successfully!');
				goto(`/admin/content/blog/${result.postId}`);
			} else {
				alert(`Failed: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error creating post:', error);
			alert('An error occurred while creating the post.');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
	}

	// Save as draft
	async function handleSaveDraft() {
		status = 'draft';
		await handleCreate();
	}

	// Publish immediately
	async function handlePublish() {
		status = 'published';
		await handleCreate();
	}
</script>

<AdminLayout
	title="Create Blog Post"
	subtitle="Write a new article"
	actions={[
		{
			label: '← Back to Blog',
			href: '/admin/content/blog',
			variant: 'secondary'
		}
	]}
>
	<div class="edit-container">
		<form class="edit-form" onsubmit={(e) => { e.preventDefault(); handleSaveDraft(); }}>
			<!-- Main Content Section -->
			<div class="form-section">
				<h2>📝 Post Content</h2>
				
				<!-- Title -->
				<div class="form-group">
					<label for="title">
						Title <span class="required">*</span>
					</label>
					<input
						type="text"
						id="title"
						bind:value={title}
						oninput={generateSlug}
						placeholder="Enter post title..."
						required
					/>
				</div>

				<!-- Slug -->
				<div class="form-group">
					<label for="slug">
						URL Slug <span class="required">*</span>
						<span class="hint">Auto-generated from title</span>
					</label>
					<div class="slug-input">
						<span class="slug-prefix">/blog/</span>
						<input
							type="text"
							id="slug"
							bind:value={slug}
							placeholder="post-url-slug"
							required
						/>
					</div>
				</div>

				<!-- Excerpt -->
				<div class="form-group">
					<label for="excerpt">
						Excerpt
						<span class="hint">Short summary for previews</span>
					</label>
					<textarea
						id="excerpt"
						bind:value={excerpt}
						placeholder="Brief summary of the post..."
						rows="3"
					></textarea>
				</div>

				<!-- Content Editor -->
				<div class="form-group">
					<label for="content">
						Content <span class="required">*</span>
					</label>
					<div class="editor-toolbar">
						<span class="toolbar-hint">💡 HTML is supported</span>
					</div>
					<textarea
						id="content"
						bind:value={content}
						placeholder="Write your post content here... (HTML supported)"
						rows="20"
						class="content-editor"
					></textarea>
				</div>
			</div>

			<!-- Metadata Section -->
			<div class="form-section">
				<h2>📋 Metadata</h2>

				<!-- Category -->
				<div class="form-group">
					<label for="category">Category</label>
					<select id="category" bind:value={category}>
						<option value="">Select category...</option>
						<option value="memorial-planning">💝 Memorial Planning</option>
						<option value="grief-support">🤝 Grief Support</option>
						<option value="technology">💻 Technology</option>
						<option value="funeral-industry">🏥 Funeral Industry</option>
						<option value="livestreaming">📹 Livestreaming</option>
						<option value="company-news">📰 Company News</option>
						<option value="customer-stories">⭐ Customer Stories</option>
					</select>
				</div>

				<!-- Tags -->
				<div class="form-group">
					<label for="tags">
						Tags
						<span class="hint">Comma-separated</span>
					</label>
					<input
						type="text"
						id="tags"
						bind:value={tags}
						placeholder="memorial, livestream, grief support"
					/>
				</div>
			</div>

			<!-- Featured Image Section -->
			<div class="form-section">
				<h2>🖼️ Featured Image</h2>

				<div class="form-group">
					<label for="image">Upload Image</label>
					<input
						type="file"
						id="image"
						accept="image/*"
						onchange={handleImageSelect}
					/>
					<p class="hint">Recommended: 1200x630px for best display</p>
				</div>

				{#if featuredImage}
					<div class="image-preview">
						<img src={featuredImage} alt="Featured" />
						<button
							type="button"
							class="remove-image"
							onclick={() => { featuredImage = ''; imageFile = null; }}
						>
							✕ Remove
						</button>
					</div>
				{/if}
			</div>

			<!-- SEO Section (Collapsible) -->
			<div class="form-section">
				<button
					type="button"
					class="section-toggle"
					onclick={() => showSEO = !showSEO}
				>
					<span class="toggle-icon">{showSEO ? '▼' : '▶'}</span>
					<h2>🔍 SEO Settings</h2>
				</button>

				{#if showSEO}
					<div class="seo-content">
						<div class="form-group">
							<label for="metaTitle">
								Meta Title
								<span class="hint">Leave blank to use post title</span>
							</label>
							<input
								type="text"
								id="metaTitle"
								bind:value={metaTitle}
								placeholder={title || 'Post title'}
								maxlength="60"
							/>
							<span class="char-count">{metaTitle.length}/60</span>
						</div>

						<div class="form-group">
							<label for="metaDescription">
								Meta Description
								<span class="hint">Leave blank to use excerpt</span>
							</label>
							<textarea
								id="metaDescription"
								bind:value={metaDescription}
								placeholder={excerpt || 'Post excerpt'}
								rows="3"
								maxlength="160"
							></textarea>
							<span class="char-count">{metaDescription.length}/160</span>
						</div>

						<div class="form-group">
							<label for="keywords">
								Keywords
								<span class="hint">Comma-separated</span>
							</label>
							<input
								type="text"
								id="keywords"
								bind:value={keywords}
								placeholder="memorial, livestream, funeral"
							/>
						</div>
					</div>
				{/if}
			</div>

			<!-- Form Actions -->
			<div class="form-actions">
				<button
					type="button"
					class="btn-cancel"
					onclick={() => goto('/admin/content/blog')}
				>
					Cancel
				</button>
				<button
					type="submit"
					class="btn-draft"
					disabled={!isValid || isProcessing}
				>
					📝 Save Draft
				</button>
				<button
					type="button"
					class="btn-publish"
					onclick={handlePublish}
					disabled={!isValid || isProcessing}
				>
					🚀 Publish Now
				</button>
			</div>
		</form>
	</div>

	<!-- Processing Overlay -->
	{#if isProcessing}
		<div class="processing-overlay">
			<div class="processing-content">
				<div class="spinner"></div>
				<p>{processingMessage}</p>
			</div>
		</div>
	{/if}
</AdminLayout>

<style>
	.edit-container {
		max-width: 1000px;
		margin: 0 auto;
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-section {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.form-section h2 {
		margin: 0 0 1.25rem 0;
		font-size: 1.25rem;
		color: #1e293b;
		font-weight: 600;
	}

	.section-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
	}

	.section-toggle h2 {
		margin: 0;
	}

	.toggle-icon {
		color: #64748b;
		font-size: 0.875rem;
		transition: transform 0.2s;
	}

	.seo-content {
		margin-top: 1.25rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
		position: relative;
	}

	.form-group:last-child {
		margin-bottom: 0;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #334155;
	}

	.required {
		color: #ef4444;
	}

	.hint {
		font-weight: 400;
		color: #64748b;
		font-size: 0.8125rem;
		margin-left: 0.5rem;
	}

	input[type="text"],
	input[type="file"],
	textarea,
	select {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.5rem;
		font-size: 0.9375rem;
		color: #1e293b;
		transition: border-color 0.2s;
	}

	input[type="text"]:focus,
	textarea:focus,
	select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.slug-input {
		display: flex;
		align-items: center;
		border: 1px solid #cbd5e1;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.slug-prefix {
		padding: 0.625rem 0.875rem;
		background: #f8fafc;
		color: #64748b;
		font-size: 0.9375rem;
		border-right: 1px solid #cbd5e1;
	}

	.slug-input input {
		border: none;
		flex: 1;
	}

	.slug-input input:focus {
		box-shadow: none;
	}

	.content-editor {
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		line-height: 1.6;
	}

	.editor-toolbar {
		margin-bottom: 0.5rem;
		padding: 0.5rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
	}

	.toolbar-hint {
		font-size: 0.8125rem;
		color: #64748b;
	}

	.char-count {
		position: absolute;
		right: 0.5rem;
		bottom: -1.5rem;
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.image-preview {
		position: relative;
		max-width: 600px;
		margin-top: 1rem;
		border-radius: 0.5rem;
		overflow: hidden;
		border: 1px solid #e2e8f0;
	}

	.image-preview img {
		width: 100%;
		height: auto;
		display: block;
	}

	.remove-image {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: rgba(239, 68, 68, 0.9);
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.remove-image:hover {
		background: #dc2626;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		padding-top: 1rem;
	}

	.btn-cancel,
	.btn-draft,
	.btn-publish {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.btn-cancel {
		background: #f1f5f9;
		color: #475569;
	}

	.btn-cancel:hover {
		background: #e2e8f0;
	}

	.btn-draft {
		background: #64748b;
		color: white;
	}

	.btn-draft:hover:not(:disabled) {
		background: #475569;
		transform: translateY(-1px);
	}

	.btn-publish {
		background: #10b981;
		color: white;
	}

	.btn-publish:hover:not(:disabled) {
		background: #059669;
		transform: translateY(-1px);
	}

	.btn-draft:disabled,
	.btn-publish:disabled {
		background: #94a3b8;
		cursor: not-allowed;
	}

	/* Processing overlay */
	.processing-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
	}

	.processing-content {
		background: white;
		padding: 2rem;
		border-radius: 0.75rem;
		text-align: center;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e2e8f0;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.processing-content p {
		margin: 0;
		color: #475569;
		font-weight: 500;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.form-actions {
			flex-direction: column;
		}

		.btn-cancel,
		.btn-draft,
		.btn-publish {
			width: 100%;
		}
	}
</style>
