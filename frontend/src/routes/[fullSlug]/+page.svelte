<script lang="ts">
	import type { PageData } from './$types';
	import StreamPlayer from '$lib/components/StreamPlayer.svelte';
	import SlideshowSection from '$lib/components/SlideshowSection.svelte';
	import BookingReminderBanner from '$lib/components/BookingReminderBanner.svelte';
	import { shouldShowBookingBanner, markBannerAsSeen, debugBannerState } from '$lib/utils/bookingBanner';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	// Extract memorial, streams, and slideshows data from server load
	let memorial = $derived(data.memorial);
	let streams = $derived((data.streams || []) as any);
	let slideshows = $derived((data.slideshows || []) as any);
	let user = $derived(data.user);
	
	// Determine if user can edit slideshows
	let canEditSlideshows = $derived(() => {
		if (!user || !memorial) return false;
		
		return (
			user.role === 'admin' ||
			memorial.ownerUid === user.uid ||
			memorial.funeralDirectorUid === user.uid
		);
	});

	// Booking banner state
	let showBookingBanner = $state(false);
	let bannerVisible = $state(false);

	// Check if booking banner should be shown
	let bannerState = $derived(() => {
		if (!memorial || !memorial.id) return { shouldShow: false };
		return shouldShowBookingBanner(memorial.id, user, memorial);
	});

	// Handle banner dismissal
	function handleBannerDismiss() {
		if (memorial?.id) {
			markBannerAsSeen(memorial.id);
		}
		bannerVisible = false;
		showBookingBanner = false;
	}

	// Enhanced date formatting with better error handling
	function formatDate(dateString: string | null): string {
		if (!dateString) return 'Date TBD';
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) {
				console.warn('Invalid date string:', dateString);
				return dateString;
			}
			return date.toLocaleDateString('en-US', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch (error) {
			console.error('Date formatting error:', error, 'for date:', dateString);
			return dateString || 'Date TBD';
		}
	}

	// Simplified: Use hasCustomHtml flag from server
	let hasCustomHtml = $derived((memorial as any)?.hasCustomHtml || false);

	// Show booking banner after delay if conditions are met
	$effect(() => {
		const currentBannerState = bannerState();
		if (currentBannerState.shouldShow && !showBookingBanner) {
			console.log('🎯 [BOOKING_BANNER] Scheduling banner display in 3 seconds...');
			if (memorial?.id) {
				debugBannerState(memorial.id);
			}
			
			const timer = setTimeout(() => {
				console.log('🎯 [BOOKING_BANNER] Showing booking banner');
				showBookingBanner = true;
				bannerVisible = true;
			}, 3000); // 3 second delay

			return () => clearTimeout(timer);
		}
	});

	// Log memorial data for debugging
	$effect(() => {
		if (memorial) {
			console.log('🏠 [MEMORIAL_PAGE] Memorial loaded:', {
				id: memorial.id,
				name: memorial.lovedOneName,
				isPublic: memorial.isPublic,
				streamCount: streams.length,
				hasCustomHtml: hasCustomHtml,
				layoutType: hasCustomHtml ? 'Legacy (custom HTML only)' : 'Standard (with streams)',
				custom_html_length: (memorial as any)?.custom_html?.length || 0,
				custom_html_preview: (memorial as any)?.custom_html ? 
					(memorial as any).custom_html.substring(0, 100) + '...' : null,
				bannerState: bannerState()
			});
		}
	});
</script>

<svelte:head>
	<title>{memorial?.lovedOneName ? `Celebration of Life for ${memorial.lovedOneName}` : 'Memorial'}</title>
	<meta name="description" content={memorial?.content || 'Memorial service information'} />
</svelte:head>

