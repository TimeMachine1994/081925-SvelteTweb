<!--
  PROGRAM MONITOR COMPONENT
  =========================
  
  Main stage display showing the current program output.
  This is what goes to the livestream.
  
  Features:
  - Large video element for active source
  - "Program Out" tally overlay
  - Fills available space (flex-1)
  - Object-contain for aspect ratio preservation
  
  Props:
  - videoElementId: DOM ID for the active video element
  - sourceName: Name of current active source (for accessibility)
  
  @see SwitcherMockup.html lines 58-92 for design reference
-->

<script lang="ts">
	// Props
	let { 
		videoElementId = 'program-video',
		sourceName = 'No Source'
	}: {
		videoElementId?: string;
		sourceName?: string;
	} = $props();

	console.log('🎬 [PROGRAM MONITOR] Component created');
	console.log(`   Video Element ID: ${videoElementId}`);
</script>

<!--
  MAIN STAGE MARKUP
  =================
  Flex-1: Takes all available vertical space
  Background: Pure black
  Centers content
-->
<main class="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
	
	<!-- Main Video Element -->
	<video
		id={videoElementId}
		autoplay
		playsinline
		muted
		class="w-full h-full object-contain transition-opacity duration-300"
		title={`Program output: ${sourceName}`}
	>
		<!-- Fallback for browsers that don't support video -->
		<div class="flex items-center justify-center h-full">
			<div class="text-center text-gray-500">
				<p class="text-sm">No video source available</p>
			</div>
		</div>
	</video>

	<!-- Tally Overlay (Program Out indicator) -->
	<div class="absolute top-4 right-4 flex items-center gap-2 pointer-events-none">
		<div class="bg-black/60 backdrop-blur text-white px-3 py-1 rounded border border-white/10 text-[10px] font-bold tracking-widest uppercase shadow-xl">
			Program Out
		</div>
	</div>

	<!-- Placeholder when no video -->
	<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
		<div class="text-center text-gray-700">
			<svg 
				xmlns="http://www.w3.org/2000/svg" 
				class="w-24 h-24 mx-auto mb-4 opacity-20"
				viewBox="0 0 24 24" 
				fill="none" 
				stroke="currentColor" 
				stroke-width="1" 
				stroke-linecap="round" 
				stroke-linejoin="round"
			>
				<rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
				<polyline points="17 2 12 7 7 2"></polyline>
			</svg>
			<p class="text-sm font-medium">Waiting for video source...</p>
			<p class="text-xs mt-1 opacity-60">Select a source from the bus below</p>
		</div>
	</div>
</main>
