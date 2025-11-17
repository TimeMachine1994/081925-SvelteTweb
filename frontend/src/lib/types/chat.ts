import type { Timestamp } from 'firebase/firestore';

/**
 * Chat message interface for memorial chat system
 */
export interface ChatMessage {
	id: string;
	memorialId: string;
	userId: string;
	userName: string;
	userRole: 'admin' | 'owner' | 'funeral_director' | 'viewer';
	message: string;
	timestamp: Date | Timestamp;
	isEdited: boolean;
	editedAt?: Date | Timestamp;
	isDeleted: boolean;
	deletedAt?: Date | Timestamp;
	deletedBy?: string; // UID of user who deleted (for moderation tracking)
	replyTo?: string; // ID of message being replied to
}

/**
 * Input data for creating a chat message
 */
export interface ChatMessageInput {
	message: string;
	replyTo?: string;
}

/**
 * Input data for editing a chat message
 */
export interface ChatMessageEdit {
	message: string;
}

/**
 * Chat message with user display information
 */
export interface ChatMessageDisplay extends ChatMessage {
	userDisplayName: string;
	canEdit: boolean;
	canDelete: boolean;
	isOwn: boolean;
}

/**
 * Chat statistics for a memorial
 */
export interface ChatStats {
	totalMessages: number;
	activeParticipants: number;
	lastMessageAt?: Date;
}

/**
 * Chat moderation action
 */
export interface ChatModerationAction {
	messageId: string;
	action: 'delete' | 'flag' | 'restore';
	reason?: string;
	moderatorId: string;
	timestamp: Date | Timestamp;
}

/**
 * User chat preferences
 */
export interface ChatPreferences {
	notificationsEnabled: boolean;
	soundEnabled: boolean;
	showTimestamps: boolean;
}