<!-- Booking Reminder Banner -->
{#if showBookingBanner && memorial}
	<BookingReminderBanner 
		memorialId={memorial.id}
		memorialName={memorial.lovedOneName}
		onDismiss={handleBannerDismiss}
		visible={bannerVisible}
	/>
{/if}

<div class="memorial-page {showBookingBanner ? 'banner-active' : ''}">
	{#if memorial}
		{#if hasCustomHtml && (memorial as any).custom_html}
			<!-- Legacy Memorial Layout with Custom HTML -->
			<div class="legacy-memorial">
				<div class="memorial-header">
					<!-- Glass box wrapper for title only -->
					<div class="glass-box">
						<h1 class="memorial-title">
							<span class="celebration-prefix">Celebration of Life for</span>
							<span class="loved-one-name">{memorial.lovedOneName}</span>
						</h1>
					</div>
					
					<!-- Hero Slideshow Section - Outside glass box -->
					<div class="hero-slideshow">
						<SlideshowSection 
							{slideshows} 
							memorialName={memorial.lovedOneName || 'Unknown'}
							editable={canEditSlideshows()}
							currentUserId={user?.uid}
							heroMode={true}
						/>
					</div>
				</div>

				<!-- Legacy Custom HTML Content Only -->
				<div class="memorial-content-container">
					<div class="legacy-content">
						{@html (memorial as any).custom_html}
					</div>
				</div>
			</div>
		{:else}
			<!-- Standard Memorial Layout -->
			<div class="memorial-layout">
				<!-- Header Section -->
				<div class="memorial-header">
					{#if memorial.imageUrl}
						<div class="memorial-image">
							<img src={memorial.imageUrl} alt={memorial.lovedOneName} />
						</div>
					{/if}
					<div class="memorial-header-content">
						<!-- Glass box wrapper for title and dates only -->
						<div class="glass-box">
							<h1 class="memorial-title">
								<span class="celebration-prefix">Celebration of Life for</span>
								<span class="loved-one-name">{memorial.lovedOneName}</span>
							</h1>
							
							{#if memorial.birthDate || memorial.deathDate}
								<div class="dates">
									{#if memorial.birthDate}
										<span>{formatDate(memorial.birthDate)}</span>
									{/if}
									{#if memorial.birthDate && memorial.deathDate}
										<span> - </span>
									{/if}
									{#if memorial.deathDate}
										<span>{formatDate(memorial.deathDate)}</span>
									{/if}
								</div>
							{/if}
						</div>
						
						<!-- Hero Slideshow Section - Outside glass box but inside header content -->
						<div class="hero-slideshow">
							<SlideshowSection 
								{slideshows} 
								memorialName={memorial.lovedOneName || 'Unknown'}
								editable={canEditSlideshows()}
								currentUserId={user?.uid}
								heroMode={true}
							/>
						</div>
					</div>
				</div>

				<!-- Body Section -->
				<div class="memorial-body">
					<!-- Streaming Section -->
					<div class="streaming-section">
						<StreamPlayer {streams} memorialName={memorial.lovedOneName} memorialId={memorial.id} />
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="loading">
			<p>Loading memorial information...</p>
		</div>
	{/if}
</div>

<style>
	/* Memorial Page Styles */
	.memorial-page {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background-color: #0a0a1a;
		min-height: 100vh;
		margin: -20px;
		padding: 0;
		width: calc(100% + 40px);
	}

	.memorial-content-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3rem 2rem 0 2rem;
		color: #e0e0e0;
	}

	.memorial-header {
		text-align: center;
		margin: 0;
		padding: 4rem 2rem;
		width: 100vw;
		height: 66.67vh;
		margin-left: calc(-50vw + 50%);
		border-bottom: 1px solid #444;
		background-image: url('https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/Background.jpg?alt=media&token=460aeba9-0879-4e88-b10f-f012dc79c0e6');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		position: relative;
		color: white;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.memorial-header::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 1;
	}

	.memorial-header > * {
		position: relative;
		z-index: 2;
	}

	.memorial-header-content {
		position: relative;
		z-index: 2;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}
	
	.glass-box {
		padding: 2rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 12px;
		backdrop-filter: blur(10px);
	}

	.memorial-title {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		line-height: 1.2;
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		color: white;
		font-weight: 300;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
	}

	.celebration-prefix {
		font-family: 'Fanwood', 'Fanwood Text', serif;
		font-style: italic;
		font-size: 0.7em;
		color: #ccc;
		margin-bottom: 0.25rem;
		font-weight: 300;
	}

	.loved-one-name {
		font-family: 'Fanwood Text', serif;
		font-style: italic;
		font-weight: inherit;
		color: inherit;
	}

	.dates {
		font-size: 1.1rem;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 1rem;
		font-style: italic;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
	}

	.memorial-layout {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.memorial-body {
		flex: 1;
		padding: 3rem 2rem;
		background: #0a0a1a;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.memorial-description {
		max-width: 800px;
		margin: 0 auto;
		font-size: 1.1rem;
		line-height: 1.6;
		color: #e0e0e0;
	}

	.streaming-section {
		max-width: 1000px;
		margin: 0 auto;
		width: 100%;
	}

	.streaming-section h2 {
		font-size: 1.8rem;
		font-weight: 300;
		color: #e0e0e0;
		text-align: center;
		margin-bottom: 1.5rem;
		font-family: 'Fanwood Text', serif;
		font-style: italic;
	}

	.loading {
		text-align: center;
		padding: 4rem 2rem;
		color: #666;
		font-style: italic;
	}

	/* Legacy Memorial Styles */
	.legacy-memorial {
		margin-bottom: 0;
	}

	.legacy-memorial .memorial-content-container {
		padding-bottom: 0;
	}

	.legacy-content {
		margin: 2rem 0 0 0; /* Remove bottom margin */
		width: 100%;
	}

	.legacy-content :global(iframe) {
		width: 100%;
		height: auto;
		min-height: 400px;
	}

	.legacy-content :global(div[style*="position:relative"]) {
		width: 100% !important;
		max-width: 800px;
		margin: 0 auto;
	}

	/* Import Fanwood font */
	@import url('https://fonts.googleapis.com/css2?family=Fanwood+Text:ital,wght@0,400;1,400&display=swap');

	/* Banner integration styles */
	.memorial-page.banner-active {
		padding-top: 80px; /* Space for banner */
		transition: padding-top 0.3s ease-out;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.memorial-content-container {
			padding: 2rem 1rem 0 1rem;
		}

		.memorial-header {
			padding: 3rem 1rem;
			height: 50vh;
			min-height: 400px;
		}

		.memorial-title {
			font-size: 2rem;
		}

		.memorial-header-content {
			padding: 1.5rem;
		}

		.memorial-body {
			padding: 2rem 1rem;
		}

		.legacy-content :global(iframe) {
			min-height: 250px;
		}
	}
	
	/* Hero Slideshow Styles */
	.hero-slideshow {
		display: flex;
		justify-content: center;
		padding: 0 2rem; /* Side padding for mobile */
	}
	
	.hero-slideshow :global(.slideshow-section) {
		margin: 0;
	}
	
	.hero-slideshow :global(.slideshows-container) {
		max-width: 300px; /* About 1/8 viewport */
	}
	
	/* Float nicely outside the glass box */
	.memorial-header .hero-slideshow {
		position: relative;
		z-index: 10; /* Above background elements */
	}
	
	/* Spacing handled by flex gap in memorial-header-content */
	.memorial-header-content .hero-slideshow {
		margin: 0;
	}
	
	@media (max-width: 768px) {
		.hero-slideshow {
			margin: 1.5rem 0 1rem 0;
			padding: 0 1rem;
		}
		
		.hero-slideshow :global(.slideshows-container) {
			max-width: 200px; /* Smaller on mobile */
		}
	}
</style>
