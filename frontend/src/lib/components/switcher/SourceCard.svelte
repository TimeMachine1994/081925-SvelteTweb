<!--
  SOURCE CARD COMPONENT
  =====================
  
  Individual video source preview card with controls.
  Used in the source bus for switching between video sources.
  
  Features:
  - Video preview thumbnail (low quality for bandwidth)
  - Active/program state indicator (red border + badge)
  - Source name display
  - Pin audio button
  - Mute audio button
  - Click to switch to this source
  - Hover effects
  
  Props:
  - sessionId: Participant session ID
  - sourceName: Display name of source
  - isActive: Whether this is the active program source
  - isPinned: Whether audio is pinned to this source
  - isMuted: Whether this source is muted
  - onSwitch: Callback when source is clicked
  - onPin: Callback when pin button clicked
  - onMute: Callback when mute button clicked
  
  @see SwitcherMockup.html lines 111-188 for design reference
-->

<script lang="ts">
	// Props
	let { 
		sessionId,
		sourceName = 'Unknown Source',
		isActive = false,
		isPinned = false,
		isMuted = false,
		onSwitch = () => {},
		onPin = () => {},
		onMute = () => {}
	}: {
		sessionId: string;
		sourceName?: string;
		isActive?: boolean;
		isPinned?: boolean;
		isMuted?: boolean;
		onSwitch?: () => void;
		onPin?: () => void;
		onMute?: () => void;
	} = $props();

	/**
	 * Video element ID for this source
	 */
	const videoId = `source-preview-${sessionId}`;

	/**
	 * Handle source card click - switch to this source
	 */
	function handleSwitch() {
		console.log(`🎬 [SOURCE CARD] Switching to source: ${sourceName} (${sessionId})`);
		onSwitch();
	}

	/**
	 * Handle pin button click
	 */
	function handlePin(e: MouseEvent) {
		e.stopPropagation(); // Don't trigger switch
		console.log(`📌 [SOURCE CARD] Pin toggled for: ${sourceName} (${sessionId})`);
		onPin();
	}

	/**
	 * Handle mute button click
	 */
	function handleMute(e: MouseEvent) {
		e.stopPropagation(); // Don't trigger switch
		console.log(`🔇 [SOURCE CARD] Mute toggled for: ${sourceName} (${sessionId})`);
		onMute();
	}
</script>

<!--
  SOURCE CARD MARKUP
  ==================
  Width: 192px (w-48)
  Flex-shrink-0: Don't shrink in scrollable container
-->
<div class="relative group flex-shrink-0 w-48 flex flex-col gap-1.5">
	
	<!-- Video Preview Box -->
	<button
		onclick={handleSwitch}
		class="preview-box relative w-full h-28 bg-gray-800 rounded-lg overflow-hidden border-2 transition-all cursor-pointer
			{isActive 
				? 'border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]' 
				: 'border-transparent hover:border-gray-600'}"
		title="Click to switch to {sourceName}"
	>
		<!-- Video Element (attached by Daily client) -->
		<video
			id={videoId}
			autoplay
			playsinline
			muted
			class="w-full h-full object-cover transition duration-300
				{isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}"
		></video>

		<!-- Active Indicator Overlay -->
		{#if isActive}
			<div class="absolute inset-0 bg-red-500/10 pointer-events-none"></div>
		{/if}

		<!-- Program Badge (shown when active) -->
		{#if isActive}
			<div class="absolute top-1 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
				PGM
			</div>
		{/if}

		<!-- Placeholder when no video -->
		<div class="absolute inset-0 flex items-center justify-center pointer-events-none bg-gray-900">
			<svg 
				xmlns="http://www.w3.org/2000/svg" 
				class="w-8 h-8 text-gray-700"
				viewBox="0 0 24 24" 
				fill="none" 
				stroke="currentColor" 
				stroke-width="2" 
				stroke-linecap="round" 
				stroke-linejoin="round"
			>
				<rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
				<polyline points="17 2 12 7 7 2"></polyline>
			</svg>
		</div>
	</button>

	<!-- Control Bar -->
	<div class="flex items-center justify-between bg-gray-900 border rounded px-2 py-1.5
		{isActive ? 'border-red-900/30' : 'border-gray-800'}">
		
		<!-- Source Name -->
		<span class="text-xs font-medium truncate w-20 
			{isActive ? 'text-red-400 font-bold' : 'text-gray-300'}"
			title={sourceName}
		>
			{sourceName}
		</span>

		<!-- Action Buttons -->
		<div class="flex gap-1">
			
			<!-- Pin Audio Button -->
			<button
				onclick={handlePin}
				class="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-800 transition-colors
					{isPinned ? 'text-yellow-400' : 'text-gray-500'}"
				title={isPinned ? 'Unpin audio' : 'Pin audio to this source'}
			>
				<svg 
					xmlns="http://www.w3.org/2000/svg" 
					class="w-3 h-3"
					viewBox="0 0 24 24" 
					fill={isPinned ? 'currentColor' : 'none'}
					stroke="currentColor" 
					stroke-width="2" 
					stroke-linecap="round" 
					stroke-linejoin="round"
				>
					<path d="M12 17v5"></path>
					<path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path>
				</svg>
			</button>

			<!-- Mute Audio Button -->
			<button
				onclick={handleMute}
				class="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-800 transition-colors
					{isMuted ? 'text-red-400' : 'text-gray-500'}"
				title={isMuted ? 'Unmute' : 'Mute this source'}
			>
				<svg 
					xmlns="http://www.w3.org/2000/svg" 
					class="w-3 h-3"
					viewBox="0 0 24 24" 
					fill="none" 
					stroke="currentColor" 
					stroke-width="2" 
					stroke-linecap="round" 
					stroke-linejoin="round"
				>
					{#if isMuted}
						<!-- Mic off icon -->
						<line x1="1" y1="1" x2="23" y2="23"></line>
						<path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
						<path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
						<line x1="12" y1="19" x2="12" y2="22"></line>
					{:else}
						<!-- Mic on icon -->
						<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
						<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
						<line x1="12" y1="19" x2="12" y2="22"></line>
					{/if}
				</svg>
			</button>
		</div>
	</div>
</div>
