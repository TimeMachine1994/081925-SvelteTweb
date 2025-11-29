/**
 * DAILY SWITCHER - SVELTE STORES
 * ================================
 * 
 * Centralized state management for the Daily.co video switcher using Svelte 5 runes.
 * These stores track the Daily call object, participants, connection state, and UI state.
 * 
 * Key Concepts:
 * - Daily Call Object: The main Daily.co connection instance
 * - Participants: Array of all users in the room (admin + sources)
 * - Track Subscriptions: Controls which participants we're receiving video/audio from
 * - Connection State: Tracks room connection lifecycle
 * 
 * Architecture Pattern:
 * - Uses Svelte 5 $state() runes for reactivity
 * - Immutable updates for change detection
 * - Comprehensive logging for debugging
 * 
 * @see https://docs.daily.co/reference/daily-js/instance-methods
 */

import { writable, derived, type Writable } from 'svelte/store';
import type Daily from '@daily-co/daily-js';

/**
 * TYPE DEFINITIONS
 * ================
 */

/**
 * Participant state as provided by Daily.co
 * Contains all metadata about a user in the room
 */
export interface DailyParticipant {
	session_id: string;
	user_id: string;
	user_name: string;
	joined_at: Date;
	local: boolean;
	owner: boolean;
	audio: boolean;
	video: boolean;
	screen: boolean;
	tracks: {
		audio: {
			state: 'playable' | 'loading' | 'interrupted' | 'blocked' | 'off';
			subscribed: boolean | 'staged';
		};
		video: {
			state: 'playable' | 'loading' | 'interrupted' | 'blocked' | 'off';
			subscribed: boolean | 'staged';
		};
	};
}

/**
 * Connection state for room lifecycle
 */
export type ConnectionState = 
	| 'idle'           // Not connected
	| 'connecting'     // Joining room
	| 'connected'      // Successfully joined
	| 'error'          // Connection failed
	| 'disconnected';  // Left room

/**
 * Subscription state for bandwidth management
 * Controls quality level for each participant
 */
export type SubscriptionQuality = 'off' | 'low' | 'high' | 'staged';

/**
 * STORE INITIALIZATION
 * ====================
 */

// Initialize stores with default values and logging
console.log('🏪 [DAILY STORES] Initializing Svelte stores...');

/**
 * Daily Call Object Store
 * Holds the main Daily.co connection instance
 */
export const dailyCallStore: Writable<any | null> = writable(null);
console.log('   ✓ dailyCallStore initialized');

/**
 * Participants Store
 * Array of all participants in the room
 */
export const participantsStore: Writable<DailyParticipant[]> = writable([]);
console.log('   ✓ participantsStore initialized');

/**
 * Connection State Store
 * Tracks the current connection status
 */
export const connectionStateStore: Writable<ConnectionState> = writable('idle');
console.log('   ✓ connectionStateStore initialized');

/**
 * Active Source Store
 * Session ID of the currently active (on program) source
 */
export const activeSourceStore: Writable<string | null> = writable(null);
console.log('   ✓ activeSourceStore initialized');

/**
 * Active Audio Store
 * Session ID of the source currently providing audio
 */
export const activeAudioStore: Writable<string | null> = writable(null);
console.log('   ✓ activeAudioStore initialized');

/**
 * Pinned Audio Store
 * Session ID of pinned audio source (overrides audio-follows-video)
 */
export const pinnedAudioStore: Writable<string | null> = writable(null);
console.log('   ✓ pinnedAudioStore initialized');

/**
 * Mute Map Store
 * Tracks mute state for each participant
 * Key: session_id, Value: boolean (true = muted)
 */
export const muteMapStore: Writable<Record<string, boolean>> = writable({});
console.log('   ✓ muteMapStore initialized');

/**
 * Error Store
 * Holds any connection or operational errors
 */
export const errorStore: Writable<string | null> = writable(null);
console.log('   ✓ errorStore initialized');

/**
 * Streaming State Store
 * Indicates whether we're currently streaming to WHIP
 */
export const isStreamingStore: Writable<boolean> = writable(false);
console.log('   ✓ isStreamingStore initialized');

console.log('✅ [DAILY STORES] All stores initialized successfully\n');

/**
 * DERIVED STORES
 * ==============
 * Computed values based on primary stores
 */

/**
 * Remote Participants
 * Filters out the local participant (admin)
 */
export const remoteParticipantsStore = derived(
	participantsStore,
	($participants) => {
		const remote = $participants.filter(p => !p.local);
		console.log(`📊 [DAILY STORES] Remote participants: ${remote.length}`);
		return remote;
	}
);

