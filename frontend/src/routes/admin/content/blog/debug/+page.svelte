<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();
</script>

<AdminLayout
	title="Blog Debug"
	subtitle="Diagnostic view of blog collection"
	actions={[
		{
			label: 'Back to Blog List',
			icon: '◀️',
			onclick: () => goto('/admin/content/blog')
		}
	]}
>
	<div class="debug-container">
		<div class="info-card">
			<h3>Collection Info</h3>
			<p><strong>Collection Path:</strong> {data.collectionPath}</p>
			<p><strong>Total Posts:</strong> {data.totalCount}</p>
			<p><strong>Timestamp:</strong> {data.timestamp}</p>
			{#if data.error}
				<p class="error"><strong>Error:</strong> {data.error}</p>
			{/if}
		</div>

		<div class="posts-list">
			<h3>All Blog Posts in Firestore</h3>
			{#if data.posts.length === 0}
				<div class="empty-state">
					<p>No blog posts found in Firestore collection.</p>
					<p>Create posts in FireCMS to see them here.</p>
				</div>
			{:else}
				<div class="table-container">
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>Title</th>
								<th>Slug</th>
								<th>Status</th>
								<th>Category</th>
								<th>Author</th>
								<th>Created</th>
								<th>Content</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each data.posts as post}
								<tr>
									<td class="mono">{post.id}</td>
									<td>{post.title}</td>
									<td class="mono">{post.slug}</td>
									<td>
										<span class="status-badge status-{post.status}">{post.status}</span>
									</td>
									<td>{post.category}</td>
									<td>{post.authorName}</td>
									<td class="date">{new Date(post.createdAt).toLocaleDateString()}</td>
									<td>
										{#if post.hasContent}
											✅ {post.contentLength} chars
										{:else}
											❌ No content
										{/if}
									</td>
									<td>
										<button
											class="btn-test"
											onclick={() => goto(`/admin/content/blog/${post.id}`)}
										>
											Open Edit Page
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<div class="api-test">
			<h3>API Test Links</h3>
			{#each data.posts as post}
				<div class="api-link">
					<strong>{post.title}</strong>
					<a href="/api/admin/blog?id={post.id}" target="_blank">
						Test GET /api/admin/blog?id={post.id}
					</a>
					<a href="/admin/content/blog/{post.id}" target="_blank">
						Test Edit Page /admin/content/blog/{post.id}
					</a>
				</div>
			{/each}
		</div>
	</div>
</AdminLayout>

<style>
	.debug-container {
		max-width: 1400px;
		margin: 0 auto;
	}

	.info-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.info-card h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.info-card p {
		margin: 0.5rem 0;
		color: #374151;
	}

	.error {
		color: #dc2626;
		font-weight: 600;
	}

	.posts-list {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.posts-list h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #6b7280;
	}

	.table-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	th {
		background: #f9fafb;
		padding: 0.75rem;
		text-align: left;
		font-weight: 600;
		border-bottom: 2px solid #e5e7eb;
	}

	td {
		padding: 0.75rem;
		border-bottom: 1px solid #e5e7eb;
	}

	tr:hover {
		background: #f9fafb;
	}

	.mono {
		font-family: 'Courier New', monospace;
		font-size: 0.8125rem;
		color: #6b7280;
	}

	.date {
		white-space: nowrap;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-published {
		background: #d1fae5;
		color: #065f46;
	}

	.status-draft {
		background: #e5e7eb;
		color: #374151;
	}

	.status-scheduled {
		background: #fef3c7;
		color: #92400e;
	}

	.btn-test {
		padding: 0.375rem 0.75rem;
		background: #d5ba7f;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 0.8125rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-test:hover {
		background: #c4a86e;
	}

	.api-test {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
	}

	.api-test h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.api-link {
		padding: 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		margin-bottom: 1rem;
	}

	.api-link strong {
		display: block;
		margin-bottom: 0.5rem;
		color: #1f2937;
	}

	.api-link a {
		display: block;
		padding: 0.5rem;
		margin: 0.25rem 0;
		background: #f3f4f6;
		border-radius: 4px;
		color: #3b82f6;
		text-decoration: none;
		font-size: 0.8125rem;
		font-family: 'Courier New', monospace;
	}

	.api-link a:hover {
		background: #e5e7eb;
	}
</style>
