/**
 * DAILY CLIENT UTILITIES
 * =======================
 * 
 * Helper functions for initializing and managing Daily.co video calls.
 * Handles call object creation, room joining, event listeners, and track subscription.
 * 
 * Key Concepts:
 * - Call Object: Headless Daily.co instance (no UI, full control)
 * - Manual Track Subscription: CRITICAL for bandwidth management
 * - Event Listeners: React to participant changes and track events
 * - Track States: playable, loading, interrupted, blocked, off
 * 
 * Bandwidth Optimization:
 * - subscribeToTracksAutomatically: false (CRITICAL)
 * - Manual subscription per participant
 * - Simulcast layer selection (low for multiview, high for program)
 * 
 * @see https://docs.daily.co/reference/daily-js/instance-methods
 */

import Daily, { type DailyCall } from '@daily-co/daily-js';
import {
	setDailyCall,
	updateParticipants,
	setConnectionState,
	setError,
	resetStores,
	type DailyParticipant
} from '$lib/stores/daily-switcher';

/**
 * DAILY CALL INITIALIZATION
 * ==========================
 */

/**
 * Creates and configures a Daily call object with optimal switcher settings
 * 
 * Configuration Rationale:
 * - subscribeToTracksAutomatically: false
 *   → CRITICAL: Prevents bandwidth saturation with multiple sources
 *   → We manually subscribe only when needed
 * 
 * - audioSource: false, videoSource: false
 *   → Admin doesn't send media, only receives
 *   → Reduces bandwidth usage
 * 
 * - receiveSettings: Controls default quality
 *   → We'll override per-participant for fine control
 * 
 * @returns Configured Daily call object
 */
export function createDailyCallObject(): DailyCall {
	console.log('\n🎬 [DAILY CLIENT] Creating Daily call object...');
	console.log('=====================================');
	
	try {
		const call = Daily.createCallObject({
			// CRITICAL: Manual track subscription for bandwidth control
			subscribeToTracksAutomatically: false,
			
			// Admin doesn't send media
			audioSource: false,
			videoSource: false
		});
		
		console.log('✅ [DAILY CLIENT] Call object created successfully');
		console.log('   Configuration:');
		console.log('   - Auto-subscribe: false (manual control)');
		console.log('   - Audio source: false (admin receives only)');
		console.log('   - Video source: false (admin receives only)');
		console.log('=====================================\n');
		
		return call;
		
	} catch (error) {
		console.error('❌ [DAILY CLIENT] Failed to create call object');
		console.error('   Error:', error);
		console.error('=====================================\n');
		throw error;
	}
}

/**
 * ROOM CONNECTION
 * ===============
 */

/**
 * Joins a Daily room with the provided URL and token
 * Sets up event listeners before joining
 * 
 * @param call - Daily call object
 * @param roomUrl - Full room URL (e.g., https://domain.daily.co/room-name)
 * @param token - Meeting token for authentication
 */
export async function joinRoom(
	call: DailyCall, 
	roomUrl: string, 
	token: string
): Promise<void> {
	console.log('\n🚪 [DAILY CLIENT] Joining Daily room...');
	console.log('=====================================');
	console.log(`   Room URL: ${roomUrl}`);
	console.log(`   Token: ${token.substring(0, 20)}...`);
	
	try {
		// Update connection state
		setConnectionState('connecting');
		console.log('   Status: Connecting...');
		
		// Set up event listeners BEFORE joining
		setupEventListeners(call);
		
		// Join the room
		console.log('   Initiating join...');
		const participants = await call.join({ 
			url: roomUrl, 
			token: token 
		});
		
		console.log('✅ [DAILY CLIENT] Successfully joined room');
		console.log(`   Participants in room: ${participants ? Object.keys(participants).length : 0}`);
		console.log('=====================================\n');
		
		// Update connection state
		setConnectionState('connected');
		
		// Store the call object
		setDailyCall(call);
		
		// Update initial participants list
		updateParticipantsList(call);
		
	} catch (error) {
		console.error('❌ [DAILY CLIENT] Failed to join room');
		console.error('   Error:', error);
		console.error('=====================================\n');
		
		setConnectionState('error');
		setError(error instanceof Error ? error.message : 'Failed to join room');
		throw error;
	}
}

