<!--
BLOG POST DETAIL PAGE

View mode for blog posts with quick actions
Following UX principles: Clear hierarchy, Progressive disclosure
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';

	let { data } = $props();
	
	const post = data.post;

	// State
	let isProcessing = $state(false);
	let processingMessage = $state('');

	// Computed
	const statusClass = $derived({
		published: 'status-published',
		draft: 'status-draft',
		scheduled: 'status-scheduled',
		archived: 'status-archived'
	}[post.status] || 'status-draft');

	const statusLabel = $derived({
		published: 'Published',
		draft: 'Draft',
		scheduled: 'Scheduled',
		archived: 'Archived'
	}[post.status] || post.status);

	// Actions
	async function handlePublish() {
		isProcessing = true;
		processingMessage = post.status === 'published' ? 'Unpublishing...' : 'Publishing...';

		try {
			const response = await fetch(`/api/admin/blog/${post.id}/publish`, {
				method: 'POST'
			});

			const result = await response.json();

			if (response.ok) {
				alert(result.message);
				location.reload();
			} else {
				alert(`Failed: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error publishing post:', error);
			alert('An error occurred.');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
	}

	async function handleFeature() {
		isProcessing = true;
		processingMessage = post.isFeatured ? 'Unfeaturing...' : 'Featuring...';

		try {
			const response = await fetch(`/api/admin/blog/${post.id}/feature`, {
				method: 'POST'
			});

			const result = await response.json();

			if (response.ok) {
				alert(result.message);
				location.reload();
			} else {
				alert(`Failed: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error featuring post:', error);
			alert('An error occurred.');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
	}

	async function handleDelete() {
		if (!confirm(`Delete blog post "${post.title}"? This can be recovered from deleted items.`)) {
			return;
		}

		isProcessing = true;
		processingMessage = 'Deleting...';

		try {
			const response = await fetch(`/api/admin/blog/${post.id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (response.ok) {
				alert('Blog post deleted');
				goto('/admin/content/blog');
			} else {
				alert(`Failed: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error deleting post:', error);
			alert('An error occurred.');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
	}

	function formatDate(dateStr: string | null) {
		if (!dateStr) return 'Not set';
		return new Date(dateStr).toLocaleString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<AdminLayout
	title={post.title}
	subtitle="Blog Post Details"
	actions={[
		{
			label: '← Back to Blog',
			href: '/admin/content/blog',
			variant: 'secondary'
		}
	]}
>
	<div class="post-container">
		<!-- Header with Status -->
		<div class="post-header">
			<div class="header-left">
				<h1>{post.title}</h1>
				<div class="badges">
					<span class="status-badge {statusClass}">{statusLabel}</span>
					{#if post.isFeatured}
						<span class="featured-badge">⭐ Featured</span>
					{/if}
				</div>
			</div>
			<div class="header-actions">
				<button class="btn-edit" onclick={() => goto(`/admin/content/blog/${post.id}/edit`)}>
					✏️ Edit
				</button>
				{#if post.status === 'published'}
					<button class="btn-unpublish" onclick={handlePublish}>
						📦 Unpublish
					</button>
				{:else}
					<button class="btn-publish" onclick={handlePublish}>
						🚀 Publish
					</button>
				{/if}
				{#if post.isFeatured}
					<button class="btn-feature" onclick={handleFeature}>
						Remove Feature
					</button>
				{:else}
					<button class="btn-feature" onclick={handleFeature}>
						⭐ Feature
					</button>
				{/if}
				<button class="btn-delete" onclick={handleDelete}>
					🗑️ Delete
				</button>
			</div>
		</div>

		<!-- Metadata Section -->
		<div class="info-section">
			<h2>📋 Post Information</h2>
			<div class="info-grid">
				<div class="info-item">
					<span class="info-label">Author</span>
					<span class="info-value">
						{post.author?.displayName || post.author?.email || 'Unknown'}
					</span>
				</div>
				<div class="info-item">
					<span class="info-label">Category</span>
					<span class="info-value">{post.category || '-'}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Status</span>
					<span class="info-value">
						<span class="status-badge {statusClass}">{statusLabel}</span>
					</span>
				</div>
				<div class="info-item">
					<span class="info-label">View Count</span>
					<span class="info-value">{post.viewCount.toLocaleString()}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Created</span>
					<span class="info-value">{formatDate(post.createdAt)}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Published</span>
					<span class="info-value">{formatDate(post.publishedAt)}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Last Updated</span>
					<span class="info-value">{formatDate(post.updatedAt)}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Slug</span>
					<span class="info-value slug">{post.slug}</span>
				</div>
			</div>
		</div>

		<!-- Tags -->
		{#if post.tags && post.tags.length > 0}
			<div class="info-section">
				<h2>🏷️ Tags</h2>
				<div class="tags-container">
					{#each post.tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Featured Image -->
		{#if post.featuredImage}
			<div class="info-section">
				<h2>🖼️ Featured Image</h2>
				<div class="image-preview">
					<img src={post.featuredImage} alt={post.title} />
				</div>
			</div>
		{/if}

		<!-- Excerpt -->
		{#if post.excerpt}
			<div class="info-section">
				<h2>📝 Excerpt</h2>
				<div class="excerpt-box">
					<p>{post.excerpt}</p>
				</div>
			</div>
		{/if}

		<!-- Content Preview -->
		<div class="info-section">
			<h2>📄 Content</h2>
			<div class="content-preview">
				{@html post.content || '<p class="empty">No content yet.</p>'}
			</div>
		</div>

		<!-- SEO Information -->
		<div class="info-section">
			<h2>🔍 SEO Information</h2>
			<div class="info-grid">
				<div class="info-item full-width">
					<span class="info-label">Meta Title</span>
					<span class="info-value">{post.seo?.metaTitle || post.title}</span>
				</div>
				<div class="info-item full-width">
					<span class="info-label">Meta Description</span>
					<span class="info-value">{post.seo?.metaDescription || post.excerpt || '-'}</span>
				</div>
				{#if post.seo?.keywords && post.seo.keywords.length > 0}
					<div class="info-item full-width">
						<span class="info-label">Keywords</span>
						<div class="keywords-container">
							{#each post.seo.keywords as keyword}
								<span class="keyword">{keyword}</span>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
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
	.post-container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.post-header {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header-left {
		flex: 1;
		min-width: 200px;
	}

	.post-header h1 {
		margin: 0 0 0.75rem 0;
		font-size: 1.75rem;
		color: #1e293b;
		line-height: 1.3;
	}

	.badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.status-badge,
	.featured-badge {
		display: inline-block;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.status-published {
		background: #d1fae5;
		color: #065f46;
	}

	.status-draft {
		background: #f3f4f6;
		color: #4b5563;
	}

	.status-scheduled {
		background: #dbeafe;
		color: #1e40af;
	}

	.status-archived {
		background: #fef3c7;
		color: #92400e;
	}

	.featured-badge {
		background: #fef3c7;
		color: #92400e;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.btn-edit,
	.btn-publish,
	.btn-unpublish,
	.btn-feature,
	.btn-delete {
		padding: 0.625rem 1rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		white-space: nowrap;
	}

	.btn-edit {
		background: #3b82f6;
		color: white;
	}

	.btn-edit:hover {
		background: #2563eb;
		transform: translateY(-1px);
	}

	.btn-publish {
		background: #10b981;
		color: white;
	}

	.btn-publish:hover {
		background: #059669;
		transform: translateY(-1px);
	}

	.btn-unpublish {
		background: #f59e0b;
		color: white;
	}

	.btn-unpublish:hover {
		background: #d97706;
		transform: translateY(-1px);
	}

	.btn-feature {
		background: #8b5cf6;
		color: white;
	}

	.btn-feature:hover {
		background: #7c3aed;
		transform: translateY(-1px);
	}

	.btn-delete {
		background: #ef4444;
		color: white;
	}

	.btn-delete:hover {
		background: #dc2626;
		transform: translateY(-1px);
	}

	.info-section {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.info-section h2 {
		margin: 0 0 1.25rem 0;
		font-size: 1.25rem;
		color: #1e293b;
		font-weight: 600;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-item.full-width {
		grid-column: 1 / -1;
	}

	.info-label {
		font-size: 0.8125rem;
		color: #64748b;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.info-value {
		font-size: 1rem;
		color: #1e293b;
		font-weight: 500;
	}

	.info-value.slug {
		font-family: monospace;
		background: #f8fafc;
		padding: 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
	}

	.tags-container,
	.keywords-container {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.tag,
	.keyword {
		display: inline-block;
		padding: 0.375rem 0.75rem;
		background: #e0e7ff;
		color: #3730a3;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.keyword {
		background: #fef3c7;
		color: #92400e;
	}

	.image-preview {
		max-width: 800px;
		border-radius: 0.5rem;
		overflow: hidden;
		border: 1px solid #e2e8f0;
	}

	.image-preview img {
		width: 100%;
		height: auto;
		display: block;
	}

	.excerpt-box {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.excerpt-box p {
		margin: 0;
		color: #475569;
		line-height: 1.6;
	}

	.content-preview {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		line-height: 1.7;
		color: #1e293b;
	}

	.content-preview :global(p) {
		margin: 0 0 1rem 0;
	}

	.content-preview :global(h1),
	.content-preview :global(h2),
	.content-preview :global(h3) {
		margin: 1.5rem 0 0.75rem 0;
	}

	.content-preview :global(ul),
	.content-preview :global(ol) {
		margin: 0 0 1rem 0;
		padding-left: 2rem;
	}

	.content-preview :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
	}

	.content-preview .empty {
		color: #94a3b8;
		font-style: italic;
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
		.post-header {
			flex-direction: column;
		}

		.header-actions {
			width: 100%;
			flex-direction: column;
		}

		.btn-edit,
		.btn-publish,
		.btn-unpublish,
		.btn-feature,
		.btn-delete {
			width: 100%;
		}
	}
</style>
