<script lang="ts">
	import { onMount } from 'svelte';
	import DailyIframe from '@daily-co/daily-js';
	import { Button, Card, Badge } from '$lib/components/minimal-modern';
	import { 
		Mic, MicOff, Video as VideoIcon, VideoOff, 
		Monitor, Smartphone, Share2, QrCode, 
		Radio, Power
	} from 'lucide-svelte';
	
	let { data } = $props();

	// --- State ---
	let isLive = $state(false);
	let liveDuration = $state(0);
	let participantCount = $state(0);
	let activeSpeakerId = $state<string | null>(null);
	
	// Mock participants for UI dev
	let participants = $state<any[]>([
		{ id: 'local', name: 'Admin (You)', type: 'admin', hasVideo: true, hasAudio: true },
		// { id: 'p1', name: 'Camera A', type: 'camera', hasVideo: true, hasAudio: true },
		// { id: 'p2', name: 'Camera B', type: 'camera', hasVideo: true, hasAudio: false },
	]);

	// --- Layout Helpers ---
	function formatDuration(seconds: number) {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	// --- Actions ---
	function toggleBroadcast() {
		isLive = !isLive;
		// TODO: Implement API call to start/stop Daily HLS
	}

	function switchCamera(id: string) {
		console.log('Switching to camera:', id);
		activeSpeakerId = id;
		// TODO: Implement Daily setVideoPriority / setStrictBroadcasting
	}

	function copyJoinLink() {
		// TODO: Generate link
		alert('Copied Join Link to clipboard');
	}

</script>

<div class="min-h-screen bg-gray-900 text-white flex flex-col">
	
	<!-- 1. HEADER -->
	<header class="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
		<div class="flex items-center gap-4">
			<div class="bg-gray-700 p-2 rounded">
				<Monitor size={20} class="text-gray-400" />
			</div>
			<div>
				<h1 class="font-bold text-lg">{data.memorial.name}</h1>
				<div class="text-xs text-gray-400 flex items-center gap-2">
					<span class="w-2 h-2 rounded-full {isLive ? 'bg-red-500' : 'bg-gray-500'}"></span>
					{isLive ? 'LIVE BROADCAST' : 'OFFLINE'}
					{#if isLive}
						<span class="font-mono ml-2">{formatDuration(liveDuration)}</span>
					{/if}
				</div>
			</div>
		</div>

		<div class="flex items-center gap-4">
			<div class="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
				<Smartphone size={16} class="text-gray-400" />
				<span class="text-sm font-medium">{participants.length} Sources</span>
			</div>
			
			<button 
				class="flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all
				{isLive 
					? 'bg-red-500/10 text-red-500 border border-red-500 hover:bg-red-500 hover:text-white' 
					: 'bg-red-600 text-white hover:bg-red-700'}"
				onclick={toggleBroadcast}
			>
				{#if isLive}
					<Power size={18} /> END STREAM
				{:else}
					<Radio size={18} /> GO LIVE
				{/if}
			</button>
		</div>
	</header>

	<!-- 2. MAIN CONTENT (Program & Previews) -->
	<main class="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
		
		<!-- PROGRAM MONITOR (Top) -->
		<div class="flex-1 flex justify-center min-h-0">
			<div class="aspect-video bg-black rounded-lg border border-gray-800 shadow-2xl relative w-full max-w-5xl overflow-hidden group">
				<!-- Placeholder for Active Video -->
				<div class="absolute inset-0 flex items-center justify-center text-gray-600">
					{#if activeSpeakerId}
						<div class="text-center">
							<VideoIcon size={64} class="mx-auto mb-4 opacity-50" />
							<p>Active Feed: {participants.find(p => p.id === activeSpeakerId)?.name}</p>
						</div>
					{:else}
						<p>Select a source below to preview</p>
					{/if}
				</div>
				
				<!-- Program Badge -->
				<div class="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
					PROGRAM OUT
				</div>
			</div>
		</div>

		<!-- SOURCE TRAY (Bottom) -->
		<div class="h-48 flex gap-4 overflow-x-auto pb-2 px-2">
			
			<!-- ADD SOURCE CARD -->
			<button 
				class="flex-shrink-0 w-64 bg-gray-800 rounded-lg border border-dashed border-gray-600 hover:border-gray-400 hover:bg-gray-750 flex flex-col items-center justify-center gap-2 transition-all text-gray-400 hover:text-white group"
				onclick={copyJoinLink}
			>
				<div class="p-3 rounded-full bg-gray-700 group-hover:bg-gray-600">
					<QrCode size={24} />
				</div>
				<span class="text-sm font-medium">Connect Camera</span>
				<span class="text-xs text-gray-500">Scan QR or Copy Link</span>
			</button>

			<!-- CAMERA PREVIEWS -->
			{#each participants as p}
				<button 
					class="flex-shrink-0 w-64 bg-black rounded-lg border-2 overflow-hidden relative transition-all
					{activeSpeakerId === p.id 
						? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
						: 'border-gray-700 hover:border-gray-500'}"
					onclick={() => switchCamera(p.id)}
				>
					<!-- Mock Video Feed -->
					<div class="absolute inset-0 bg-gray-800 flex items-center justify-center">
						<Smartphone size={32} class="text-gray-600" />
					</div>

					<!-- Label Overlay -->
					<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 flex justify-between items-end">
						<div class="text-left">
							<div class="text-sm font-bold truncate">{p.name}</div>
							<div class="text-xs text-gray-400 flex items-center gap-1">
								{#if p.hasAudio} <Mic size={10} /> {:else} <MicOff size={10} class="text-red-400" /> {/if}
								{p.type}
							</div>
						</div>
						{#if activeSpeakerId === p.id}
							<div class="text-[10px] bg-red-600 px-1.5 py-0.5 rounded font-bold">LIVE</div>
						{/if}
					</div>
				</button>
			{/each}

		</div>

	</main>
</div>

<style>
	/* Custom Scrollbar for Tray */
	::-webkit-scrollbar {
		height: 8px;
	}
	::-webkit-scrollbar-track {
		background: #1f2937; 
	}
	::-webkit-scrollbar-thumb {
		background: #374151; 
		border-radius: 4px;
	}
	::-webkit-scrollbar-thumb:hover {
		background: #4b5563; 
	}
</style>