/**
 * Leaves the current room and cleans up
 * 
 * @param call - Daily call object
 */
export async function leaveRoom(call: DailyCall): Promise<void> {
	console.log('\n🚪 [DAILY CLIENT] Leaving room...');
	console.log('=====================================');
	
	try {
		await call.leave();
		await call.destroy();
		
		console.log('✅ [DAILY CLIENT] Left room successfully');
		console.log('=====================================\n');
		
		// Reset all stores
		resetStores();
		setConnectionState('disconnected');
		
	} catch (error) {
		console.error('❌ [DAILY CLIENT] Error leaving room');
		console.error('   Error:', error);
		console.error('=====================================\n');
		
		// Reset stores anyway
		resetStores();
		setConnectionState('error');
	}
}

/**
 * EVENT LISTENERS
 * ===============
 */

/**
 * Sets up all necessary event listeners for the switcher
 * 
 * Key Events:
 * - participant-joined: New source connects
 * - participant-left: Source disconnects
 * - participant-updated: Source state changes
 * - track-started: Video/audio track becomes available
 * - track-stopped: Video/audio track ends
 * - error: Connection or media errors
 */
function setupEventListeners(call: DailyCall): void {
	console.log('🎧 [DAILY CLIENT] Setting up event listeners...');
	
	// Participant joined
	call.on('participant-joined', (event) => {
		if (!event.participant) return;
		console.log(`\n👤 [DAILY CLIENT] Participant joined`);
		console.log(`   Session ID: ${event.participant.session_id}`);
		console.log(`   Name: ${event.participant.user_name}`);
		console.log(`   Owner: ${event.participant.owner}`);
		
		updateParticipantsList(call);
	});
	
	// Participant left
	call.on('participant-left', (event) => {
		if (!event.participant) return;
		console.log(`\n👤 [DAILY CLIENT] Participant left`);
		console.log(`   Session ID: ${event.participant.session_id}`);
		console.log(`   Name: ${event.participant.user_name}`);
		
		updateParticipantsList(call);
	});
	
	// Participant updated
	call.on('participant-updated', (event) => {
		console.log(`\n👤 [DAILY CLIENT] Participant updated`);
		console.log(`   Session ID: ${event.participant.session_id}`);
		console.log(`   Changes:`, Object.keys(event));
		
		updateParticipantsList(call);
	});
	
	// Track started (video/audio becomes available)
	call.on('track-started', (event) => {
		if (!event.participant) return;
		console.log(`\n🎬 [DAILY CLIENT] Track started`);
		console.log(`   Participant: ${event.participant.session_id}`);
		console.log(`   Track type: ${event.track.kind}`);
		console.log(`   Track state: ${event.track.readyState}`);
		
		// Attach track to video element
		attachTrackToElementInternal(event);
	});
	
	// Track stopped
	call.on('track-stopped', (event) => {
		if (!event.participant) return;
		console.log(`\n🎬 [DAILY CLIENT] Track stopped`);
		console.log(`   Participant: ${event.participant.session_id}`);
		console.log(`   Track type: ${event.track.kind}`);
	});
	
	// Network quality change
	call.on('network-quality-change', (event: any) => {
		const quality = event.threshold;
		if (quality === 'low' || quality === 'very-low') {
			console.warn(`⚠️  [DAILY CLIENT] Poor network quality detected`);
			console.warn(`   Quality: ${quality}`);
		}
	});
	
	// Error events
	call.on('error', (event) => {
		console.error(`❌ [DAILY CLIENT] Error event`);
		console.error(`   Error:`, event.errorMsg);
		setError(event.errorMsg);
	});
	
	// Connection state changes
	call.on('joining-meeting', () => {
		console.log('🔄 [DAILY CLIENT] Joining meeting...');
		setConnectionState('connecting');
	});
	
	call.on('joined-meeting', () => {
		console.log('✅ [DAILY CLIENT] Joined meeting');
		setConnectionState('connected');
	});
	
	call.on('left-meeting', () => {
		console.log('🚪 [DAILY CLIENT] Left meeting');
		setConnectionState('disconnected');
	});
	
	console.log('✅ [DAILY CLIENT] All event listeners registered');
}

