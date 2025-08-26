<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Props
	interface Props {
		photos: string[];
		loading?: boolean;
		editable?: boolean;
	}

	let { photos = [], loading = false, editable = true }: Props = $props();

	// Event dispatcher for parent communication
	const dispatch = createEventDispatcher<{
		reorder: { photos: string[] };
		delete: { photoUrl: string; index: number };
	}>();

	// State management using Svelte 5 runes
	let selectedPhotos = $state(new Set<number>());
	let draggedIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);
	let showDeleteConfirm = $state<number | null>(null);
	let localPhotos = $state([...photos]);

	// Derived state for UI feedback
	let hasSelection = $derived(selectedPhotos.size > 0);
	let isReordering = $derived(draggedIndex !== null);

	// Update local photos when props change
	$effect(() => {
		console.log('📸 PhotoGridEditor: Photos prop updated', { count: photos.length });
		localPhotos = [...photos];
	});

	// Drag and drop handlers
	function handleDragStart(event: DragEvent, index: number) {
		console.log('🎯 Drag started for photo at index:', index);
		draggedIndex = index;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', index.toString());
		}
	}

	function handleDragOver(event: DragEvent, index: number) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
		dragOverIndex = index;
	}

	function handleDragLeave() {
		dragOverIndex = null;
	}

	function handleDrop(event: DragEvent, dropIndex: number) {
		event.preventDefault();
		console.log('📦 Drop event triggered', { draggedIndex, dropIndex });
		
		if (draggedIndex === null || draggedIndex === dropIndex) {
			resetDragState();
			return;
		}

		// Reorder the photos array
		const newPhotos = [...localPhotos];
		const draggedPhoto = newPhotos[draggedIndex];
		newPhotos.splice(draggedIndex, 1);
		newPhotos.splice(dropIndex, 0, draggedPhoto);

		localPhotos = newPhotos;
		console.log('✅ Photos reordered successfully');
		
		// Emit reorder event
		dispatch('reorder', { photos: newPhotos });
		
		resetDragState();
	}

	function handleDragEnd() {
		console.log('🏁 Drag operation ended');
		resetDragState();
	}

	function resetDragState() {
		draggedIndex = null;
		dragOverIndex = null;
	}

	// Selection handlers
	function toggleSelection(index: number) {
		console.log('🎯 Toggling selection for photo at index:', index);
		if (selectedPhotos.has(index)) {
			selectedPhotos.delete(index);
		} else {
			selectedPhotos.add(index);
		}
		selectedPhotos = new Set(selectedPhotos); // Trigger reactivity
	}

	function clearSelection() {
		console.log('🧹 Clearing all selections');
		selectedPhotos.clear();
		selectedPhotos = new Set(selectedPhotos);
	}

	// Delete handlers
	function showDeleteDialog(index: number) {
		console.log('🗑️ Showing delete confirmation for photo at index:', index);
		showDeleteConfirm = index;
	}

	function confirmDelete() {
		if (showDeleteConfirm === null) return;
		
		const photoUrl = localPhotos[showDeleteConfirm];
		console.log('❌ Deleting photo:', photoUrl);
		
		// Remove from local array
		localPhotos.splice(showDeleteConfirm, 1);
		localPhotos = [...localPhotos];
		
		// Emit delete event
		dispatch('delete', { photoUrl, index: showDeleteConfirm });
		
		// Clear selection if deleted photo was selected
		if (selectedPhotos.has(showDeleteConfirm)) {
			selectedPhotos.delete(showDeleteConfirm);
			selectedPhotos = new Set(selectedPhotos);
		}
		
		showDeleteConfirm = null;
	}

	function cancelDelete() {
		console.log('🚫 Delete operation cancelled');
		showDeleteConfirm = null;
	}

	// Keyboard navigation
	function handleKeyDown(event: KeyboardEvent, index: number) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleSelection(index);
		} else if (event.key === 'Delete' && editable) {
			event.preventDefault();
			showDeleteDialog(index);
		}
	}

	// Touch support for mobile
	let touchStartTime = 0;
	let touchStartPos = { x: 0, y: 0 };

	function handleTouchStart(event: TouchEvent, index: number) {
		touchStartTime = Date.now();
		const touch = event.touches[0];
		touchStartPos = { x: touch.clientX, y: touch.clientY };
	}

	function handleTouchEnd(event: TouchEvent, index: number) {
		const touchDuration = Date.now() - touchStartTime;
		const touch = event.changedTouches[0];
		const touchEndPos = { x: touch.clientX, y: touch.clientY };
		const distance = Math.sqrt(
			Math.pow(touchEndPos.x - touchStartPos.x, 2) + 
			Math.pow(touchEndPos.y - touchStartPos.y, 2)
		);

		// Long press for selection (500ms+) or short tap with minimal movement
		if ((touchDuration > 500 && distance < 10) || (touchDuration < 200 && distance < 5)) {
			toggleSelection(index);
		}
	}
