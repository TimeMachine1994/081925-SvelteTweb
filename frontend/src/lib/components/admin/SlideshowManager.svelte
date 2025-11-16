<!--
SLIDESHOW MANAGER COMPONENT

Manage memorial slideshow images with drag-and-drop reordering
Following UX principles: Direct manipulation, Visual feedback
-->
<script lang="ts">
	interface SlideshowImage {
		id: string;
		url: string;
		caption: string;
		order: number;
		uploadedAt: string;
		isApproved: boolean;
		isFlagged: boolean;
		flagReason: string | null;
	}

	interface SlideshowSettings {
		autoplay: boolean;
		interval: number;
		transition: string;
		showCaptions: boolean;
		maxImages: number;
	}

	let {
		memorialId,
		images: initialImages = [],
		settings: initialSettings,
		onUpdate = () => {}
	}: {
		memorialId: string;
		images?: SlideshowImage[];
		settings?: SlideshowSettings;
		onUpdate?: () => void;
	} = $props();

	// State
	let images = $state<SlideshowImage[]>(initialImages);
	let settings = $state<SlideshowSettings>(initialSettings);
	let isProcessing = $state(false);
	let processingMessage = $state('');
	let draggedIndex = $state<number | null>(null);
	let selectedImage = $state<SlideshowImage | null>(null);
	let showSettings = $state(false);

	// Computed
	const approvedImages = $derived(images.filter(img => img.isApproved));
	const flaggedImages = $derived(images.filter(img => img.isFlagged));

	// Drag and drop handlers
	function handleDragStart(index: number) {
		draggedIndex = index;
	}

	function handleDragOver(event: DragEvent, index: number) {
		event.preventDefault();
		if (draggedIndex === null || draggedIndex === index) return;

		// Reorder array
		const newImages = [...images];
		const draggedItem = newImages[draggedIndex];
		newImages.splice(draggedIndex, 1);
		newImages.splice(index, 0, draggedItem);
		
		images = newImages;
		draggedIndex = index;
	}

	function handleDragEnd() {
		draggedIndex = null;
	}

	async function saveOrder() {
		isProcessing = true;
		processingMessage = 'Saving order...';

		try {
			const imageOrders = images.map((img, index) => ({
				id: img.id,
				order: index
			}));

			const response = await fetch(`/api/admin/memorials/${memorialId}/slideshow/reorder`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ imageOrders })
			});

			const result = await response.json();

			if (response.ok) {
				alert('Order saved successfully');
				onUpdate();
			} else {
				alert(`Failed: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error saving order:', error);
			alert('An error occurred');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
	}

	async function deleteImage(imageId: string) {
		if (!confirm('Delete this image from the slideshow?')) return;

		isProcessing = true;
		processingMessage = 'Deleting image...';

		try {
			const response = await fetch(`/api/admin/memorials/${memorialId}/slideshow/${imageId}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (response.ok) {
				images = images.filter(img => img.id !== imageId);
				alert('Image deleted');
				onUpdate();
			} else {
				alert(`Failed: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error deleting image:', error);
			alert('An error occurred');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
	}

	async function toggleFlag(image: SlideshowImage) {
		const newFlagStatus = !image.isFlagged;
		let reason = null;

		if (newFlagStatus) {
			reason = prompt('Enter reason for flagging this image:');
			if (!reason || reason.trim().length < 10) {
				alert('Flag reason required (min 10 characters)');
				return;
			}
		}

		isProcessing = true;
		processingMessage = newFlagStatus ? 'Flagging image...' : 'Unflagging image...';

		try {
			const response = await fetch(`/api/admin/memorials/${memorialId}/slideshow/${image.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					isFlagged: newFlagStatus,
					flagReason: reason
				})
			});

			const result = await response.json();

			if (response.ok) {
				// Update local state
				images = images.map(img => 
					img.id === image.id 
						? { ...img, isFlagged: newFlagStatus, flagReason: reason }
						: img
				);
				alert(newFlagStatus ? 'Image flagged' : 'Flag removed');
				onUpdate();
			} else {
				alert(`Failed: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error toggling flag:', error);
			alert('An error occurred');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
	}

	async function saveSettings() {
		isProcessing = true;
		processingMessage = 'Saving settings...';

		try {
			const response = await fetch(`/api/admin/memorials/${memorialId}/slideshow`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ settings })
			});

			const result = await response.json();

			if (response.ok) {
				alert('Settings saved');
				showSettings = false;
				onUpdate();
			} else {
				alert(`Failed: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error saving settings:', error);
			alert('An error occurred');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<div class="slideshow-manager">
	<!-- Header -->
	<div class="manager-header">
		<div class="header-info">
			<h3>🖼️ Slideshow Images ({images.length})</h3>
			<div class="stats">
				<span class="stat-badge approved">✅ {approvedImages.length} Approved</span>
				{#if flaggedImages.length > 0}
					<span class="stat-badge flagged">🚩 {flaggedImages.length} Flagged</span>
				{/if}
			</div>
		</div>
		<div class="header-actions">
			<button class="btn-settings" onclick={() => showSettings = !showSettings}>
				⚙️ Settings
			</button>
			<button class="btn-save-order" onclick={saveOrder}>
				💾 Save Order
			</button>
		</div>
	</div>

	<!-- Settings Panel -->
	{#if showSettings}
		<div class="settings-panel">
			<h4>Slideshow Settings</h4>
			<div class="settings-grid">
				<div class="setting-item">
					<label>
						<input type="checkbox" bind:checked={settings.autoplay} />
						<span>Autoplay</span>
					</label>
				</div>
				<div class="setting-item">
					<label>
						<input type="checkbox" bind:checked={settings.showCaptions} />
						<span>Show Captions</span>
					</label>
				</div>
				<div class="setting-item">
					<label for="interval">Interval (ms)</label>
					<input 
						type="number" 
						id="interval"
						bind:value={settings.interval}
						min="1000"
						max="10000"
						step="500"
					/>
				</div>
				<div class="setting-item">
					<label for="transition">Transition</label>
					<select id="transition" bind:value={settings.transition}>
						<option value="fade">Fade</option>
						<option value="slide">Slide</option>
						<option value="zoom">Zoom</option>
					</select>
				</div>
			</div>
			<div class="settings-actions">
				<button class="btn-save" onclick={saveSettings}>Save Settings</button>
				<button class="btn-cancel" onclick={() => showSettings = false}>Cancel</button>
			</div>
		</div>
	{/if}

	<!-- Images Grid -->
	{#if images.length > 0}
		<div class="images-grid">
			{#each images as image, index}
				<div 
					class="image-card"
					class:flagged={image.isFlagged}
					draggable="true"
					ondragstart={() => handleDragStart(index)}
					ondragover={(e) => handleDragOver(e, index)}
					ondragend={handleDragEnd}
				>
					<div class="image-preview">
						<img src={image.url} alt={image.caption || 'Slideshow image'} />
						<div class="image-overlay">
							<button 
								class="btn-view" 
								onclick={() => selectedImage = image}
								title="View full size"
							>
								👁️
							</button>
						</div>
					</div>
					<div class="image-info">
						<div class="image-order">#{index + 1}</div>
						{#if image.caption}
							<div class="image-caption">{image.caption}</div>
						{/if}
						<div class="image-meta">
							<small>{formatDate(image.uploadedAt)}</small>
						</div>
						{#if image.isFlagged && image.flagReason}
							<div class="flag-reason">
								<strong>🚩 Flagged:</strong> {image.flagReason}
							</div>
						{/if}
					</div>
					<div class="image-actions">
						<button 
							class="btn-flag"
							class:active={image.isFlagged}
							onclick={() => toggleFlag(image)}
							title={image.isFlagged ? 'Remove flag' : 'Flag image'}
						>
							{image.isFlagged ? '✅' : '🚩'}
						</button>
						<button 
							class="btn-delete" 
							onclick={() => deleteImage(image.id)}
							title="Delete image"
						>
							🗑️
						</button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<p>No images in slideshow</p>
		</div>
	{/if}

	<!-- Image Preview Modal -->
	{#if selectedImage}
		<div class="preview-modal" onclick={() => selectedImage = null}>
			<div class="preview-content" onclick={(e) => e.stopPropagation()}>
				<button class="close-btn" onclick={() => selectedImage = null}>✕</button>
				<img src={selectedImage.url} alt={selectedImage.caption || 'Preview'} />
				{#if selectedImage.caption}
					<p class="preview-caption">{selectedImage.caption}</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Processing Overlay -->
	{#if isProcessing}
		<div class="processing-overlay">
			<div class="processing-content">
				<div class="spinner"></div>
				<p>{processingMessage}</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.slideshow-manager {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.manager-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header-info h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		color: #1e293b;
	}

	.stats {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.stat-badge {
		padding: 0.25rem 0.625rem;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.stat-badge.approved {
		background: #d1fae5;
		color: #065f46;
	}

	.stat-badge.flagged {
		background: #fee2e2;
		color: #991b1b;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-settings,
	.btn-save-order {
		padding: 0.625rem 1rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.btn-settings {
		background: #64748b;
		color: white;
	}

	.btn-settings:hover {
		background: #475569;
	}

	.btn-save-order {
		background: #3b82f6;
		color: white;
	}

	.btn-save-order:hover {
		background: #2563eb;
	}

	/* Settings Panel */
	.settings-panel {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.settings-panel h4 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		color: #1e293b;
	}

	.settings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.setting-item label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9375rem;
		color: #334155;
		font-weight: 500;
	}

	.setting-item input[type="checkbox"] {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.setting-item input[type="number"],
	.setting-item select {
		padding: 0.5rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		font-size: 0.9375rem;
	}

	.settings-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-save,
	.btn-cancel {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		border: none;
	}

	.btn-save {
		background: #10b981;
		color: white;
	}

	.btn-save:hover {
		background: #059669;
	}

	.btn-cancel {
		background: #e2e8f0;
		color: #475569;
	}

	.btn-cancel:hover {
		background: #cbd5e1;
	}

	/* Images Grid */
	.images-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.image-card {
		background: white;
		border: 2px solid #e2e8f0;
		border-radius: 0.5rem;
		overflow: hidden;
		cursor: move;
		transition: all 0.2s;
	}

	.image-card:hover {
		border-color: #3b82f6;
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.image-card.flagged {
		border-color: #ef4444;
		background: #fef2f2;
	}

	.image-preview {
		position: relative;
		aspect-ratio: 4/3;
		overflow: hidden;
		background: #f1f5f9;
	}

	.image-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.image-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.image-card:hover .image-overlay {
		opacity: 1;
	}

	.btn-view {
		padding: 0.5rem 1rem;
		background: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 1.25rem;
	}

	.image-info {
		padding: 0.75rem;
	}

	.image-order {
		font-size: 0.75rem;
		font-weight: 700;
		color: #3b82f6;
		margin-bottom: 0.25rem;
	}

	.image-caption {
		font-size: 0.875rem;
		color: #1e293b;
		margin-bottom: 0.25rem;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.image-meta {
		font-size: 0.75rem;
		color: #64748b;
	}

	.flag-reason {
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: #fee2e2;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		color: #991b1b;
	}

	.image-actions {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-flag,
	.btn-delete {
		flex: 1;
		padding: 0.5rem;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.2s;
	}

	.btn-flag {
		background: #f1f5f9;
	}

	.btn-flag:hover {
		background: #e2e8f0;
	}

	.btn-flag.active {
		background: #fef2f2;
		border: 1px solid #ef4444;
	}

	.btn-delete {
		background: #fee2e2;
		color: #991b1b;
	}

	.btn-delete:hover {
		background: #fecaca;
	}

	/* Preview Modal */
	.preview-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		padding: 2rem;
	}

	.preview-content {
		position: relative;
		max-width: 90vw;
		max-height: 90vh;
		background: white;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.close-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 36px;
		height: 36px;
		background: rgba(0, 0, 0, 0.5);
		color: white;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		font-size: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1;
	}

	.close-btn:hover {
		background: rgba(0, 0, 0, 0.8);
	}

	.preview-content img {
		max-width: 100%;
		max-height: 80vh;
		display: block;
	}

	.preview-caption {
		padding: 1rem;
		background: #f8fafc;
		text-align: center;
		margin: 0;
		color: #1e293b;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
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
		.images-grid {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		}

		.manager-header {
			flex-direction: column;
		}

		.header-actions {
			width: 100%;
			flex-direction: column;
		}

		.btn-settings,
		.btn-save-order {
			width: 100%;
		}
	}
</style>