/**
 * PARTICIPANT MANAGEMENT
 * ======================
 */

/**
 * Updates the participants list in the store
 * Converts Daily's participant object to our format
 * 
 * @param call - Daily call object
 */
function updateParticipantsList(call: DailyCall): void {
	const participantsObj = call.participants();
	const participantsArray = Object.values(participantsObj) as DailyParticipant[];
	
	console.log(`\n📋 [DAILY CLIENT] Updating participants list`);
	console.log(`   Total participants: ${participantsArray.length}`);
	
	updateParticipants(participantsArray);
}

/**
 * TRACK SUBSCRIPTION
 * ==================
 */

/**
 * Subscribes to a participant's tracks with specified quality
 * 
 * Quality Levels:
 * - 'off': No subscription (zero bandwidth)
 * - 'low': Simulcast low layer (for multiview thumbnails)
 * - 'high': Full quality (for program monitor)
 * - 'staged': Connection ready but no data flow (instant activation)
 * 
 * @param call - Daily call object
 * @param sessionId - Participant session ID
 * @param quality - Desired quality level
 */
export function subscribeToParticipant(
	call: DailyCall,
	sessionId: string,
	quality: 'off' | 'low' | 'high' | 'staged'
): void {
	console.log(`\n📡 [DAILY CLIENT] Subscribing to participant`);
	console.log(`   Session ID: ${sessionId}`);
	console.log(`   Quality: ${quality}`);
	
	try {
		// Determine subscription config based on quality
		let videoSubscription: any;
		let audioSubscription: boolean;
		
		switch (quality) {
			case 'off':
				videoSubscription = false;
				audioSubscription = false;
				break;
			case 'low':
				// Request simulcast low layer for thumbnails
				videoSubscription = { layer: 0 };
				audioSubscription = true;
				break;
			case 'high':
				// Request full quality
				videoSubscription = true;
				audioSubscription = true;
				break;
			case 'staged':
				// Connection ready, no data flow
				videoSubscription = 'staged' as any;
				audioSubscription = true; // Keep audio active for staged
				break;
		}
		
		call.updateParticipant(sessionId, {
			setSubscribedTracks: {
				audio: audioSubscription,
				video: videoSubscription,
				screenVideo: false  // Don't need screen sharing
			}
		});
		
		console.log(`✅ [DAILY CLIENT] Subscription updated`);
		console.log(`   Video: ${JSON.stringify(videoSubscription)}`);
		console.log(`   Audio: ${audioSubscription}`);
		
	} catch (error) {
		console.error(`❌ [DAILY CLIENT] Subscription failed`);
		console.error(`   Error:`, error);
	}
}

/**
 * Subscribes to all remote participants for multiview
 * Uses low quality for bandwidth efficiency
 * 
 * @param call - Daily call object
 */
export function subscribeToAllParticipants(call: DailyCall): void {
	console.log(`\n📡 [DAILY CLIENT] Subscribing to all participants`);
	
	const participants = call.participants();
	const remoteParticipants = Object.values(participants).filter(
		(p: any) => !p.local
	);
	
	console.log(`   Remote participants: ${remoteParticipants.length}`);
	
	remoteParticipants.forEach((participant: any) => {
		subscribeToParticipant(call, participant.session_id, 'low');
	});
	
	console.log(`✅ [DAILY CLIENT] Subscribed to all participants`);
}

