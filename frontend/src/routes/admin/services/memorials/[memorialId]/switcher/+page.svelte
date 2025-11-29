<script lang="ts">
	import { onMount } from 'svelte';
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
	let activeSpeakerId = $state<string | null>(null);
	let daily: any = null; // DailyIframe instance
	let participants = $state<any[]>([]);
	let hlsUrl = $state<string | null>(null);
	let liveTimer: ReturnType<typeof setInterval> | null = null;
	let isLoading = $state(false);
	
	// Derived
	let participantCount = $derived(participants.length);

	onMount(async () => {
		// Dynamically import DailyIframe
		const DailyIframe = (await import('@daily-co/daily-js')).default;
		
		if (!data.dailyConfig?.roomUrl) {
			console.error('No Daily Room URL found');
			return;
		}

		// Initialize Daily Call Object (Headless)
		// We use createCallObject because we are rendering custom video elements
		daily = DailyIframe.createCallObject({
			url: data.dailyConfig.roomUrl,
			token: data.dailyConfig.token,
			subscribeToTracksAutomatically: true
		});

		// Event Listeners
		daily
			.on('joined-meeting', updateParticipants)
			.on('participant-joined', updateParticipants)
			.on('participant-updated', updateParticipants)
			.on('participant-left', updateParticipants)
			.on('active-speaker-change', (e: any) => {
				// If we haven't manually overridden, follow the active speaker
				// activeSpeakerId = e.activeSpeaker.peerId; 
				// actually we want to control it manually usually
			})
			.on('error', (e: any) => console.error('Daily Error:', e));

		// Join the room
		await daily.join();
		console.log('Joined Daily room as Admin');
	});

	function updateParticipants() {
		if (!daily) return;
		const p = daily.participants();
		participants = Object.values(p).map((p: any) => ({
			id: p.session_id,
			name: p.user_name || 'Guest',
			type: p.local ? 'admin' : 'camera',
			hasVideo: p.video,
			hasAudio: p.audio,
			local: p.local,
			// We need the track for rendering
			videoTrack: p.tracks.video.persistentTrack,
			audioTrack: p.tracks.audio.persistentTrack
		}));
	}
	
	// --- Actions ---
	/**
	 * Per Daily.co docs: Use client SDK callFrame.startLiveStreaming() 
	 * The caller must have "streaming admin" or room-owner privileges (is_owner: true in token)
	 * 
	 * For RTMP: provide rtmpUrl
	 * For HLS: requires streaming_endpoints configured on room, then use endpoint param
	 * 
	 * Since HLS requires S3 bucket config, we'll use RTMP to a service OR
	 * Daily's built-in HLS which returns an hls_url in the response
	 */
	async function toggleBroadcast() {
		if (isLoading || !daily) return;
		isLoading = true;

		try {
			if (!isLive) {
				// START streaming using Daily client SDK
				// Per docs: callFrame.startLiveStreaming({ layout: { preset: 'active-participant' } })
				const streamResult = await daily.startLiveStreaming({
					layout: {
						preset: 'active-participant' // Shows active speaker with others in sidebar
					}
					// Note: Without rtmpUrl or endpoint, Daily may not produce output
					// For production, configure streaming_endpoints on room for HLS
					// OR provide rtmpUrl to stream to YouTube/Twitch/etc
				});
				
				console.log('🔴 startLiveStreaming result:', streamResult);
				
				isLive = true;
				liveDuration = 0;
				liveTimer = setInterval(() => {
					liveDuration++;
				}, 1000);

				// Update Firestore via API
				await fetch('/api/admin/switcher/broadcast', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ 
						memorialId: data.memorial.id, 
						action: 'start',
						hlsUrl: streamResult?.hls_url || null
					})
				});

				if (streamResult?.hls_url) {
					hlsUrl = streamResult.hls_url;
				}

			} else {
				// STOP streaming using Daily client SDK
				await daily.stopLiveStreaming();
				console.log('⚪ Stream stopped');
				
				isLive = false;
				hlsUrl = null;
				if (liveTimer) {
					clearInterval(liveTimer);
					liveTimer = null;
				}

				// Update Firestore via API
				await fetch('/api/admin/switcher/broadcast', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ 
						memorialId: data.memorial.id, 
						action: 'stop'
					})
				});
			}
		} catch (err) {
			console.error('Broadcast toggle error:', err);
			alert('Failed to toggle broadcast: ' + (err as Error).message);
		} finally {
			isLoading = false;
		}
	}

	// --- Layout Helpers ---
	function formatDuration(seconds: number) {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	function switchCamera(id: string) {
		console.log('Switching to camera:', id);
		activeSpeakerId = id;
		
		// Per Daily docs: Use updateLiveStreaming to change layout mid-stream
		// preset: 'single-participant' focuses on one participant
		if (daily && isLive) {
			daily.updateLiveStreaming({
				layout: {
					preset: 'single-participant',
					session_id: id // Focus on this participant
				}
			}).then(() => {
				console.log('✅ Layout updated to focus on:', id);
			}).catch((err: Error) => {
				console.error('Failed to update layout:', err);
			});
		}
	}

	async function generateInvite(label: string) {
		const res = await fetch('/api/admin/switcher/invite', {
			method: 'POST',
			body: JSON.stringify({ 
				memorialId: data.memorial.id, 
				cameraLabel: label 
			})
		});
		const json = await res.json();
		if (json.joinUrl) {
			navigator.clipboard.writeText(json.joinUrl);
			alert(`Copied Link for ${label}`);
		}
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
				<span class="text-sm font-medium">{participantCount} Sources</span>
			</div>
			
			<button 
				class="flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all
				{isLive 
					? 'bg-red-500/10 text-red-500 border border-red-500 hover:bg-red-500 hover:text-white' 
					: 'bg-red-600 text-white hover:bg-red-700'}
				{isLoading ? 'opacity-50 cursor-not-allowed' : ''}"
				onclick={toggleBroadcast}
				disabled={isLoading}
			>
				{#if isLoading}
					<span class="animate-spin">⏳</span> {isLive ? 'STOPPING...' : 'STARTING...'}
				{:else if isLive}
					<Power size={18} /> END STREAM
				{:else}
					<Radio size={18} /> GO LIVE
				{/if}
			</button>
		</div>
	</header>

	<!-- HLS URL Banner (when live) -->
	{#if isLive && hlsUrl}
		<div class="bg-green-900/50 border-b border-green-700 px-4 py-2 flex items-center justify-between">
			<div class="flex items-center gap-2 text-green-400 text-sm">
				<span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
				<span>HLS Stream Active</span>
			</div>
			<div class="flex items-center gap-2">
				<code class="text-xs bg-black/30 px-2 py-1 rounded text-green-300 max-w-md truncate">{hlsUrl}</code>
				<button 
					class="text-xs bg-green-700 hover:bg-green-600 px-2 py-1 rounded text-white"
					onclick={() => {
						navigator.clipboard.writeText(hlsUrl || '');
						alert('HLS URL copied!');
					}}
				>
					Copy
				</button>
			</div>
		</div>
	{/if}

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
							<p>Active Feed: {participants.find(p => p.id === activeSpeakerId)?.name || 'Unknown'}</p>
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
				onclick={() => generateInvite('Camera ' + (participants.length + 1))}
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
					<!-- Mock Video Feed (Real video would go here) -->
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
