/**
 * Unified memorial chat.
 *
 * There is exactly one chat thread per memorial, independent of any specific
 * livestream. Both signed-in users and anonymous guests (who supply a
 * display name) can participate.
 */

export type ChatAuthorType = 'user' | 'guest';
export type ChatUserRole = 'admin' | 'owner' | 'funeral_director' | 'viewer';

export interface MemorialChatMessage {
	/** Unique message id */
	id: string;

	/** Memorial this message belongs to */
	memorialId: string;

	/** 'user' = authenticated account, 'guest' = anonymous visitor with a display name */
	authorType: ChatAuthorType;

	/** Set when authorType === 'user' */
	userId?: string;

	/** Display name (account display name, or guest-chosen name) */
	userName: string;

	/** Role badge — only set for authorType === 'user' */
	userRole?: ChatUserRole;

	/** Stable per-browser-session id for guests, used for moderation grouping */
	guestSessionId?: string;

	/** Message content (max 500 characters) */
	message: string;

	/** ISO timestamp the message was sent */
	createdAt: string;

	/** Whether the message has been edited */
	isEdited: boolean;

	/** ISO timestamp when the message was edited, if applicable */
	editedAt?: string;

	/** Whether the message has been soft-deleted */
	isDeleted: boolean;

	/** ISO timestamp when the message was deleted, if applicable */
	deletedAt?: string;

	/** uid of whoever deleted the message (self, memorial owner/FD, or admin) */
	deletedBy?: string;

	/** Moderation flag, e.g. reported by another visitor */
	flagged: boolean;
	flagReason?: string;

	/** id of message being replied to (for threading) */
	replyTo?: string;

	/**
	 * Provenance only — which stream (if any) was live when this message was
	 * posted or migrated from. Never used to scope/filter the chat itself.
	 */
	sourceStreamId?: string;
}

/** Per-memorial chat configuration, managed from the admin panel. */
export interface ChatSettings {
	memorialId: string;
	/** Show/hide chat entirely */
	enabled: boolean;
	/** Read-only mode: existing messages remain visible, new ones are blocked */
	locked: boolean;
	/** Chat is archived (kept for history, hidden from active view) */
	archived: boolean;
}

/** Input type for sending a new chat message via the public API. */
export interface CreateChatMessageInput {
	message: string;
	/** Required when the sender isn't authenticated */
	guestName?: string;
	/** Stable per-browser-session id for guests (generated client-side, persisted in sessionStorage) */
	guestSessionId?: string;
	replyTo?: string;
}

/** Input type for editing an existing chat message. */
export interface UpdateChatMessageInput {
	message: string;
}