/**
 * VIDEO ELEMENT MANAGEMENT
 * =========================
 */

/**
 * Attaches a participant's track to the corresponding video element
 * Called automatically when a track starts (internal event handler)
 * 
 * Video elements must have ID format: video-{sessionId}
 * 
 * @param event - Track started event from Daily
 */
function attachTrackToElementInternal(event: any): void {
	const sessionId = event.participant.session_id;
	const trackKind = event.track.kind;
	
	console.log(`\n🎬 [DAILY CLIENT] Auto-attaching track from event`);
	console.log(`   Session ID: ${sessionId}`);
	console.log(`   Track kind: ${trackKind}`);
	
	// Only attach video tracks (audio is handled by Daily)
	if (trackKind !== 'video') {
		console.log(`   Skipping non-video track`);
		return;
	}
	
	// Find the video element
	const videoElement = document.getElementById(`video-${sessionId}`) as HTMLVideoElement;
	
	if (!videoElement) {
		console.warn(`⚠️  [DAILY CLIENT] Video element not found`);
		console.warn(`   Expected ID: video-${sessionId}`);
		return;
	}
	
	// Attach the track
	try {
		const stream = new MediaStream([event.track]);
		videoElement.srcObject = stream;
		
		console.log(`✅ [DAILY CLIENT] Track attached successfully`);
		console.log(`   Element ID: video-${sessionId}`);
		
	} catch (error) {
		console.error(`❌ [DAILY CLIENT] Failed to attach track`);
		console.error(`   Error:`, error);
	}
}

/**
 * Attaches a participant's video track to a specific video element
 * Exported version for manual track attachment (e.g., when switching sources)
 * 
 * @param call - Daily call object
 * @param sessionId - Session ID of participant
 * @param videoElementId - ID of video element to attach to
 */
export async function attachTrackToElement(
	call: DailyCall,
	sessionId: string,
	videoElementId: string
): Promise<void> {
	console.log(`\n🎬 [DAILY CLIENT] Manually attaching track`);
	console.log(`   Session ID: ${sessionId}`);
	console.log(`   Element ID: ${videoElementId}`);

	const participant = getParticipant(call, sessionId);
	if (!participant) {
		throw new Error(`Participant not found: ${sessionId}`);
	}

	const videoElement = document.getElementById(videoElementId) as HTMLVideoElement;
	if (!videoElement) {
		throw new Error(`Video element not found: ${videoElementId}`);
	}

	// Get the participant's video track
	const tracks = participant.tracks;
	if (!tracks?.video?.persistentTrack) {
		throw new Error(`No video track available for: ${sessionId}`);
	}

	try {
		const stream = new MediaStream([tracks.video.persistentTrack]);
		videoElement.srcObject = stream;
		
		console.log(`✅ [DAILY CLIENT] Track attached successfully`);
	} catch (error) {
		console.error(`❌ [DAILY CLIENT] Failed to attach track:`, error);
		throw error;
	}
}

/**
 * UTILITY FUNCTIONS
 * =================
 */

/**
 * Gets participant info by session ID
 * 
 * @param call - Daily call object
 * @param sessionId - Session ID to look up
 * @returns Participant object or undefined
 */
export function getParticipant(call: DailyCall, sessionId: string): any {
	const participants = call.participants();
	return participants[sessionId];
}

/**
 * Checks if a participant's video is playable
 * 
 * @param call - Daily call object
 * @param sessionId - Session ID to check
 * @returns true if video is playable
 */
export function isVideoPlayable(call: DailyCall, sessionId: string): boolean {
	const participant = getParticipant(call, sessionId);
	return participant?.tracks?.video?.state === 'playable';
}

