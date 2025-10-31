<script>
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Card, Button } from '$lib/components/minimal-modern';
	import { marked } from 'marked';

	const theme = getTheme('minimal');

	let { data } = $props();
	const { post, relatedPosts } = $derived(data);

	function formatDate(date) {
		if (!date) return '';
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(new Date(date));
	}

	function getCategoryColor(category) {
		const colors = {
			'memorial-planning': '#D5BA7F',
			'grief-support': '#8B9DC3',
			'technology': '#7C9885',
			'funeral-industry': '#A67C7C',
			'livestreaming': '#B8860B',
			'company-news': '#6B7280',
			'customer-stories': '#DC2626'
		};
		return colors[category] || '#6B7280';
	}

	function getCategoryLabel(category) {
		const labels = {
			'memorial-planning': 'Memorial Planning',
			'grief-support': 'Grief Support',
			'technology': 'Technology',
			'funeral-industry': 'Funeral Industry',
			'livestreaming': 'Live Streaming',
			'company-news': 'Company News',
			'customer-stories': 'Customer Stories'
		};
		return labels[category] || category;
	}

	// Configure marked for better rendering
	marked.setOptions({
		breaks: true,
		gfm: true
	});
</script>

<svelte:head>
	{#if post}
		<title>{post.title} | TributeStream Blog</title>
		<meta name="description" content={post.excerpt} />
		<meta name="keywords" content={post.tags?.join(', ') || ''} />
		
		<!-- Open Graph / Facebook -->
		<meta property="og:type" content="article" />
		<meta property="og:title" content={post.title} />
		<meta property="og:description" content={post.excerpt} />
		<meta property="og:image" content={post.featuredImage} />
		
		<!-- Twitter -->
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={post.title} />
		<meta name="twitter:description" content={post.excerpt} />
		<meta name="twitter:image" content={post.featuredImage} />
	{:else}
		<title>Blog Post Not Found | TributeStream</title>
	{/if}
</svelte:head>

<div class="blog-post-container" style="font-family: {theme.font.body}">
	{#if post}
		<!-- Breadcrumbs -->
		<nav class="breadcrumbs">
			<div class="container">
				<a href="/" class="breadcrumb-link">Home</a>
				<span class="breadcrumb-separator">→</span>
				<a href="/blog" class="breadcrumb-link">Blog</a>
				<span class="breadcrumb-separator">→</span>
				<span class="breadcrumb-current">{post.title}</span>
			</div>
		</nav>

		<!-- Article Header -->
		<header class="article-header">
			<div class="container">
				<div class="category-badge" style="background-color: {getCategoryColor(post.category)}">
					{getCategoryLabel(post.category)}
				</div>
				<h1 class="article-title">{post.title}</h1>
				<p class="article-excerpt">{post.excerpt}</p>
				
				<div class="article-meta">
					<div class="author-info">
						<div class="author-details">
							<span class="author-name">By {post.authorName}</span>
							<span class="publish-date">{formatDate(post.publishedAt)}</span>
						</div>
					</div>
					<div class="article-stats">
						{#if post.readingTime}
							<span class="reading-time">{post.readingTime} min read</span>
						{/if}
						<span class="view-count">{post.viewCount} views</span>
					</div>
				</div>
			</div>
		</header>

		<!-- Featured Image -->
		{#if post.featuredImage}
			<div class="featured-image-container">
				<img 
					src={post.featuredImage} 
					alt={post.featuredImageAlt || post.title} 
					class="featured-image"
					on:error={(e) => {
						console.error('Failed to load featured image:', post.featuredImage);
						e.target.style.display = 'none';
					}}
					on:load={() => {
						console.log('Featured image loaded successfully:', post.featuredImage);
					}}
				/>
			</div>
		{:else}
			<!-- Fallback placeholder if no featured image -->
			<div class="featured-image-container">
				<div class="featured-image-placeholder">
					<div class="placeholder-content">
						<span>📝</span>
						<p>No Featured Image</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Article Content -->
		<main class="article-main">
			<div class="container">
				<div class="content-wrapper">
					<article class="article-content">
						{@html marked(post.content)}
					</article>

					<!-- Article Footer -->
					<footer class="article-footer">
						{#if post.tags && post.tags.length > 0}
							<div class="article-tags">
								<h4>Tags:</h4>
								<div class="tags-list">
									{#each post.tags as tag}
										<span class="tag">{tag}</span>
									{/each}
								</div>
							</div>
						{/if}

						<div class="article-actions">
							<a href="/blog" class="back-to-blog-btn">← Back to Blog</a>
							<div class="social-share">
								<span>Share:</span>
								<button class="share-btn" on:click={() => navigator.share?.({ title: post.title, url: window.location.href })}>
									📤 Share
								</button>
							</div>
						</div>
					</footer>
				</div>
			</div>
		</main>

		<!-- Related Posts -->
		{#if relatedPosts && relatedPosts.length > 0}
			<section class="related-posts">
				<div class="container">
					<h2 class="section-title">Related Articles</h2>
					<div class="related-grid">
						{#each relatedPosts as relatedPost}
							<Card theme="minimal" class="related-card">
								<a href="/blog/{relatedPost.slug}" class="related-link">
									{#if relatedPost.featuredImage}
										<div class="related-image">
											<img src={relatedPost.featuredImage} alt={relatedPost.title} />
										</div>
									{/if}
									<div class="related-content">
										<div class="related-category" style="background-color: {getCategoryColor(relatedPost.category)}">
											{getCategoryLabel(relatedPost.category)}
										</div>
										<h3 class="related-title">{relatedPost.title}</h3>
										<p class="related-excerpt">{relatedPost.excerpt}</p>
										<div class="related-meta">
											<span class="related-date">{formatDate(relatedPost.publishedAt)}</span>
											{#if relatedPost.readingTime}
												<span class="related-reading-time">{relatedPost.readingTime} min read</span>
											{/if}
										</div>
									</div>
								</a>
							</Card>
						{/each}
					</div>
				</div>
			</section>
		{/if}

		<!-- CTA Section -->
		<section class="cta-section">
			<div class="container">
				<div class="cta-content">
					<h2>Need Help with Your Memorial Service?</h2>
					<p>Our expert team is here to guide you through planning and live streaming your memorial service.</p>
					<div class="cta-buttons">
						<a href="/register/loved-one" class="cta-btn primary">Get Started Free</a>
						<a href="/contact" class="cta-btn secondary">Contact Us</a>
					</div>
				</div>
			</div>
		</section>
	{:else}
		<!-- 404 Error -->
		<div class="error-container">
			<div class="container">
				<div class="error-content">
					<h1>Blog Post Not Found</h1>
					<p>Sorry, we couldn't find the blog post you're looking for.</p>
					<a href="/blog" class="back-to-blog-btn">← Back to Blog</a>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.blog-post-container {
		min-height: 100vh;
		background-color: #fafafa;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
	}

	/* Breadcrumbs */
	.breadcrumbs {
		background: white;
		border-bottom: 1px solid #e5e7eb;
		padding: 1rem 0;
	}

	.breadcrumb-link {
		color: #6b7280;
		text-decoration: none;
		transition: color 0.3s ease;
	}

	.breadcrumb-link:hover {
		color: #D5BA7F;
	}

	.breadcrumb-separator {
		margin: 0 0.5rem;
		color: #9ca3af;
	}

	.breadcrumb-current {
		color: #1f2937;
		font-weight: 500;
	}

	/* Article Header */
	.article-header {
		background: white;
		padding: 3rem 0;
		border-bottom: 1px solid #e5e7eb;
	}

	.category-badge {
		display: inline-block;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
	}

	.article-title {
		font-size: 3rem;
		font-weight: 800;
		color: #1f2937;
		line-height: 1.2;
		margin-bottom: 1.5rem;
	}

	.article-excerpt {
		font-size: 1.25rem;
		color: #6b7280;
		line-height: 1.6;
		margin-bottom: 2rem;
		max-width: 800px;
	}

	.article-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.author-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.author-name {
		font-weight: 600;
		color: #1f2937;
	}

	.publish-date {
		color: #6b7280;
	}

	.article-stats {
		display: flex;
		gap: 1rem;
		font-size: 0.875rem;
		color: #9ca3af;
	}

	/* Featured Image */
	.featured-image-container {
		width: 100%;
		height: 400px;
		overflow: hidden;
	}

	.featured-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.featured-image-placeholder {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.featured-image-placeholder .placeholder-content {
		text-align: center;
		color: #9ca3af;
	}

	.featured-image-placeholder .placeholder-content span {
		font-size: 3rem;
		display: block;
		margin-bottom: 1rem;
	}

	.featured-image-placeholder .placeholder-content p {
		font-size: 1.1rem;
		margin: 0;
		font-weight: 500;
	}

	/* Article Content */
	.article-main {
		background: white;
		padding: 4rem 0;
	}

	.content-wrapper {
		max-width: 800px;
		margin: 0 auto;
	}

	.article-content {
		line-height: 1.8;
		color: #374151;
	}

	.article-content :global(h1),
	.article-content :global(h2),
	.article-content :global(h3),
	.article-content :global(h4) {
		color: #1f2937;
		font-weight: 700;
		margin: 2rem 0 1rem 0;
	}

	.article-content :global(h1) { font-size: 2.5rem; }
	.article-content :global(h2) { font-size: 2rem; }
	.article-content :global(h3) { font-size: 1.5rem; }
	.article-content :global(h4) { font-size: 1.25rem; }

	.article-content :global(p) {
		margin-bottom: 1.5rem;
	}

	.article-content :global(ul),
	.article-content :global(ol) {
		margin: 1.5rem 0;
		padding-left: 2rem;
	}

	.article-content :global(li) {
		margin-bottom: 0.5rem;
	}

	.article-content :global(blockquote) {
		border-left: 4px solid #D5BA7F;
		padding-left: 1.5rem;
		margin: 2rem 0;
		font-style: italic;
		color: #6b7280;
	}

	.article-content :global(strong) {
		font-weight: 700;
		color: #1f2937;
	}

	/* Article Footer */
	.article-footer {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid #e5e7eb;
	}

	.article-tags {
		margin-bottom: 2rem;
	}

	.article-tags h4 {
		font-size: 1rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		background: #f3f4f6;
		color: #6b7280;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
	}

	.article-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.social-share {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.share-btn {
		background: none;
		border: 1px solid #d1d5db;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.share-btn:hover {
		background: #f9fafb;
		border-color: #D5BA7F;
	}

	/* Related Posts */
	.related-posts {
		background: #f9fafb;
		padding: 4rem 0;
	}

	.section-title {
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
		text-align: center;
		margin-bottom: 2rem;
	}

	.related-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.related-link {
		text-decoration: none;
		color: inherit;
		display: block;
		height: 100%;
	}

	.related-image {
		height: 200px;
		overflow: hidden;
		border-radius: 8px 8px 0 0;
	}

	.related-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	:global(.related-card:hover) .related-image img {
		transform: scale(1.05);
	}

	.related-content {
		padding: 1.5rem;
	}

	.related-category {
		display: inline-block;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.related-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.5rem;
		line-height: 1.4;
	}

	.related-excerpt {
		color: #6b7280;
		font-size: 0.875rem;
		line-height: 1.5;
		margin-bottom: 1rem;
	}

	.related-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.75rem;
		color: #9ca3af;
	}

	/* CTA Section */
	.cta-section {
		background: linear-gradient(135deg, #D5BA7F 0%, #B8860B 100%);
		color: white;
		padding: 4rem 0;
		text-align: center;
	}

	.cta-content h2 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.cta-content p {
		font-size: 1.1rem;
		opacity: 0.9;
		margin-bottom: 2rem;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	.cta-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.cta-btn {
		display: inline-block;
		padding: 0.75rem 2rem;
		font-size: 1rem;
		font-weight: 500;
		text-decoration: none;
		border-radius: 0.375rem;
		transition: all 0.2s ease;
		border: 2px solid transparent;
		cursor: pointer;
	}

	.cta-btn.primary {
		background: #D5BA7F;
		color: white;
	}

	.cta-btn.primary:hover {
		background: #c4a96f;
		transform: translateY(-2px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.cta-btn.secondary {
		background: white;
		color: #1f2937;
		border-color: #D5BA7F;
	}

	.cta-btn.secondary:hover {
		background: #f9fafb;
		transform: translateY(-2px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.back-to-blog-btn {
		display: inline-block;
		padding: 0.5rem 1.5rem;
		font-size: 0.95rem;
		font-weight: 500;
		text-decoration: none;
		color: #D5BA7F;
		background: white;
		border: 2px solid #D5BA7F;
		border-radius: 0.375rem;
		transition: all 0.2s ease;
	}

	.back-to-blog-btn:hover {
		background: #D5BA7F;
		color: white;
		transform: translateX(-4px);
	}

	/* Error Page */
	.error-container {
		min-height: 60vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.error-content {
		text-align: center;
	}

	.error-content h1 {
		font-size: 3rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.error-content p {
		font-size: 1.1rem;
		color: #6b7280;
		margin-bottom: 2rem;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.article-title {
			font-size: 2rem;
		}

		.article-excerpt {
			font-size: 1rem;
		}

		.article-meta {
			flex-direction: column;
			align-items: flex-start;
		}

		.featured-image-container {
			height: 250px;
		}

		.article-actions {
			flex-direction: column;
			align-items: flex-start;
		}

		.related-grid {
			grid-template-columns: 1fr;
		}

		.cta-content h2 {
			font-size: 1.8rem;
		}

		.cta-buttons {
			flex-direction: column;
			align-items: center;
		}
	}
</style>
