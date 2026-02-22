import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

interface WebSocketMessage {
	type: 'connected' | 'new-message' | 'message-read' | 'document-uploaded' | 'document-viewed' | 'ping' | 'pong';
	data?: any;
	userId?: string;
	messageId?: string;
}

interface WebSocketStore {
	connected: boolean;
	socket: WebSocket | null;
	reconnectAttempts: number;
	maxReconnectAttempts: number;
}

const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

function createWebSocketStore() {
	const { subscribe, set, update } = writable<WebSocketStore>({
		connected: false,
		socket: null,
		reconnectAttempts: 0,
		maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS
	});

	let eventHandlers: Map<string, Set<(data: any) => void>> = new Map();
	let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

	function connect() {
		if (!browser) return;

		// Clear any existing reconnect timeout
		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
			reconnectTimeout = null;
		}

		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const wsUrl = `${protocol}//${window.location.host}/ws`;

		try {
			const socket = new WebSocket(wsUrl);

			socket.onopen = () => {
				console.log('[WebSocket] Connected');
				update(state => ({
					...state,
					connected: true,
					socket,
					reconnectAttempts: 0
				}));
			};

			socket.onmessage = (event) => {
				try {
					const message: WebSocketMessage = JSON.parse(event.data);
					console.log('[WebSocket] Received:', message);

					// Trigger all handlers for this message type
					const handlers = eventHandlers.get(message.type);
					if (handlers) {
						handlers.forEach(handler => handler(message.data));
					}

					// Trigger generic 'any' handlers
					const anyHandlers = eventHandlers.get('*');
					if (anyHandlers) {
						anyHandlers.forEach(handler => handler(message));
					}
				} catch (error) {
					console.error('[WebSocket] Failed to parse message:', error);
				}
			};

			socket.onerror = (error) => {
				console.error('[WebSocket] Error:', error);
			};

			socket.onclose = () => {
				console.log('[WebSocket] Disconnected');
				update(state => {
					const newState = {
						...state,
						connected: false,
						socket: null
					};

					// Attempt reconnection if under max attempts
					if (state.reconnectAttempts < state.maxReconnectAttempts) {
						console.log(`[WebSocket] Reconnecting in ${RECONNECT_INTERVAL}ms (attempt ${state.reconnectAttempts + 1}/${state.maxReconnectAttempts})`);
						
						reconnectTimeout = setTimeout(() => {
							newState.reconnectAttempts++;
							connect();
						}, RECONNECT_INTERVAL);
					} else {
						console.log('[WebSocket] Max reconnection attempts reached');
					}

					return newState;
				});
			};

			set({
				connected: false,
				socket,
				reconnectAttempts: 0,
				maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS
			});
		} catch (error) {
			console.error('[WebSocket] Failed to create connection:', error);
		}
	}

	function disconnect() {
		update(state => {
			if (state.socket) {
				state.socket.close();
			}
			if (reconnectTimeout) {
				clearTimeout(reconnectTimeout);
				reconnectTimeout = null;
			}
			return {
				...state,
				connected: false,
				socket: null
			};
		});
	}

	function send(type: string, data: any) {
		update(state => {
			if (state.socket && state.connected) {
				const message: WebSocketMessage = { type: type as any, data };
				state.socket.send(JSON.stringify(message));
			} else {
				console.warn('[WebSocket] Cannot send message - not connected');
			}
			return state;
		});
	}

	function on(eventType: string, handler: (data: any) => void) {
		if (!eventHandlers.has(eventType)) {
			eventHandlers.set(eventType, new Set());
		}
		eventHandlers.get(eventType)!.add(handler);

		// Return unsubscribe function
		return () => {
			eventHandlers.get(eventType)?.delete(handler);
		};
	}

	function off(eventType: string, handler?: (data: any) => void) {
		if (handler) {
			eventHandlers.get(eventType)?.delete(handler);
		} else {
			eventHandlers.delete(eventType);
		}
	}

	return {
		subscribe,
		connect,
		disconnect,
		send,
		on,
		off
	};
}

export const websocket = createWebSocketStore();

// Derived store for connection status
export const isConnected = derived(websocket, $ws => $ws.connected);
