<script lang="ts">
	import { onMount } from 'svelte';
	import PhotoSlideshowCreator from '$lib/components/slideshow/PhotoSlideshowCreator.svelte';
	import type { PageData } from './$types';

	// Get data from SvelteKit load function
	let { data }: { data: PageData } = $props();
	
	// Destructure for easier access
	let { memorialId, editData, isEditMode } = $derived(data);
	
	// Event data for proper navigation
	let event = $state<any>(null);
	
	// Fetch event data if memorialId is provided
	async function fetchMemorialData() {
		if (!memorialId) return;
		
		try {
			const response = await fetch(`/api/memorials/${memorialId}`);
			if (response.ok) {
				event = await response.json();
				console.log('📍 Event data loaded:', event);
			} else {
				console.warn('⚠️ Could not load event data for navigation');
			}
		} catch (error) {
			console.error('❌ Error fetching event data:', error);
		}
	}
	
	onMount(() => {
		// Log the loaded data
		if (isEditMode) {
			console.log('🎬 Edit mode activated for slideshow:', editData?.id);
		}
		if (memorialId) {
			console.log('🎬 Event ID loaded:', memorialId);
			fetchMemorialData();
		}
	});

	// Handle when PhotoSlideshowCreator finds existing slideshow
	function handleExistingSlideshowFound(event: CustomEvent) {
		const { slideshow } = event.detail;
		if (slideshow && !isEditMode) {
			editData = slideshow;
			isEditMode = true;
			console.log('🎬 Switched to edit mode after finding existing slideshow:', slideshow.id);
		}
	}

	// Handle slideshow generation completion
	function handleSlideshowGenerated(event: CustomEvent) {
		const { videoBlob, photos, settings, uploaded } = event.detail;
		
		console.log('🎬 Slideshow generated!', {
			videoSize: videoBlob?.size || 'No video generated',
			photoCount: photos.length,
			settings,
			uploaded,
			isEditMode
		});

		// Auto-scroll to next step on mobile after video generation
		if (window.innerWidth <= 768) {
			setTimeout(() => {
				const nextStepElement = document.querySelector('.final-actions, .upload-section, .step-4');
				if (nextStepElement) {
					nextStepElement.scrollIntoView({ 
						behavior: 'smooth', 
						block: 'start',
						inline: 'nearest'
					});
				}
			}, 500); // Small delay to ensure UI has updated
		}

		if (uploaded) {
			const action = isEditMode ? 'updated' : 'created';
			alert(`Slideshow successfully ${action}!`);
			
			// Navigate back to event or profile
			if (event?.fullSlug) {
				// Navigate to event page using fullSlug
				window.location.href = `/${event.fullSlug}`;
			} else if (memorialId) {
				// Fallback to event ID if fullSlug not available
				window.location.href = `/memorials/${memorialId}`;
			} else {
				// Navigate to profile
				window.location.href = '/profile';
			}
		} else {
			alert('Slideshow generated! You can download it.');
		}
	}

	// Handle navigation back
	function handleBack() {
		if (event?.fullSlug) {
			// Navigate to event page using fullSlug
			window.location.href = `/${event.fullSlug}`;
		} else if (memorialId) {
			// Fallback to event ID if fullSlug not available
			window.location.href = `/memorials/${memorialId}`;
		} else {
			// Navigate to profile
			window.location.href = '/profile';
		}
	}
</script>

<svelte:head>
	<title>{isEditMode ? 'Edit Slideshow' : 'Create Slideshow'} - Tributestream</title>
	<meta name="description" content={isEditMode ? 'Edit your event slideshow' : 'Create a beautiful event slideshow'} />
</svelte:head>

<div class="slideshow-generator-page">
	<!-- Header -->
	<div class="page-header">
		<div class="header-content">
			<button 
				onclick={handleBack}
				class="back-button"
			>
				← Back
			</button>
			<div class="header-text">
				<h1>{isEditMode ? '✏️ Edit Slideshow' : '🎬 Create Slideshow'}</h1>
				<p>
					{#if isEditMode && editData}
						Editing "{editData.title}"
					{:else}
						Upload photos to create a beautiful event slideshow
					{/if}
				</p>
			</div>
		</div>
	</div>

	<!-- Slideshow Creator -->
	<div class="creator-container">
		<PhotoSlideshowCreator 
			memorialId={memorialId || undefined}
			maxPhotos={50}
			maxFileSize={10}
			on:slideshowGenerated={handleSlideshowGenerated}
			on:existingSlideshowFound={handleExistingSlideshowFound}
		/>
	</div>
</div>

<style>
	.slideshow-generator-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
		padding: 2rem 0;
	}

	.page-header {
		max-width: 1200px;
		margin: 0 auto 3rem auto;
		padding: 0 1rem;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.back-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		color: #374151;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.back-button:hover {
		background: #f9fafb;
		border-color: #d1d5db;
		transform: translateY(-1px);
	}

	.header-text h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
		line-height: 1.2;
	}

	.header-text p {
		font-size: 1.125rem;
		color: #6b7280;
		margin: 0;
	}

	.creator-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	@media (max-width: 768px) {
		.slideshow-generator-page {
			padding: 0.5rem 0;
			min-height: 100vh;
		}

		.page-header {
			margin-bottom: 1.5rem;
			padding: 0 0.5rem;
		}

		.header-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.header-text h1 {
			font-size: 1.75rem;
			line-height: 1.2;
		}

		.header-text p {
			font-size: 0.9rem;
			line-height: 1.4;
		}

		.back-button {
			padding: 0.5rem 1rem;
			font-size: 0.875rem;
			width: auto;
			min-width: fit-content;
		}

		.creator-container {
			padding: 0 0.5rem;
			max-width: 100%;
		}
	}

	/* Extra small mobile devices */
	@media (max-width: 480px) {
		.slideshow-generator-page {
			padding: 0.25rem 0;
		}

		.page-header {
			padding: 0 0.25rem;
			margin-bottom: 1rem;
		}

		.header-text h1 {
			font-size: 1.5rem;
		}

		.header-text p {
			font-size: 0.85rem;
		}

		.creator-container {
			padding: 0 0.25rem;
		}

		.back-button {
			padding: 0.4rem 0.8rem;
			font-size: 0.8rem;
		}
	}
</style>