/**
 * Active Participants
 * Participants with playable video tracks
 */
export const activeParticipantsStore = derived(
	participantsStore,
	($participants) => {
		const active = $participants.filter(p => 
			p.tracks?.video?.state === 'playable' && !p.local
		);
		console.log(`📊 [DAILY STORES] Active participants: ${active.length}`);
		return active;
	}
);

/**
 * Connection Status Message
 * Human-readable connection status
 */
export const connectionStatusStore = derived(
	connectionStateStore,
	($state) => {
		const messages: Record<ConnectionState, string> = {
			idle: 'Not connected',
			connecting: 'Connecting to room...',
			connected: 'Connected',
			error: 'Connection failed',
			disconnected: 'Disconnected'
		};
		return messages[$state];
	}
);

/**
 * STORE HELPER FUNCTIONS
 * =======================
 * Utility functions for updating stores with logging
 */

/**
 * Sets the Daily call object
 */
export function setDailyCall(call: any) {
	console.log('🔧 [DAILY STORES] Setting Daily call object');
	dailyCallStore.set(call);
}

/**
 * Updates the participants list
 * Logs changes for debugging
 */
export function updateParticipants(participants: DailyParticipant[]) {
	console.log(`🔧 [DAILY STORES] Updating participants list`);
	console.log(`   Total participants: ${participants.length}`);
	
	// Log each participant for debugging
	participants.forEach((p, index) => {
		console.log(`   ${index + 1}. ${p.user_name} (${p.session_id})`);
		console.log(`      - Local: ${p.local}`);
		console.log(`      - Owner: ${p.owner}`);
		console.log(`      - Video: ${p.tracks?.video?.state || 'unknown'}`);
		console.log(`      - Audio: ${p.tracks?.audio?.state || 'unknown'}`);
	});
	
	participantsStore.set(participants);
}

/**
 * Sets the connection state
 * Logs state transitions
 */
export function setConnectionState(state: ConnectionState) {
	console.log(`🔧 [DAILY STORES] Connection state: ${state}`);
	connectionStateStore.set(state);
}

/**
 * Sets the active source (program output)
 */
export function setActiveSource(sessionId: string | null) {
	console.log(`🔧 [DAILY STORES] Active source set to: ${sessionId || 'none'}`);
	activeSourceStore.set(sessionId);
}

/**
 * Sets the active audio source
 */
export function setActiveAudio(sessionId: string | null) {
	console.log(`🔧 [DAILY STORES] Active audio set to: ${sessionId || 'none'}`);
	activeAudioStore.set(sessionId);
}

/**
 * Toggles audio pin for a source
 * Pinned audio overrides audio-follows-video behavior
 */
export function toggleAudioPin(sessionId: string) {
	console.log(`🔧 [DAILY STORES] Toggling audio pin for: ${sessionId}`);
	
	pinnedAudioStore.update(current => {
		if (current === sessionId) {
			console.log(`   → Audio unpinned`);
			return null;
		} else {
			console.log(`   → Audio pinned to ${sessionId}`);
			return sessionId;
		}
	});
}

/**
 * Toggles mute state for a source
 */
export function toggleMute(sessionId: string) {
	console.log(`🔧 [DAILY STORES] Toggling mute for: ${sessionId}`);
	
	muteMapStore.update(current => {
		const newState = !current[sessionId];
		console.log(`   → Muted: ${newState}`);
		return {
			...current,
			[sessionId]: newState
		};
	});
}

/**
 * Sets an error message
 */
export function setError(error: string | null) {
	if (error) {
		console.error(`❌ [DAILY STORES] Error: ${error}`);
	} else {
		console.log(`✅ [DAILY STORES] Error cleared`);
	}
	errorStore.set(error);
}

/**
 * Sets streaming state
 */
export function setStreaming(streaming: boolean) {
	console.log(`🔧 [DAILY STORES] Streaming: ${streaming ? 'ON' : 'OFF'}`);
	isStreamingStore.set(streaming);
}

/**
 * Resets all stores to initial state
 * Used when leaving the room
 */
export function resetStores() {
	console.log('🔄 [DAILY STORES] Resetting all stores to initial state');
	
	dailyCallStore.set(null);
	participantsStore.set([]);
	connectionStateStore.set('idle');
	activeSourceStore.set(null);
	activeAudioStore.set(null);
	pinnedAudioStore.set(null);
	muteMapStore.set({});
	errorStore.set(null);
	isStreamingStore.set(false);
	
	console.log('✅ [DAILY STORES] All stores reset');
}

console.log('✅ [DAILY STORES] Module loaded successfully');
