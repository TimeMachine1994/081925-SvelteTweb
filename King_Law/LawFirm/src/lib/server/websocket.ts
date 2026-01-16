import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import * as auth from './auth';

interface AuthenticatedWebSocket extends WebSocket {
	userId?: string;
	userRole?: string;
	isAlive?: boolean;
}

interface WebSocketMessage {
	type: 'new-message' | 'message-read' | 'document-uploaded' | 'document-viewed' | 'ping' | 'pong';
	data?: any;
}

class WebSocketManager {
	private wss: WebSocketServer | null = null;
	private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
	private heartbeatInterval: NodeJS.Timeout | null = null;

	initialize(server: Server) {
		if (this.wss) {
			console.log('WebSocket server already initialized');
			return;
		}

		this.wss = new WebSocketServer({ server, path: '/ws' });

		this.wss.on('connection', async (ws: AuthenticatedWebSocket, request) => {
			console.log('New WebSocket connection attempt');

			const cookies = this.parseCookies(request.headers.cookie || '');
			const sessionToken = cookies[auth.sessionCookieName];

			if (!sessionToken) {
				console.log('WebSocket connection rejected: No session token');
				ws.close(1008, 'Unauthorized');
				return;
			}

			const { user } = await auth.validateSessionToken(sessionToken);

			if (!user) {
				console.log('WebSocket connection rejected: Invalid session');
				ws.close(1008, 'Unauthorized');
				return;
			}

			ws.userId = user.id;
			ws.userRole = user.role;
			ws.isAlive = true;

			if (!this.clients.has(user.id)) {
				this.clients.set(user.id, new Set());
			}
			this.clients.get(user.id)!.add(ws);

			console.log(`WebSocket authenticated: User ${user.id} (${user.role})`);

			ws.on('message', (rawMessage) => {
				try {
					const message: WebSocketMessage = JSON.parse(rawMessage.toString());
					this.handleMessage(ws, message);
				} catch (e) {
					console.error('Failed to parse WebSocket message:', e);
				}
			});

			ws.on('pong', () => {
				ws.isAlive = true;
			});

			ws.on('close', () => {
				if (ws.userId) {
					const userClients = this.clients.get(ws.userId);
					if (userClients) {
						userClients.delete(ws);
						if (userClients.size === 0) {
							this.clients.delete(ws.userId);
						}
					}
					console.log(`WebSocket disconnected: User ${ws.userId}`);
				}
			});

			ws.on('error', (error) => {
				console.error('WebSocket error:', error);
			});

			ws.send(JSON.stringify({ type: 'connected', userId: user.id }));
		});

		this.startHeartbeat();

		console.log('WebSocket server initialized on /ws');
	}

	private parseCookies(cookieString: string): Record<string, string> {
		const cookies: Record<string, string> = {};
		cookieString.split(';').forEach((cookie) => {
			const [name, value] = cookie.trim().split('=');
			if (name && value) {
				cookies[name] = decodeURIComponent(value);
			}
		});
		return cookies;
	}

	private handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
		if (message.type === 'ping') {
			ws.send(JSON.stringify({ type: 'pong' }));
		}
	}

	private startHeartbeat() {
		this.heartbeatInterval = setInterval(() => {
			if (!this.wss) return;

			this.wss.clients.forEach((ws: WebSocket) => {
				const authenticatedWs = ws as AuthenticatedWebSocket;
				if (authenticatedWs.isAlive === false) {
					console.log(`Terminating inactive WebSocket: User ${authenticatedWs.userId}`);
					return authenticatedWs.terminate();
				}

				authenticatedWs.isAlive = false;
				authenticatedWs.ping();
			});
		}, 30000);
	}

	broadcast(userId: string, message: WebSocketMessage) {
		const userClients = this.clients.get(userId);
		if (!userClients || userClients.size === 0) {
			return;
		}

		const messageString = JSON.stringify(message);
		userClients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(messageString);
			}
		});
	}

	broadcastToCase(caseId: string, userIds: string[], message: WebSocketMessage) {
		const messageString = JSON.stringify(message);
		userIds.forEach((userId) => {
			const userClients = this.clients.get(userId);
			if (userClients) {
				userClients.forEach((client) => {
					if (client.readyState === WebSocket.OPEN) {
						client.send(messageString);
					}
				});
			}
		});
	}

	close() {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}

		if (this.wss) {
			this.wss.clients.forEach((client) => {
				client.close(1000, 'Server shutting down');
			});
			this.wss.close();
			this.wss = null;
		}

		this.clients.clear();
		console.log('WebSocket server closed');
	}

	getConnectionCount(): number {
		return this.wss?.clients.size || 0;
	}

	getUserConnectionCount(userId: string): number {
		return this.clients.get(userId)?.size || 0;
	}
}

export const wsManager = new WebSocketManager();

export function broadcastNewMessage(recipientId: string, message: any) {
	wsManager.broadcast(recipientId, {
		type: 'new-message',
		data: message
	});
}

export function broadcastMessageRead(senderId: string, messageId: string) {
	wsManager.broadcast(senderId, {
		type: 'message-read',
		data: { messageId }
	});
}

export function broadcastDocumentUploaded(caseId: string, userIds: string[], document: any) {
	wsManager.broadcastToCase(caseId, userIds, {
		type: 'document-uploaded',
		data: document
	});
}

export function broadcastDocumentViewed(uploaderId: string, documentId: string) {
	wsManager.broadcast(uploaderId, {
		type: 'document-viewed',
		data: { documentId }
	});
}
