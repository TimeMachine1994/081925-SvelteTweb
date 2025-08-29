<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// 🎯 Props interface
	interface Props {
		photos: string[];
		autoplay?: boolean;
		duration?: number; // milliseconds per slide
		transition?: 'fade' | 'slide' | 'zoom' | 'kenburns';
		showControls?: boolean;
		allowFullscreen?: boolean;
	}

	let { 
		photos = [], 
		autoplay = false, 
		duration = 5000, 
		transition = 'fade',
		showControls = true,
		allowFullscreen = true 
	}: Props = $props();

	// 📡 Event dispatcher
	const dispatch = createEventDispatcher<{
		slideChange: { currentIndex: number; photo: string };
		playStateChange: { isPlaying: boolean };
		fullscreenToggle: { isFullscreen: boolean };
	}>();

	// 🎮 State management using Svelte 5 runes
	let currentIndex = $state(0);
	let isPlaying = $state(autoplay);
	let isFullscreen = $state(false);
	let isLoading = $state(true);
	let hasError = $state(false);
	let preloadedImages = $state(new Map<string, HTMLImageElement>());
	let slideshowContainer: HTMLDivElement;
	let autoplayTimer: ReturnType<typeof setInterval> | null = null;

	// 📊 Derived state
	let currentPhoto = $derived(photos[currentIndex] || '');
	let totalPhotos = $derived(photos.length);
	let progress = $derived(totalPhotos > 0 ? ((currentIndex + 1) / totalPhotos) * 100 : 0);
	let hasPhotos = $derived(photos.length > 0);
	let canNavigate = $derived(totalPhotos > 1);

	// 🖼️ Image preloading functionality
	function preloadImage(src: string): Promise<HTMLImageElement> {
		console.log('🖼️ Preloading image:', src);
		return new Promise((resolve, reject) => {
			if (preloadedImages.has(src)) {
				resolve(preloadedImages.get(src)!);
				return;
			}

			const img = new Image();
			img.onload = () => {
				console.log('✅ Image preloaded successfully:', src);
				preloadedImages.set(src, img);
				preloadedImages = new Map(preloadedImages);
				resolve(img);
			};
			img.onerror = () => {
				console.error('❌ Failed to preload image:', src);
				reject(new Error(`Failed to load image: ${src}`));
			};
			img.src = src;
		});
	}

	// 🔄 Preload adjacent images for smooth transitions
	async function preloadAdjacentImages() {
		if (!hasPhotos) return;

		const imagesToPreload = [];
		
		// Current image
		if (photos[currentIndex]) {
			imagesToPreload.push(photos[currentIndex]);
		}
		
		// Next image
		const nextIndex = (currentIndex + 1) % totalPhotos;
		if (photos[nextIndex]) {
			imagesToPreload.push(photos[nextIndex]);
		}
		
		// Previous image
		const prevIndex = currentIndex === 0 ? totalPhotos - 1 : currentIndex - 1;
		if (photos[prevIndex]) {
			imagesToPreload.push(photos[prevIndex]);
		}

		try {
			await Promise.all(imagesToPreload.map(preloadImage));
			isLoading = false;
			hasError = false;
		} catch (error) {
			console.error('🚨 Error preloading images:', error);
			hasError = true;
			isLoading = false;
		}
	}

	// ⏯️ Auto-advance functionality
	function startAutoplay() {
		console.log('▶️ Starting autoplay');
		if (autoplayTimer) clearInterval(autoplayTimer);
		
		autoplayTimer = setInterval(() => {
			if (canNavigate) {
				nextSlide();
			}
		}, duration);
	}

	function stopAutoplay() {
		console.log('⏸️ Stopping autoplay');
		if (autoplayTimer) {
			clearInterval(autoplayTimer);
			autoplayTimer = null;
		}
	}

	// 🎮 Navigation functions
	function nextSlide() {
		if (!canNavigate) return;
		console.log('➡️ Next slide');
		currentIndex = (currentIndex + 1) % totalPhotos;
		dispatch('slideChange', { currentIndex, photo: currentPhoto });
	}

	function previousSlide() {
		if (!canNavigate) return;
		console.log('⬅️ Previous slide');
		currentIndex = currentIndex === 0 ? totalPhotos - 1 : currentIndex - 1;
		dispatch('slideChange', { currentIndex, photo: currentPhoto });
	}

	function goToSlide(index: number) {
		if (index >= 0 && index < totalPhotos) {
			console.log('🎯 Going to slide:', index);
			currentIndex = index;
			dispatch('slideChange', { currentIndex, photo: currentPhoto });
		}
	}

	function togglePlayPause() {
		isPlaying = !isPlaying;
		console.log('🎮 Play state changed:', isPlaying);
		dispatch('playStateChange', { isPlaying });
	}

	// 🖥️ Fullscreen functionality
	function toggleFullscreen() {
		if (!allowFullscreen) return;

		if (!isFullscreen) {
			console.log('🖥️ Entering fullscreen');
			if (slideshowContainer.requestFullscreen) {
				slideshowContainer.requestFullscreen();
			}
		} else {
			console.log('🚪 Exiting fullscreen');
			if (document.exitFullscreen) {
				document.exitFullscreen();
			}
		}
	}

	function handleFullscreenChange() {
		isFullscreen = !!document.fullscreenElement;
		console.log('🖥️ Fullscreen state changed:', isFullscreen);
		dispatch('fullscreenToggle', { isFullscreen });
	}

	// ⌨️ Keyboard navigation
	function handleKeyDown(event: KeyboardEvent) {
		console.log('⌨️ Key pressed:', event.key);
		
		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				previousSlide();
				break;
			case 'ArrowRight':
				event.preventDefault();
				nextSlide();
				break;
			case ' ':
				event.preventDefault();
				togglePlayPause();
				break;
			case 'Escape':
				event.preventDefault();
				if (isFullscreen) {
					toggleFullscreen();
				}
				break;
			case 'f':
			case 'F':
				event.preventDefault();
				toggleFullscreen();
				break;
		}
	}

	// 👆 Touch/swipe gesture handling
	let touchStartX = 0;
	let touchStartY = 0;
	let touchStartTime = 0;

	function handleTouchStart(event: TouchEvent) {
		const touch = event.touches[0];
		touchStartX = touch.clientX;
		touchStartY = touch.clientY;
		touchStartTime = Date.now();
		console.log('👆 Touch start:', { x: touchStartX, y: touchStartY });
	}

	function handleTouchEnd(event: TouchEvent) {
		const touch = event.changedTouches[0];
		const touchEndX = touch.clientX;
		const touchEndY = touch.clientY;
		const touchDuration = Date.now() - touchStartTime;
		
		const deltaX = touchEndX - touchStartX;
		const deltaY = touchEndY - touchStartY;
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		
		console.log('👆 Touch end:', { deltaX, deltaY, distance, duration: touchDuration });

		// Swipe detection (minimum 50px distance, max 500ms duration)
		if (distance > 50 && touchDuration < 500) {
			if (Math.abs(deltaX) > Math.abs(deltaY)) {
				// Horizontal swipe
				if (deltaX > 0) {
					console.log('👆 Swipe right detected');
					previousSlide();
				} else {
					console.log('👆 Swipe left detected');
					nextSlide();
				}
			}
		} else if (distance < 10 && touchDuration < 200) {
			// Tap to toggle play/pause
			console.log('👆 Tap detected');
			togglePlayPause();
		}
	}

	// 🔄 Effects for lifecycle management
	$effect(() => {
		console.log('🎬 SlideshowPreview mounted with', photos.length, 'photos');
		if (hasPhotos) {
			preloadAdjacentImages();
		}
	});

	$effect(() => {
		console.log('📸 Photos changed, preloading new images');
		if (hasPhotos) {
			currentIndex = 0;
			preloadAdjacentImages();
		}
	});

	$effect(() => {
		console.log('🎯 Current index changed to:', currentIndex);
		preloadAdjacentImages();
	});

	$effect(() => {
		if (isPlaying && canNavigate) {
			startAutoplay();
		} else {
			stopAutoplay();
		}

		return () => {
			if (autoplayTimer) {
				clearInterval(autoplayTimer);
			}
		};
	});

	$effect(() => {
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			document.removeEventListener('keydown', handleKeyDown);
		};
	});
