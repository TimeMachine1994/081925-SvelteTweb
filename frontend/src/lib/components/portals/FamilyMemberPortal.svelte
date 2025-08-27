<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';
	import MemorialCard from '$lib/components/ui/MemorialCard.svelte';

	let { memorials }: { memorials: Memorial[] } = $props();

	console.log('👨‍👩‍👧‍👦 FamilyMemberPortal: Rendering with', memorials?.length || 0, 'memorials');
</script>

<div class="family-portal-container">
	<header class="portal-header">
		<h2 class="portal-title">
			<span class="icon">👨‍👩‍👧‍👦</span>
			Family Member Portal
		</h2>
		<p class="portal-description">
			Manage and contribute to memorials you've been invited to join.
		</p>
	</header>

	{#if memorials && memorials.length > 0}
		<div class="memorials-grid">
			{#each memorials as memorial}
				<div class="memorial-card-wrapper">
					<!-- Use the existing MemorialCard component -->
					<MemorialCard {memorial} />
					
					<!-- Action buttons for family members -->
					<div class="action-buttons">
						<a 
							href="/tributes/{memorial.slug}" 
							class="action-btn view-btn"
							target="_blank"
							rel="noopener noreferrer"
						>
							<span class="btn-icon">👁️</span>
							<span class="btn-text">View Memorial</span>
						</a>
						
						<a 
							href="/my-portal/tributes/{memorial.id}/edit" 
							class="action-btn edit-btn"
						>
							<span class="btn-icon">📸</span>
							<span class="btn-text">Add/Edit Photos</span>
						</a>

						{#if memorial.livestream}
							<a 
								href="/my-portal/tributes/{memorial.id}/livestream" 
								class="action-btn livestream-btn"
							>
								<span class="btn-icon">📺</span>
								<span class="btn-text">Livestream Info</span>
							</a>
						{/if}
					</div>

					<!-- Permission indicators -->
					<div class="permissions-info">
						<h4 class="permissions-label">Your Permissions:</h4>
						<div class="permission-tags">
							<span class="permission-tag can-upload">📷 Upload Photos</span>
							<!-- Additional permissions can be added here based on memorial data -->
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<div class="empty-icon">📭</div>
			<h3 class="empty-title">No Memorial Invitations Yet</h3>
			<p class="empty-description">
				You haven't been invited to any memorials yet. 
				When family members invite you to contribute to a memorial, they will appear here.
			</p>
		</div>
	{/if}
</div>

<style>
	.family-portal-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.portal-header {
		text-align: center;
		margin-bottom: 3rem;
		padding-bottom: 2rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.portal-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin: 0 0 1rem 0;
		font-size: 2.5rem;
		font-weight: 700;
		background: linear-gradient(135deg, #64b5f6 0%, #2196f3 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.portal-title .icon {
		font-size: 2.5rem;
		-webkit-text-fill-color: initial;
	}

	.portal-description {
		margin: 0;
		font-size: 1.125rem;
		color: #6b7280;
		max-width: 600px;
		margin: 0 auto;
	}

	.memorials-grid {
		display: grid;
		gap: 2rem;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 600px), 1fr));
	}

	.memorial-card-wrapper {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		background: white;
		border-radius: 1rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.memorial-card-wrapper:hover {
		transform: translateY(-4px);
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	.action-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		border-radius: 0.5rem;
		font-weight: 500;
		font-size: 0.875rem;
		text-decoration: none;
		transition: all 0.2s ease;
		cursor: pointer;
		border: 1px solid transparent;
		flex: 1;
		min-width: 140px;
		justify-content: center;
	}

	.btn-icon {
		font-size: 1.125rem;
	}

	.view-btn {
		background: linear-gradient(135deg, #60a5fa, #3b82f6);
		color: white;
		border-color: #2563eb;
	}

	.view-btn:hover {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}

	.edit-btn {
		background: linear-gradient(135deg, #34d399, #10b981);
		color: white;
		border-color: #059669;
	}

	.edit-btn:hover {
		background: linear-gradient(135deg, #10b981, #059669);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	}

	.livestream-btn {
		background: linear-gradient(135deg, #f472b6, #ec4899);
		color: white;
		border-color: #db2777;
	}

	.livestream-btn:hover {
		background: linear-gradient(135deg, #ec4899, #db2777);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
	}

	.permissions-info {
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.permissions-label {
		margin: 0 0 0.5rem 0;
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.permission-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.permission-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.625rem;
		background: #dbeafe;
		border: 1px solid #93c5fd;
		color: #1e40af;
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: #f9fafb;
		border-radius: 1rem;
		border: 2px dashed #d1d5db;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-title {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
	}

	.empty-description {
		margin: 0 auto;
		max-width: 400px;
		color: #6b7280;
		line-height: 1.6;
	}

	/* 📱 Mobile Responsive */
	@media (max-width: 768px) {
		.family-portal-container {
			padding: 1rem;
		}

		.portal-title {
			font-size: 2rem;
		}

		.portal-title .icon {
			font-size: 2rem;
		}

		.portal-description {
			font-size: 1rem;
		}

		.memorial-card-wrapper {
			padding: 1rem;
		}

		.action-buttons {
			flex-direction: column;
		}

		.action-btn {
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		.portal-title {
			font-size: 1.75rem;
			flex-direction: column;
		}

		.empty-state {
			padding: 2rem 1rem;
		}
	}

	/* 🌙 Dark mode support */
	@media (prefers-color-scheme: dark) {
		.family-portal-container {
			background: #111827;
			color: #f9fafb;
		}

		.portal-header {
			border-bottom-color: #374151;
		}

		.portal-description {
			color: #9ca3af;
		}

		.memorial-card-wrapper {
			background: #1f2937;
			box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
		}

		.action-buttons {
			border-top-color: #374151;
		}

		.permissions-info {
			border-top-color: #374151;
		}

		.permissions-label {
			color: #9ca3af;
		}

		.permission-tag {
			background: #1e3a8a;
			border-color: #1e40af;
			color: #dbeafe;
		}

		.empty-state {
			background: #1f2937;
			border-color: #4b5563;
		}

		.empty-title {
			color: #f9fafb;
		}

		.empty-description {
			color: #9ca3af;
		}
	}
</style>