<!--
  AUDIO MONITOR COMPONENT
  =======================
  
  Overlay component showing current audio source and levels.
  Displays on top of the program monitor.
  
  Features:
  - Audio source name display
  - Visual VU meter animation
  - Microphone icon indicator
  - Semi-transparent backdrop
  - Animated audio level bars
  
  Props:
  - sourceName: Name of audio source
  - isPinned: Whether audio is pinned to specific source
  - level: Audio level 0-100 (for future real audio metering)
  
  @see SwitcherMockup.html lines 71-91 for design reference
-->

<script lang="ts">
	// Props
	let { 
		sourceName = 'No Audio',
		isPinned = false,
		level = 70
	}: {
		sourceName?: string;
		isPinned?: boolean;
		level?: number;
	} = $props();

	/**
	 * Derive audio level for display
	 * In future, this will use real WebAudio API data
	 */
	const displayLevel = $derived(Math.min(Math.max(level, 0), 100));
</script>

<!--
  AUDIO MONITOR OVERLAY
  =====================
  Positioned absolute bottom-left of parent
  Translucent black background with blur
-->
<div class="absolute bottom-6 left-6 transition-all duration-300 transform translate-y-0 opacity-100">
	<div class="bg-black/80 backdrop-blur-md pl-3 pr-4 py-2.5 rounded-lg border border-gray-800 flex items-center gap-3 shadow-2xl">
		
		<!-- Icon Container -->
		<div class="bg-green-500/10 p-1.5 rounded-md">
			<svg 
				xmlns="http://www.w3.org/2000/svg" 
				class="w-4 h-4 text-green-400"
				viewBox="0 0 24 24" 
				fill="none" 
				stroke="currentColor" 
				stroke-width="2" 
				stroke-linecap="round" 
				stroke-linejoin="round"
			>
				{#if isPinned}
					<!-- Pinned icon -->
					<path d="M12 1v6m0 6v6"></path>
					<path d="M17 8l-10 2"></path>
					<path d="M7 8l10 2"></path>
				{:else}
					<!-- Microphone icon -->
					<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
					<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
					<line x1="12" y1="19" x2="12" y2="22"></line>
				{/if}
			</svg>
		</div>

		<!-- Audio Info + Meters -->
		<div class="flex flex-col gap-1 w-32">
			
			<!-- Label + Level -->
			<div class="flex justify-between text-[9px] text-gray-400 font-bold uppercase tracking-wide">
				<span class="truncate max-w-[80px]" title={sourceName}>
					{#if isPinned}
						📌 {sourceName}
					{:else}
						Audio: {sourceName}
					{/if}
				</span>
				<span class="text-green-400 font-mono">
					-{Math.floor((100 - displayLevel) / 10)}dB
				</span>
			</div>

			<!-- VU Meter Bars (2 channels - stereo simulation) -->
			<!-- Left Channel -->
			<div class="h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden flex">
				<div 
					class="h-full bg-gradient-to-r from-green-600 via-green-400 to-yellow-400 transition-all duration-150 animate-pulse"
					style="width: {displayLevel}%"
				></div>
			</div>

			<!-- Right Channel (slightly different level for realism) -->
			<div class="h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden flex">
				<div 
					class="h-full bg-gradient-to-r from-green-600 via-green-400 to-yellow-400 transition-all duration-150 animate-pulse"
					style="width: {Math.max(displayLevel - 10, 0)}%; animation-delay: 75ms"
				></div>
			</div>
		</div>
	</div>
</div>

<style>
	/* Stagger animation for second bar */
	@keyframes pulse {
		0%, 100% { 
			opacity: 1; 
		}
		50% { 
			opacity: 0.7; 
		}
	}
</style>
