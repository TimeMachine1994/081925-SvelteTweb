<!--
  VIDEO SWITCHER - CLIENT INTERFACE (PHASE 3 - PRODUCTION UI)
  ============================================================
  
  Professional video switcher interface with component-based architecture.
  
  Phase 3 Goals:
  ✅ Component library (Header, Monitor, SourceBus, etc.)
  ✅ Professional UI matching mockup design
  ✅ Switching logic integration
  ✅ Audio pin/mute controls
  
  Future Phases:
  - Phase 4: VCS composition and streaming output
  - Phase 5: QR code system refinement
  
  @see SWITCHER_MVP_IMPLEMENTATION_PLAN.md for complete roadmap
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import type { DailyCall } from '@daily-co/daily-js';
	
	// Switcher UI Components
	import SwitcherHeader from '$lib/components/switcher/SwitcherHeader.svelte';
	import ProgramMonitor from '$lib/components/switcher/ProgramMonitor.svelte';
	import AudioMonitor from '$lib/components/switcher/AudioMonitor.svelte';
	import SourceBus from '$lib/components/switcher/SourceBus.svelte';
	import QRModal from '$lib/components/switcher/QRModal.svelte';
	
	// Daily client utilities
	import {
		createDailyCallObject,
		joinRoom,
		leaveRoom,
		subscribeToAllParticipants,
		subscribeToParticipant,
		startLiveStreaming,
		stopLiveStreaming,
		updateComposition,
		attachTrackToElement
	} from '$lib/utils/daily-client';
	
	// Svelte stores
	import {
		dailyCallStore,
		participantsStore,
		connectionStateStore,
		remoteParticipantsStore,
		activeSourceStore,
		pinnedAudioStore,
		muteMapStore,
		isStreamingStore,
		setActiveSource,
		toggleAudioPin,
		toggleMute,
		setStreaming
	} from '$lib/stores/daily-switcher';

	// Props from server load function
	let { data }: { data: PageData } = $props();

	console.log('\n🎬 [SWITCHER PAGE] Page mounted');
	console.log('=====================================');
	console.log('📦 Data received from server:', data);
	console.log('   Memorial:', data.memorial.lovedOneName);
	console.log('   Stream:', data.stream.title);
	console.log('   Room URL:', data.room.url);
	console.log('   Sources available:', data.sources.length);
	console.log('=====================================\n');

	// Component state
	let mounted = $state(false);
	let showQRModal = $state(false);
	let dailyCall: DailyCall | null = $state(null);

	/**
	 * Component lifecycle - runs after initial DOM render
	 * Initializes Daily.co and joins the room
	 */
	onMount(async () => {
		console.log('🚀 [SWITCHER PAGE] Component mounted');
		mounted = true;

		// Environment check
		console.log('\n🔍 [SWITCHER PAGE] Environment check:');
		console.log('   Window available:', typeof window !== 'undefined');
		console.log('   Navigator available:', typeof navigator !== 'undefined');
		console.log('   WebRTC supported:', typeof RTCPeerConnection !== 'undefined');

		// Initialize Daily.co
		await initializeDaily();
	});

	/**
	 * Auto-attach video tracks when participants' video becomes playable
	 * Runs reactively when participantsStore updates
	 */
	$effect(() => {
		// Only run in browser
		if (typeof window === 'undefined') return;
		
		const call = dailyCall;
		if (!call) return;

		const remoteParticipants = $participantsStore.filter(p => !p.local);
		
		remoteParticipants.forEach(async (participant) => {
			const videoElementId = `source-preview-${participant.session_id}`;
			const videoElement = document.getElementById(videoElementId);
			
			// Only attach if:
			// 1. Video element exists in DOM
			// 2. Video track is playable
			// 3. Video track is subscribed
			if (
				videoElement &&
				participant.tracks?.video?.state === 'playable' &&
				participant.tracks?.video?.subscribed
			) {
				try {
					await attachTrackToElement(call, participant.session_id, videoElementId);
					console.log(`✅ [SWITCHER PAGE] Auto-attached video: ${participant.user_name}`);
				} catch (err) {
					// Silent fail - tracks may already be attached
				}
			}
		});
	});

	/**
	 * Cleanup on component destroy
	 */
	onDestroy(async () => {
		console.log('🧹 [SWITCHER PAGE] Component unmounting, cleaning up...');
		
		if (dailyCall) {
			await leaveRoom(dailyCall);
		}
	});

	/**
	 * Initializes Daily.co and joins the room
	 */
	async function initializeDaily() {
		console.log('\n🎯 [SWITCHER PAGE] Initializing Daily.co...');
		console.log('=====================================');

		try {
			// Step 1: Create call object
			console.log('📋 Step 1: Creating Daily call object...');
			const call = createDailyCallObject();
			dailyCall = call;

			// Step 2: Join room
			console.log('📋 Step 2: Joining room...');
			await joinRoom(call, data.room.url, data.room.ownerToken);

			// Step 3: Subscribe to all participants for multiview
			console.log('📋 Step 3: Subscribing to participants...');
			// Wait a moment for participants to be fully loaded
			setTimeout(() => {
				subscribeToAllParticipants(call);
			}, 1000);

			console.log('✅ [SWITCHER PAGE] Daily.co initialization complete!');
			console.log('   Waiting for phone sources to connect...');
			console.log('=====================================\n');

		} catch (error) {
			console.error('❌ [SWITCHER PAGE] Failed to initialize Daily.co');
			console.error('   Error:', error);
			console.error('=====================================\n');
		}
	}

	/**
	 * SWITCHER CONTROL FUNCTIONS
	 * ==========================
	 */

	/**
	 * Opens QR code modal
	 */
	function openQRModal() {
		console.log('📱 [SWITCHER PAGE] Opening QR code modal');
		showQRModal = true;
	}

	/**
	 * Closes QR code modal
	 */
	function closeQRModal() {
		console.log('📱 [SWITCHER PAGE] Closing QR code modal');
		showQRModal = false;
	}

	/**
	 * Switch active video source
	 * Updates program output, track subscriptions, and VCS composition
	 */
	async function handleSourceSwitch(sessionId: string) {
		if (!dailyCall) return;

		console.log(`\n🔄 [SWITCHER PAGE] Switching to source: ${sessionId}`);
		console.log('=====================================');

		// Update active source in store
		setActiveSource(sessionId);

		// Subscribe to high quality for program output
		subscribeToParticipant(dailyCall, sessionId, 'high');

		// Subscribe others to low quality (or keep existing)
		const participants = $participantsStore.filter(p => !p.local);
		participants.forEach(p => {
			if (p.session_id !== sessionId) {
				subscribeToParticipant(dailyCall!, p.session_id, 'low');
			}
		});

		// Attach track to program monitor video element
		try {
			await attachTrackToElement(dailyCall, sessionId, 'program-video');
			console.log('   ✓ Video track attached to program monitor');
		} catch (err) {
			console.error('   ✗ Failed to attach video track:', err);
		}

		// If streaming, update VCS composition
		if ($isStreamingStore) {
			try {
				await updateComposition(dailyCall, sessionId);
				console.log('   ✓ VCS composition updated');
			} catch (err) {
				console.error('   ✗ Failed to update VCS composition:', err);
			}
		}

		console.log('✅ [SWITCHER PAGE] Source switched successfully');
		console.log('=====================================\n');
	}

	/**
	 * Toggle audio pin for a source
	 */
	function handleAudioPin(sessionId: string) {
		console.log(`📌 [SWITCHER PAGE] Toggling audio pin: ${sessionId}`);
		toggleAudioPin(sessionId);
		
		// TODO Phase 4: Update VCS audio routing
	}

	/**
	 * Toggle mute for a source
	 */
	function handleMute(sessionId: string) {
		console.log(`🔇 [SWITCHER PAGE] Toggling mute: ${sessionId}`);
		toggleMute(sessionId);
		
		// TODO Phase 4: Update VCS audio mixing
	}

	/**
	 * STREAMING CONTROL FUNCTIONS
	 * ===========================
	 */

	/**
	 * Starts live streaming to Cloudflare Stream via WHIP
	 * Initiates VCS composition with the current active source
	 */
	async function handleGoLive() {
		if (!dailyCall) {
			console.error('❌ [SWITCHER PAGE] Cannot go live: No Daily call object');
			return;
		}

		if ($isStreamingStore) {
			console.warn('⚠️  [SWITCHER PAGE] Already streaming');
			return;
		}

		console.log('\n🎥 [SWITCHER PAGE] Going live...');
		console.log('=====================================');

		try {
			// Get WHIP URL from server data
			const whipUrl = data.output.whipUrl;
			console.log(`   WHIP URL: ${whipUrl}`);

			// Determine initial source (current active or first remote)
			let initialSource = $activeSourceStore;
			if (!initialSource) {
				const remoteParticipants = $participantsStore.filter(p => !p.local);
				if (remoteParticipants.length > 0) {
					initialSource = remoteParticipants[0].session_id;
					setActiveSource(initialSource);
					console.log(`   Auto-selected first source: ${initialSource}`);
				}
			}

			if (!initialSource) {
				throw new Error('No sources available to stream');
			}

			// Start VCS streaming
			await startLiveStreaming(dailyCall, whipUrl, initialSource);

			// Update streaming state
			setStreaming(true);

			console.log('✅ [SWITCHER PAGE] Live streaming started');
			console.log('   Outputting to Cloudflare Stream via WHIP');
			console.log('=====================================\n');
		} catch (err) {
			console.error('❌ [SWITCHER PAGE] Failed to go live');
			console.error('   Error:', err);
			alert(`Failed to start streaming: ${err}`);
		}
	}

	/**
	 * Stops live streaming
	 */
	async function handleStopLive() {
		if (!dailyCall) return;

		if (!$isStreamingStore) {
			console.warn('⚠️  [SWITCHER PAGE] Not currently streaming');
			return;
		}

		console.log('\n🛑 [SWITCHER PAGE] Stopping live stream...');
		console.log('=====================================');

		try {
			await stopLiveStreaming(dailyCall);
			setStreaming(false);

			console.log('✅ [SWITCHER PAGE] Live streaming stopped');
			console.log('=====================================\n');
		} catch (err) {
			console.error('❌ [SWITCHER PAGE] Failed to stop streaming');
			console.error('   Error:', err);
			alert(`Failed to stop streaming: ${err}`);
		}
	}

	/**
	 * Derived values for UI
	 */
	const activeSourceName = $derived(() => {
		const activeSource = $participantsStore.find(p => p.session_id === $activeSourceStore);
		return activeSource?.user_name || 'No Source';
	});
	const audioSourceName = $derived(() => {
		// Use pinned audio if set, otherwise follow active video
		const audioId = $pinnedAudioStore || $activeSourceStore;
		const audioSource = $participantsStore.find(p => p.session_id === audioId);
		return audioSource?.user_name || 'No Audio';
	});