</script>

<div
	class="slideshow-preview"
	class:fullscreen={isFullscreen}
	class:playing={isPlaying}
	class:loading={isLoading}
	bind:this={slideshowContainer}
	role="img"
	aria-label="Photo slideshow"
	aria-roledescription="slideshow"
	tabindex="0"
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
>
	{#if hasError}
		<div class="error-state" role="alert">
			<svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
			</svg>
			<h3>Unable to load images</h3>
			<p>Please check your internet connection and try again.</p>
		</div>
	{:else if !hasPhotos}
		<div class="empty-state">
			<svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
				<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
			</svg>
			<h3>No photos to display</h3>
			<p>Add some photos to start the slideshow.</p>
		</div>
	{:else}
		<!-- 🖼️ Main slideshow area -->
		<div class="slideshow-main">
			<div class="slides-container transition-{transition}">
				{#each photos as photo, index (photo)}
					<div 
						class="slide"
						class:active={index === currentIndex}
						class:prev={index === (currentIndex === 0 ? totalPhotos - 1 : currentIndex - 1)}
						class:next={index === (currentIndex + 1) % totalPhotos}
						style="--slide-index: {index}; --current-index: {currentIndex};"
					>
						<img 
							src={photo} 
							alt="Slide {index + 1} of {totalPhotos}"
							loading={index <= currentIndex + 1 ? 'eager' : 'lazy'}
							class:kenburns={transition === 'kenburns' && index === currentIndex}
						/>
						
						{#if isLoading && index === currentIndex}
							<div class="slide-loading">
								<div class="loading-spinner"></div>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<!-- 🎮 Navigation controls -->
			{#if showControls && canNavigate}
				<button 
					class="nav-btn prev-btn"
					onclick={previousSlide}
					aria-label="Previous slide"
					type="button"
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
						<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
					</svg>
				</button>

				<button 
					class="nav-btn next-btn"
					onclick={nextSlide}
					aria-label="Next slide"
					type="button"
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
						<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
					</svg>
				</button>
			{/if}
		</div>

		<!-- 🎛️ Control bar -->
		{#if showControls}
			<div class="control-bar" class:visible={showControls}>
				<div class="control-group left">
					<button 
						class="control-btn play-pause-btn"
						onclick={togglePlayPause}
						aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
						type="button"
					>
						{#if isPlaying}
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
								<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
							</svg>
						{:else}
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
								<path d="M8 5v14l11-7z"/>
							</svg>
						{/if}
					</button>

					<div class="slide-counter" aria-live="polite">
						{currentIndex + 1} of {totalPhotos}
					</div>
				</div>

				<div class="control-group center">
					<div class="progress-container">
						<div 
							class="progress-bar"
							style="width: {progress}%"
							role="progressbar"
							aria-valuenow={currentIndex + 1}
							aria-valuemin="1"
							aria-valuemax={totalPhotos}
							aria-label="Slideshow progress"
						></div>
						<div class="progress-track"></div>
					</div>
				</div>

				<div class="control-group right">
					{#if allowFullscreen}
						<button 
							class="control-btn fullscreen-btn"
							onclick={toggleFullscreen}
							aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
							type="button"
						>
							{#if isFullscreen}
								<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
									<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
								</svg>
							{:else}
								<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
									<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
								</svg>
							{/if}
						</button>
					{/if}
				</div>
			</div>
		{/if}

		<!-- 📍 Thumbnail navigation (only in fullscreen) -->
		{#if isFullscreen && canNavigate}
			<div class="thumbnail-nav">
				{#each photos as photo, index}
					<button
						class="thumbnail"
						class:active={index === currentIndex}
						onclick={() => goToSlide(index)}
						aria-label="Go to slide {index + 1}"
						type="button"
					>
						<img src={photo} alt="Thumbnail {index + 1}" />
					</button>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.slideshow-preview {
		position: relative;
		width: 100%;
		height: 500px;
		background: #000;
		border-radius: 0.5rem;
		overflow: hidden;
		outline: none;
		user-select: none;
	}

	.slideshow-preview.fullscreen {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		border-radius: 0;
		z-index: 9999;
	}

	.slideshow-preview:focus {
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
	}

	/* 🚨 Error and empty states */
	.error-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #9ca3af;
		text-align: center;
		padding: 2rem;
	}

	.error-state svg,
	.empty-state svg {
		margin-bottom: 1rem;
		color: #ef4444;
	}

	.error-state h3,
	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #374151;
	}

	.error-state p,
	.empty-state p {
		margin: 0;
		color: #6b7280;
	}

	/* 🖼️ Main slideshow area */
	.slideshow-main {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.slides-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.slide {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		transition: all 0.5s ease-in-out;
		transform: scale(1.1);
	}

	.slide.active {
		opacity: 1;
		transform: scale(1);
		z-index: 2;
	}

	.slide img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s ease-in-out;
	}

	/* 🎭 Transition effects */
	.transition-fade .slide {
		transform: scale(1);
	}

	.transition-fade .slide.active {
		opacity: 1;
	}

	.transition-slide .slide {
		transform: translateX(100%);
		opacity: 1;
	}

	.transition-slide .slide.active {
		transform: translateX(0);
	}

	.transition-slide .slide.prev {
		transform: translateX(-100%);
	}

	.transition-zoom .slide {
		transform: scale(0.8);
		opacity: 0;
	}

	.transition-zoom .slide.active {
		transform: scale(1);
		opacity: 1;
	}

	.transition-kenburns .slide {
		transform: scale(1);
	}

	.transition-kenburns .slide.active {
		opacity: 1;
	}

	/* 🎬 Ken Burns effect */
	.slide img.kenburns {
		animation: kenburns 8s ease-in-out infinite alternate;
	}

	@keyframes kenburns {
		0% {
			transform: scale(1) translate(0, 0);
		}
		25% {
			transform: scale(1.1) translate(-2%, -1%);
		}
		50% {
			transform: scale(1.05) translate(1%, -2%);
		}
		75% {
			transform: scale(1.08) translate(-1%, 1%);
		}
		100% {
			transform: scale(1.03) translate(2%, -1%);
		}
	}

	/* 🔄 Loading state */
	.slide-loading {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 3;
	}

	.loading-spinner {
		width: 3rem;
		height: 3rem;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top: 3px solid #fff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* 🎮 Navigation buttons */
	.nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 3rem;
		height: 3rem;
		background: rgba(0, 0, 0, 0.5);
		border: none;
		border-radius: 50%;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		z-index: 10;
		opacity: 0;
	}

	.slideshow-preview:hover .nav-btn,
	.slideshow-preview:focus .nav-btn {
		opacity: 1;
	}

	.nav-btn:hover {
		background: rgba(0, 0, 0, 0.8);
		transform: translateY(-50%) scale(1.1);
	}

	.prev-btn {
		left: 1rem;
	}

	.next-btn {
		right: 1rem;
	}

	/* 🎛️ Control bar */
	.control-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
		padding: 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		opacity: 0;
		transition: opacity 0.3s ease;
		z-index: 10;
	}

	.slideshow-preview:hover .control-bar,
	.slideshow-preview:focus .control-bar,
	.control-bar.visible {
		opacity: 1;
	}

	.control-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.control-group.center {
		flex: 1;
		justify-content: center;
	}

	.control-btn {
		width: 2.5rem;
		height: 2.5rem;
		background: rgba(255, 255, 255, 0.2);
		border: none;
		border-radius: 50%;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}

	.control-btn:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(1.1);
	}

	.slide-counter {
		color: white;
		font-size: 0.875rem;
		font-weight: 500;
		min-width: 4rem;
		text-align: center;
	}

	/* 📊 Progress bar */
	.progress-container {
		position: relative;
		width: 200px;
		height: 4px;
		background: rgba(255, 255, 255, 0.3);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		background: #3b82f6;
		border-radius: 2px;
		transition: width 0.3s ease;
	}

	.progress-track {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: transparent;
		cursor: pointer;
	}

	/* 📍 Thumbnail navigation */
	.thumbnail-nav {
		position: absolute;
		bottom: 5rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 0.5rem;
		background: rgba(0, 0, 0, 0.5);
		padding: 0.5rem;
		border-radius: 0.5rem;
		max-width: 80%;
		overflow-x: auto;
		z-index: 10;
	}

	.thumbnail {
		width: 4rem;
		height: 3rem;
		border: 2px solid transparent;
		border-radius: 0.25rem;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.3s ease;
		flex-shrink: 0;
	}

	.thumbnail:hover {
		border-color: rgba(255, 255, 255, 0.5);
		transform: scale(1.05);
	}

	.thumbnail.active {
		border-color: #3b82f6;
		transform: scale(1.1);
	}

	.thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* 📱 Mobile responsive */
	@media (max-width: 768px) {
		.slideshow-preview {
			height: 300px;
		}

		.nav-btn {
			width: 2.5rem;
			height: 2.5rem;
		}

		.prev-btn {
			left: 0.5rem;
		}

		.next-btn {
			right: 0.5rem;
		}

		.control-bar {
			padding: 0.75rem;
		}

		.control-btn {
			width: 2rem;
			height: 2rem;
		}

		.progress-container {
			width: 120px;
		}

		.slide-counter {
			font-size: 0.75rem;
			min-width: 3rem;
		}

		.thumbnail-nav {
			bottom: 4rem;
			max-width: 90%;
		}

		.thumbnail {
			width: 3rem;
			height: 2rem;
		}
	}

	/* ♿ Accessibility improvements */
	@media (prefers-reduced-motion: reduce) {
		.slide,
		.slide img,
		.nav-btn,
		.control-btn,
		.thumbnail,
		.progress-bar {
			transition: none;
		}

		.slide img.kenburns {
			animation: none;
		}

		.loading-spinner {
			animation: none;
		}
	}

	@media (prefers-contrast: high) {
		.nav-btn,
		.control-btn {
			background: rgba(0, 0, 0, 0.9);
			border: 2px solid white;
		}

		.control-bar {
			background: linear-gradient(transparent, rgba(0, 0, 0, 0.95));
		}

		.thumbnail {
			border-width: 3px;
		}
	}

	/* 🌙 Dark mode support */
	@media (prefers-color-scheme: dark) {
		.error-state h3,
		.empty-state h3 {
			color: #f3f4f6;
		}

		.error-state p,
		.empty-state p {
			color: #9ca3af;
		}
	}
</style>