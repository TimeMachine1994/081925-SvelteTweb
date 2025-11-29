<!--
  SWITCHER HEADER COMPONENT
  =========================
  
  Top header bar for the video switcher interface.
  
  Features:
  - Live indicator with pulse animation
  - Session information display
  - Real-time clock (HH:MM:SS format)
  - QR code button to connect phone sources
  - Settings button (future use)
  
  Props:
  - sessionId: Unique session identifier
  - isLive: Whether streaming is active
  - onQRClick: Callback to open QR modal
  
  @see SwitcherMockup.html lines 33-55 for design reference
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	// Props
	let {
		sessionId = '',
		isLive = false,
		onQRClick = () => {},
		onGoLive = () => {},
		onStopLive = () => {}
	}: {
		sessionId?: string;
		isLive?: boolean;
		onQRClick?: () => void;
		onGoLive?: () => void;
		onStopLive?: () => void;
	} = $props();

	// Local state for clock
	let currentTime = $state('00:00:00');
	let clockInterval: number | undefined;

	/**
	 * Updates the clock display every second
	 */
	function updateClock() {
		const now = new Date();
		currentTime = now.toLocaleTimeString('en-US', { 
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	/**
	 * Lifecycle - start clock on mount
	 */
	onMount(() => {
		console.log('🎬 [SWITCHER HEADER] Component mounted');
		updateClock();
		clockInterval = window.setInterval(updateClock, 1000);
	});

	/**
	 * Lifecycle - cleanup clock on destroy
	 */
	onDestroy(() => {
		console.log('🧹 [SWITCHER HEADER] Component unmounting');
		if (clockInterval) {
			clearInterval(clockInterval);
		}
	});

	/**
	 * Handle QR button click
	 */
	function handleQRClick() {
		console.log('📱 [SWITCHER HEADER] QR button clicked');
		onQRClick();
	}
</script>

<!--
  HEADER MARKUP
  =============
  Height: 56px (h-14)
  Background: Dark gray with border
-->
<header class="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0 z-20 shadow-md">
	
	<!-- Left Section: Live Indicator + Session Info -->
	<div class="flex items-center gap-4">
		
		<!-- Live Indicator -->
		{#if isLive}
			<div class="flex items-center gap-2 bg-red-950/30 border border-red-900/50 px-2 py-1 rounded text-red-500 text-xs font-bold tracking-wider">
				<div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
				LIVE
			</div>
		{:else}
			<div class="flex items-center gap-2 bg-gray-800 border border-gray-700 px-2 py-1 rounded text-gray-400 text-xs font-bold tracking-wider">
				<div class="w-2 h-2 bg-gray-600 rounded-full"></div>
				OFFLINE
			</div>
		{/if}

		<!-- Divider -->
		<div class="h-4 w-px bg-gray-700"></div>

		<!-- Session Info + Clock -->
		<div class="flex flex-col">
			<span class="text-xs font-semibold text-gray-300">
				{#if sessionId}
					Session #{sessionId}
				{:else}
					No Session
				{/if}
			</span>
			<span class="text-[10px] text-gray-500 font-mono">{currentTime}</span>
		</div>
	</div>

	<!-- Right Section: Actions -->
	<div class="flex items-center gap-3">
		
		<!-- Go Live / Stop Live Button -->
		{#if isLive}
			<button 
				onclick={onStopLive}
				class="group flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-md text-xs font-bold tracking-wide transition-all shadow-lg shadow-red-900/30 active:scale-95"
			>
				<svg 
					xmlns="http://www.w3.org/2000/svg" 
					class="w-3.5 h-3.5"
					viewBox="0 0 24 24" 
					fill="currentColor"
				>
					<rect x="6" y="4" width="12" height="16" rx="2"></rect>
				</svg>
				<span>STOP LIVE</span>
			</button>
		{:else}
			<button 
				onclick={onGoLive}
				class="group flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-md text-xs font-bold tracking-wide transition-all shadow-lg shadow-green-900/30 active:scale-95"
			>
				<svg 
					xmlns="http://www.w3.org/2000/svg" 
					class="w-3.5 h-3.5 group-hover:scale-110 transition-transform"
					viewBox="0 0 24 24" 
					fill="currentColor"
				>
					<circle cx="12" cy="12" r="10"></circle>
				</svg>
				<span>GO LIVE</span>
			</button>
		{/if}

		<!-- Divider -->
		<div class="h-6 w-px bg-gray-700"></div>
		
		<!-- QR Code Button -->
		<button 
			onclick={handleQRClick}
			class="group flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95"
		>
			<!-- QR Icon -->
			<svg 
				xmlns="http://www.w3.org/2000/svg" 
				class="w-3.5 h-3.5 group-hover:scale-110 transition-transform"
				viewBox="0 0 24 24" 
				fill="none" 
				stroke="currentColor" 
				stroke-width="2" 
				stroke-linecap="round" 
				stroke-linejoin="round"
			>
				<rect x="3" y="3" width="5" height="5"></rect>
				<rect x="16" y="3" width="5" height="5"></rect>
				<rect x="3" y="16" width="5" height="5"></rect>
				<path d="M21 16h-3a2 2 0 0 0-2 2v3"></path>
				<path d="M21 21v.01"></path>
				<path d="M12 7v3a2 2 0 0 1-2 2H7"></path>
				<path d="M3 12h.01"></path>
				<path d="M12 3h.01"></path>
				<path d="M12 16v.01"></path>
				<path d="M16 12h1"></path>
				<path d="M21 12v.01"></path>
				<path d="M12 21v-1"></path>
			</svg>
			<span>Connect Phone</span>
		</button>

		<!-- Settings Button (future use) -->
		<button 
			class="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition"
			title="Settings (coming soon)"
		>
			<svg 
				xmlns="http://www.w3.org/2000/svg" 
				class="w-4 h-4"
				viewBox="0 0 24 24" 
				fill="none" 
				stroke="currentColor" 
				stroke-width="2" 
				stroke-linecap="round" 
				stroke-linejoin="round"
			>
				<circle cx="12" cy="12" r="3"></circle>
				<path d="M12 1v6m0 6v6"></path>
				<path d="m15.14 8.86 4.24-4.24M8.86 15.14l-4.24 4.24m10.92 0l-4.24-4.24M8.86 8.86L4.62 4.62"></path>
			</svg>
		</button>
	</div>
</header>

<style>
	/* Custom pulse animation for live indicator */
	@keyframes pulse {
		0%, 100% { 
			opacity: 1; 
		}
		50% { 
			opacity: 0.5; 
		}
	}
</style>