</script>

<!--
  PHASE 3 PROFESSIONAL SWITCHER UI
  =================================
  Component-based architecture matching SwitcherMockup.html design
-->
<div class="h-screen w-screen bg-black text-white flex flex-col overflow-hidden select-none">
	
	<!-- Switcher Header Component -->
	<SwitcherHeader
		sessionId={data.room.name}
		isLive={$isStreamingStore}
		onQRClick={openQRModal}
		onGoLive={handleGoLive}
		onStopLive={handleStopLive}
	/>

	<!-- Program Monitor with Audio Overlay -->
	<div class="relative flex-1">
		<ProgramMonitor
			videoElementId="program-video"
			sourceName={activeSourceName()}
		/>
		
		<!-- Audio Monitor Overlay -->
		<AudioMonitor
			sourceName={audioSourceName()}
			isPinned={$pinnedAudioStore !== null}
			level={70}
		/>
	</div>

	<!-- Source Bus (Bottom Rail) -->
	<SourceBus
		participants={$participantsStore}
		activeSourceId={$activeSourceStore}
		pinnedAudioId={$pinnedAudioStore}
		muteMap={$muteMapStore}
		onSourceSwitch={handleSourceSwitch}
		onAudioPin={handleAudioPin}
		onMute={handleMute}
	/>

	<!-- QR Code Modal -->
	<QRModal
		isOpen={showQRModal}
		sources={data.sources}
		onClose={closeQRModal}
	/>
</div>