</script>

<div class="photo-grid-editor" class:loading class:reordering={isReordering}>
	<div class="editor-header">
		<h3>Photo Gallery Editor</h3>
		{#if hasSelection}
			<div class="selection-info">
				<span>{selectedPhotos.size} photo{selectedPhotos.size !== 1 ? 's' : ''} selected</span>
				<button 
					type="button" 
					class="clear-selection-btn"
					onclick={clearSelection}
					aria-label="Clear selection"
				>
					Clear Selection
				</button>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="loading-state" aria-live="polite">
			<div class="loading-spinner"></div>
			<p>Loading photos...</p>
		</div>
	{:else if localPhotos && localPhotos.length > 0}
		<div 
			class="photo-grid"
			role="grid"
			aria-label="Photo gallery grid"
		>
			{#each localPhotos as photo, index (photo)}
				<div 
					class="photo-item"
					class:selected={selectedPhotos.has(index)}
					class:dragging={draggedIndex === index}
					class:drag-over={dragOverIndex === index}
					role="gridcell"
					tabindex="0"
					aria-label="Photo {index + 1} of {localPhotos.length}"
					aria-selected={selectedPhotos.has(index)}
					draggable={editable}
					ondragstart={(e) => handleDragStart(e, index)}
					ondragover={(e) => handleDragOver(e, index)}
					ondragleave={handleDragLeave}
					ondrop={(e) => handleDrop(e, index)}
					ondragend={handleDragEnd}
					onkeydown={(e) => handleKeyDown(e, index)}
					ontouchstart={(e) => handleTouchStart(e, index)}
					ontouchend={(e) => handleTouchEnd(e, index)}
				>
					<div class="photo-wrapper">
						<img 
							src={photo} 
							alt="Gallery photo {index + 1}"
							loading="lazy"
						/>
						
						{#if editable}
							<div class="photo-overlay">
								<button
									type="button"
									class="select-btn"
									class:active={selectedPhotos.has(index)}
									onclick={() => toggleSelection(index)}
									aria-label={selectedPhotos.has(index) ? 'Deselect photo' : 'Select photo'}
								>
									{#if selectedPhotos.has(index)}
										<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
											<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
										</svg>
									{:else}
										<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
											<path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 2v8h10V5H5z" clip-rule="evenodd" />
										</svg>
									{/if}
								</button>
								
								<button
									type="button"
									class="delete-btn"
									onclick={() => showDeleteDialog(index)}
									aria-label="Delete photo"
								>
									<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM6 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
									</svg>
								</button>
							</div>
						{/if}
						
						{#if draggedIndex === index}
							<div class="drag-indicator" aria-hidden="true">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
									<path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
								</svg>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
				<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
			</svg>
			<p>No photos have been uploaded yet.</p>
		</div>
	{/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm !== null}
	<div class="modal-overlay" onclick={cancelDelete}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<h4>Delete Photo</h4>
			<p>Are you sure you want to delete this photo? This action cannot be undone.</p>
			<div class="modal-actions">
				<button type="button" class="cancel-btn" onclick={cancelDelete}>
					Cancel
				</button>
				<button type="button" class="confirm-btn" onclick={confirmDelete}>
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.photo-grid-editor {
		margin-top: 2rem;
		position: relative;
	}

	.photo-grid-editor.loading {
		opacity: 0.7;
		pointer-events: none;
	}

	.photo-grid-editor.reordering {
		user-select: none;
	}

	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.editor-header h3 {
		margin: 0;
		color: #1f2937;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.selection-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.clear-selection-btn {
		padding: 0.5rem 1rem;
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: #374151;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.clear-selection-btn:hover {
		background: #e5e7eb;
		border-color: #9ca3af;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		color: #6b7280;
	}

	.loading-spinner {
		width: 2rem;
		height: 2rem;
		border: 2px solid #e5e7eb;
		border-top: 2px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.photo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
		padding: 0.5rem;
	}

	.photo-item {
		position: relative;
		border-radius: 0.5rem;
		overflow: hidden;
		transition: all 0.3s ease;
		cursor: pointer;
		background: #f9fafb;
		border: 2px solid transparent;
		outline: none;
	}

	.photo-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	}

	.photo-item:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.photo-item.selected {
		border-color: #10b981;
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	.photo-item.dragging {
		opacity: 0.5;
		transform: rotate(5deg) scale(1.05);
		z-index: 1000;
	}

	.photo-item.drag-over {
		border-color: #3b82f6;
		background: #eff6ff;
		transform: scale(1.02);
	}

	.photo-wrapper {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
	}

	.photo-wrapper img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.photo-item:hover .photo-wrapper img {
		transform: scale(1.05);
	}

	.photo-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 0.5rem;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.photo-item:hover .photo-overlay,
	.photo-item:focus .photo-overlay,
	.photo-item.selected .photo-overlay {
		opacity: 1;
	}

	.select-btn,
	.delete-btn {
		width: 2rem;
		height: 2rem;
		border: none;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		color: white;
	}

	.select-btn {
		background: rgba(255, 255, 255, 0.2);
	}

	.select-btn.active {
		background: #10b981;
	}

	.select-btn:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.select-btn.active:hover {
		background: #059669;
	}

	.delete-btn {
		background: rgba(239, 68, 68, 0.8);
	}

	.delete-btn:hover {
		background: #dc2626;
	}

	.drag-indicator {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(0, 0, 0, 0.8);
		color: white;
		border-radius: 50%;
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		color: #6b7280;
		text-align: center;
	}

	.empty-state svg {
		margin-bottom: 1rem;
	}

	/* Modal Styles */
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
		animation: fadeIn 0.2s ease;
	}

	.modal-content {
		background: white;
		border-radius: 0.5rem;
		padding: 1.5rem;
		max-width: 400px;
		width: 90%;
		box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
		animation: slideIn 0.3s ease;
	}

	.modal-content h4 {
		margin: 0 0 1rem 0;
		color: #1f2937;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.modal-content p {
		margin: 0 0 1.5rem 0;
		color: #6b7280;
		line-height: 1.5;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.cancel-btn,
	.confirm-btn {
		padding: 0.5rem 1rem;
		border: 1px solid;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cancel-btn {
		background: white;
		border-color: #d1d5db;
		color: #374151;
	}

	.cancel-btn:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	.confirm-btn {
		background: #ef4444;
		border-color: #ef4444;
		color: white;
	}

	.confirm-btn:hover {
		background: #dc2626;
		border-color: #dc2626;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-1rem) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* Mobile Responsive */
	@media (max-width: 640px) {
		.photo-grid {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: 0.75rem;
			padding: 0.25rem;
		}

		.editor-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.selection-info {
			width: 100%;
			justify-content: space-between;
		}

		.modal-content {
			margin: 1rem;
			width: auto;
		}

		.modal-actions {
			flex-direction: column-reverse;
		}

		.cancel-btn,
		.confirm-btn {
			width: 100%;
			justify-content: center;
		}
	}

	@media (max-width: 480px) {
		.photo-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		
		.photo-overlay {
			padding: 0.25rem;
		}
		
		.select-btn,
		.delete-btn {
			width: 1.75rem;
			height: 1.75rem;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.photo-item {
			border-width: 3px;
		}
		
		.photo-item.selected {
			border-color: #000;
		}
		
		.photo-overlay {
			background: rgba(0, 0, 0, 0.8);
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.photo-item,
		.photo-wrapper img,
		.photo-overlay,
		.select-btn,
		.delete-btn,
		.modal-overlay,
		.modal-content {
			transition: none;
		}
		
		.loading-spinner {
			animation: none;
		}
		
		.drag-indicator {
			animation: none;
		}
		
		.photo-item:hover {
			transform: none;
		}
	}
</style>