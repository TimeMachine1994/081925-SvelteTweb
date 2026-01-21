import { api } from '$lib/utils/api-client';

type Message = {
	id: string;
	caseId: string | null;
	senderId: string;
	recipientId: string | null;
	content: string;
	attachmentDocumentId: string | null;
	createdAt: Date;
	readAt: Date | null;
};

type User = {
	id: string;
	username: string;
	firstName: string;
	lastName: string;
	role: string;
};

type Document = {
	id: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	filePath: string;
};

type MessageWithSender = {
	message: Message;
	sender: User;
	attachment: Document | null;
};

type UnreadCounts = {
	total: number;
	byCaseId: Record<string, number>;
	uncategorized: number;
};

class MessagesStore {
	messages = $state<MessageWithSender[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);
	unreadCounts = $state<UnreadCounts>({ total: 0, byCaseId: {}, uncategorized: 0 });
	
	private pollingInterval: number | null = null;
	private lastPollTime: Date | null = null;

	async fetchMessages(caseId?: string, uncategorized = false): Promise<void> {
		this.loading = true;
		this.error = null;

		try {
			const params = new URLSearchParams();
			if (caseId) params.set('caseId', caseId);
			if (uncategorized) params.set('uncategorized', 'true');

			const result = await api.get<{ messages: MessageWithSender[] }>(
				`/api/messages?${params.toString()}`
			);

			this.messages = result.messages;
			this.lastPollTime = new Date();
		} catch (err: any) {
			this.error = err.message || 'Failed to fetch messages';
			console.error('Fetch messages error:', err);
		} finally {
			this.loading = false;
		}
	}

	async sendMessage(
		caseId: string | null,
		content: string,
		recipientId?: string
	): Promise<{ success: boolean; error?: string }> {
		try {
			await api.post('/api/messages/send', {
				caseId,
				recipientId,
				content
			});

			// Refresh messages after sending
			if (caseId) {
				await this.fetchMessages(caseId);
			} else {
				await this.fetchMessages(undefined, true);
			}

			return { success: true };
		} catch (err: any) {
			return {
				success: false,
				error: err.message || 'Failed to send message'
			};
		}
	}

	async sendMessageWithAttachment(
		caseId: string | null,
		content: string,
		file: File,
		recipientId?: string
	): Promise<{ success: boolean; error?: string }> {
		try {
			const formData = new FormData();
			if (caseId) formData.append('caseId', caseId);
			if (recipientId) formData.append('recipientId', recipientId);
			formData.append('content', content);
			formData.append('file', file);

			const response = await fetch('/api/messages/send', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to send message with attachment');
			}

			// Refresh messages after sending
			if (caseId) {
				await this.fetchMessages(caseId);
			} else {
				await this.fetchMessages(undefined, true);
			}

			return { success: true };
		} catch (err: any) {
			return {
				success: false,
				error: err.message || 'Failed to send message with attachment'
			};
		}
	}

	async markAsRead(messageIds: string[]): Promise<void> {
		try {
			await api.post('/api/messages/mark-read', { messageIds });
			
			// Update local state
			this.messages = this.messages.map((item) => {
				if (messageIds.includes(item.message.id)) {
					return {
						...item,
						message: { ...item.message, readAt: new Date() }
					};
				}
				return item;
			});

			// Refresh unread counts
			await this.fetchUnreadCounts();
		} catch (err: any) {
			console.error('Mark as read error:', err);
		}
	}

	async fetchUnreadCounts(): Promise<void> {
		try {
			const result = await api.get<UnreadCounts>('/api/messages/unread');
			this.unreadCounts = result;
		} catch (err: any) {
			console.error('Fetch unread counts error:', err);
		}
	}

	startPolling(caseId?: string, interval = 5000): void {
		this.stopPolling();

		this.pollingInterval = window.setInterval(async () => {
			if (!this.lastPollTime) return;

			try {
				const params = new URLSearchParams({
					since: this.lastPollTime.toISOString()
				});
				if (caseId) params.set('caseId', caseId);

				const result = await api.get<{ messages: MessageWithSender[]; count: number }>(
					`/api/messages/poll?${params.toString()}`
				);

				if (result.count > 0) {
					// Append new messages
					this.messages = [...this.messages, ...result.messages];
					this.lastPollTime = new Date();
					
					// Update unread counts
					await this.fetchUnreadCounts();
				}
			} catch (err: any) {
				console.error('Polling error:', err);
			}
		}, interval);
	}

	stopPolling(): void {
		if (this.pollingInterval) {
			clearInterval(this.pollingInterval);
			this.pollingInterval = null;
		}
	}

	getUnreadCount(caseId?: string): number {
		if (!caseId) return this.unreadCounts.uncategorized;
		return this.unreadCounts.byCaseId[caseId] || 0;
	}

	async assignToCase(
		messageId: string,
		caseId?: string,
		createNewCase?: boolean,
		caseTitle?: string,
		caseDescription?: string
	): Promise<{ success: boolean; error?: string }> {
		try {
			const response = await fetch('/api/messages/assign', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messageId,
					caseId,
					createNewCase,
					caseTitle,
					caseDescription
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to assign message');
			}

			// Refresh uncategorized messages
			await this.fetchMessages(undefined, true);

			return { success: true };
		} catch (err: any) {
			return {
				success: false,
				error: err.message || 'Failed to assign message to case'
			};
		}
	}
}

export const messagesStore = new MessagesStore();