/**
 * VCS COMPOSITION & STREAMING
 * ===========================
 * Functions for starting/stopping cloud-side video composition
 * and outputting to Cloudflare Stream via WHIP protocol.
 */

/**
 * Starts live streaming with VCS composition
 * Outputs mixed video to Cloudflare Stream via WHIP endpoint
 * 
 * @param call - Daily call object
 * @param whipUrl - WHIP endpoint URL for Cloudflare Stream
 * @param initialSourceId - Session ID of initial active source
 * @returns Promise that resolves when streaming starts
 */
export async function startLiveStreaming(
	call: DailyCall,
	whipUrl: string,
	initialSourceId?: string
): Promise<void> {
	console.log('\n🎥 [DAILY CLIENT] Starting live streaming with VCS...');
	console.log(`   WHIP URL: ${whipUrl}`);
	console.log(`   Initial source: ${initialSourceId || 'none (will use first available)'}`);

	try {
		// Build VCS composition configuration
		const compositionParams: any = {
			// Use single-participant mode (one source at a time)
			mode: 'single',
			videoSettings: {}
		};

		// If initial source specified, set it as preferred
		if (initialSourceId) {
			compositionParams.videoSettings.preferredParticipantIds = [initialSourceId];
			console.log(`   Setting initial source: ${initialSourceId}`);
		}

		// Start streaming with VCS configuration
		await call.startLiveStreaming({
			rtmpUrl: whipUrl, // Daily uses rtmpUrl for WHIP too
			layout: {
				preset: 'custom',
				composition_id: 'daily-baseline', // Use Daily's baseline composition
				composition_params: compositionParams
			}
		});

		console.log('✅ [DAILY CLIENT] Live streaming started successfully');
		console.log('   VCS is now composing and outputting via WHIP');
		console.log('   Cloudflare Stream should receive video shortly');
	} catch (err) {
		console.error('❌ [DAILY CLIENT] Failed to start live streaming');
		console.error('   Error:', err);
		throw err;
	}
}

/**
 * Updates VCS composition to switch to a different source
 * This performs the actual "cut" in the video switcher
 * 
 * @param call - Daily call object
 * @param sessionId - Session ID of the source to switch to
 */
export async function updateComposition(
	call: DailyCall,
	sessionId: string
): Promise<void> {
	console.log(`\n🔄 [DAILY CLIENT] Updating composition to source: ${sessionId}`);

	try {
		// Update the VCS composition to show the new source
		// Note: Using 'as any' to bypass TypeScript limitations with Daily's complex types
		await call.updateLiveStreaming({
			layout: {
				composition_params: {
					videoSettings: {
						preferredParticipantIds: [sessionId]
					}
				}
			}
		} as any);

		console.log('✅ [DAILY CLIENT] Composition updated successfully');
		console.log(`   Program output now showing: ${sessionId}`);
	} catch (err) {
		console.error('❌ [DAILY CLIENT] Failed to update composition');
		console.error('   Error:', err);
		throw err;
	}
}

/**
 * Stops live streaming and VCS composition
 * 
 * @param call - Daily call object
 */
export async function stopLiveStreaming(call: DailyCall): Promise<void> {
	console.log('\n🛑 [DAILY CLIENT] Stopping live streaming...');

	try {
		await call.stopLiveStreaming();
		console.log('✅ [DAILY CLIENT] Live streaming stopped');
	} catch (err) {
		console.error('❌ [DAILY CLIENT] Failed to stop live streaming');
		console.error('   Error:', err);
		throw err;
	}
}

/**
 * Gets the current live streaming state
 * 
 * @param call - Daily call object
 * @returns Streaming state object
 */
export function getStreamingState(call: DailyCall): any {
	const meetingState = call.meetingState();
	console.log(`📊 [DAILY CLIENT] Streaming state: ${JSON.stringify(meetingState)}`);
	return meetingState;
}

console.log('✅ [DAILY CLIENT] Module loaded successfully');
