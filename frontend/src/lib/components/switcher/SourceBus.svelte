<!--
  SOURCE BUS COMPONENT
  ====================
  
  Scrollable horizontal container displaying all video sources.
  Contains SourceCard components for each participant.
  
  Features:
  - Horizontal scrolling (no scrollbar visible)
  - Dynamic participant rendering
  - "Add Input" placeholder
  - Tools bar with view controls
  
  Props:
  - participants: Array of participants from Daily
  - activeSourceId: Currently active source session ID
  - pinnedAudioId: Pinned audio source session ID (null if none)
  - muteMap: Map of session IDs to mute states
  - onSourceSwitch: Callback when source is switched
  - onAudioPin: Callback when audio pin toggled
  - onMute: Callback when mute toggled
  
  @see SwitcherMockup.html lines 95-197 for design reference
-->

<script lang="ts">
	import SourceCard from './SourceCard.svelte';
	import type { DailyParticipant } from '$lib/stores/daily-switcher';

	// Props
	let { 
		participants = [],
		activeSourceId = null,
		pinnedAudioId = null,
		muteMap = {},
		onSourceSwitch = (sessionId: string) => {},
		onAudioPin = (sessionId: string) => {},
		onMute = (sessionId: string) => {}
	}: {
		participants?: DailyParticipant[];
		activeSourceId?: string | null;
		pinnedAudioId?: string | null;
		muteMap?: Record<string, boolean>;
		onSourceSwitch?: (sessionId: string) => void;
		onAudioPin?: (sessionId: string) => void;
		onMute?: (sessionId: string) => void;
	} = $props();

	/**
	 * Filter out local participant (admin)
	 * Only show remote sources
	 */
	const remoteSources = $derived(
		participants.filter(p => !p.local)
	);

	console.log('🎬 [SOURCE BUS] Component created');
</script>

<!--
  SOURCE BUS MARKUP
  =================
  Fixed height section at bottom
  Horizontal scrolling with hidden scrollbar
-->
<section class="h-auto bg-[#0a0a0a] border-t border-gray-800 flex flex-col shrink-0 z-30 pb-safe">
	
	<!-- Tools Bar -->
	<div class="h-10 flex items-center justify-between px-4 border-b border-gray-800 bg-gray-900/50">
		<span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
			Source Bus
		</span>
		
		<div class="flex gap-2">
			<!-- Future: Grid view toggle, etc. -->
			<button 
				class="hover:bg-gray-800 p-1.5 rounded text-gray-400 transition" 
				title="Grid View (coming soon)"
			>
				<svg 
					xmlns="http://www.w3.org/2000/svg" 
					class="w-3.5 h-3.5"
					viewBox="0 0 24 24" 
					fill="none" 
					stroke="currentColor" 
					stroke-width="2" 
					stroke-linecap="round" 
					stroke-linejoin="round"
				>
					<rect x="3" y="3" width="7" height="7"></rect>
					<rect x="14" y="3" width="7" height="7"></rect>
					<rect x="14" y="14" width="7" height="7"></rect>
					<rect x="3" y="14" width="7" height="7"></rect>
				</svg>
			</button>
		</div>
	</div>

	<!-- Scrollable Sources Container -->
	<div class="flex overflow-x-auto no-scrollbar p-3 gap-3">
		
		<!-- Render each remote participant as a SourceCard -->
		{#each remoteSources as participant (participant.session_id)}
			<SourceCard
				sessionId={participant.session_id}
				sourceName={participant.user_name}
				isActive={participant.session_id === activeSourceId}
				isPinned={participant.session_id === pinnedAudioId}
				isMuted={muteMap[participant.session_id] || false}
				onSwitch={() => onSourceSwitch(participant.session_id)}
				onPin={() => onAudioPin(participant.session_id)}
				onMute={() => onMute(participant.session_id)}
			/>
		{/each}

		<!-- Empty State (when no sources) -->
		{#if remoteSources.length === 0}
			<div class="flex-shrink-0 w-48 h-[154px] border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500">
				<svg 
					xmlns="http://www.w3.org/2000/svg" 
					class="w-8 h-8"
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
				<span class="text-[10px] font-medium text-center px-4">
					No sources connected<br/>
					<span class="text-gray-600">Scan QR code to add</span>
				</span>
			</div>
		{/if}

		<!-- Add New Source Placeholder (future) -->
		<div class="shrink-0 w-24 h-[154px] border-2 border-dashed border-gray-800 hover:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition hover:bg-gray-900 text-gray-600 hover:text-gray-400">
			<svg 
				xmlns="http://www.w3.org/2000/svg" 
				class="w-6 h-6"
				viewBox="0 0 24 24" 
				fill="none" 
				stroke="currentColor" 
				stroke-width="2" 
				stroke-linecap="round" 
				stroke-linejoin="round"
			>
				<line x1="12" y1="5" x2="12" y2="19"></line>
				<line x1="5" y1="12" x2="19" y2="12"></line>
			</svg>
			<span class="text-[10px] font-medium text-center">Add Input</span>
		</div>
	</div>
</section>

<style>
	/* Hide scrollbar for Chrome, Safari and Opera */
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}

	/* Hide scrollbar for IE, Edge and Firefox */
	.no-scrollbar {
		-ms-overflow-style: none;  /* IE and Edge */
		scrollbar-width: none;  /* Firefox */
	}

	/* Safe area padding for mobile devices */
	.pb-safe {
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
