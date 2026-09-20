import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, gt, inArray, lt, sql } from 'drizzle-orm';
import { getDb } from '../client';
import { memorialChatMessages, memorialChatSettings } from '../schema';
import type { ChatAuthorType, ChatSettings, MemorialChatMessage } from '$lib/types/chat';

/**
 * Unified memorial chat repo (Turso/Drizzle).
 *
 * Replaces the old, separate Firestore-backed stream chat
 * (`streams/{id}/chat_messages`) and memorial chat (`memorials/{id}/chat`)
 * implementations. There is exactly one chat thread per memorial now,
 * independent of any specific livestream.
 */

const DEFAULT_SETTINGS: Omit<ChatSettings, 'memorialId'> = {
	enabled: true,
	locked: false,
	archived: false
};

function mapMessage(row: typeof memorialChatMessages.$inferSelect): MemorialChatMessage {
	return {
		id: row.id,
		memorialId: row.memorialId,
		authorType: row.authorType as ChatAuthorType,
		userId: row.userId ?? undefined,
		userName: row.userName,
		userRole: (row.userRole as MemorialChatMessage['userRole']) ?? undefined,
		guestSessionId: row.guestSessionId ?? undefined,
		message: row.message,
		isEdited: row.isEdited,
		editedAt: row.editedAt ?? undefined,
		isDeleted: row.isDeleted,
		deletedAt: row.deletedAt ?? undefined,
		deletedBy: row.deletedBy ?? undefined,
		flagged: row.flagged,
		flagReason: row.flagReason ?? undefined,
		replyTo: row.replyTo ?? undefined,
		sourceStreamId: row.sourceStreamId ?? undefined,
		createdAt: row.createdAt
	};
}

// ─── Settings ────────────────────────────────────────────────────────────

export async function getChatSettings(memorialId: string): Promise<ChatSettings> {
	const db = getDb();
	const [row] = await db
		.select()
		.from(memorialChatSettings)
		.where(eq(memorialChatSettings.memorialId, memorialId))
		.limit(1);

	if (!row) return { memorialId, ...DEFAULT_SETTINGS };

	return {
		memorialId: row.memorialId,
		enabled: row.enabled,
		locked: row.locked,
		archived: row.archived
	};
}

export async function upsertChatSettings(
	memorialId: string,
	patch: Partial<Omit<ChatSettings, 'memorialId'>>
): Promise<ChatSettings> {
	const db = getDb();
	const now = new Date().toISOString();
	const current = await getChatSettings(memorialId);
	const next = { ...current, ...patch };

	await db
		.insert(memorialChatSettings)
		.values({
			memorialId,
			enabled: next.enabled,
			locked: next.locked,
			archived: next.archived,
			createdAt: now,
			updatedAt: now
		})
		.onConflictDoUpdate({
			target: memorialChatSettings.memorialId,
			set: {
				enabled: next.enabled,
				locked: next.locked,
				archived: next.archived,
				updatedAt: now
			}
		});

	return next;
}

// ─── Messages ────────────────────────────────────────────────────────────

export interface CreateChatMessageInput {
	memorialId: string;
	authorType: ChatAuthorType;
	userId?: string;
	userName: string;
	userRole?: MemorialChatMessage['userRole'];
	guestSessionId?: string;
	message: string;
	replyTo?: string;
	sourceStreamId?: string;
}

/** Newest-first page of messages (including soft-deleted ones; callers filter for public display). */
export async function listMemorialChatMessages(
	memorialId: string,
	opts: { limit: number; beforeCreatedAt?: string | null }
): Promise<MemorialChatMessage[]> {
	const db = getDb();
	const conditions = [eq(memorialChatMessages.memorialId, memorialId)];
	if (opts.beforeCreatedAt) {
		conditions.push(lt(memorialChatMessages.createdAt, opts.beforeCreatedAt));
	}

	const rows = await db
		.select()
		.from(memorialChatMessages)
		.where(and(...conditions))
		.orderBy(desc(memorialChatMessages.createdAt))
		.limit(opts.limit);

	return rows.map(mapMessage);
}

/** Ascending messages created strictly after `sinceCreatedAt` — used by the SSE poller. */
export async function listMemorialChatMessagesSince(
	memorialId: string,
	sinceCreatedAt: string
): Promise<MemorialChatMessage[]> {
	const db = getDb();
	const rows = await db
		.select()
		.from(memorialChatMessages)
		.where(
			and(
				eq(memorialChatMessages.memorialId, memorialId),
				gt(memorialChatMessages.createdAt, sinceCreatedAt)
			)
		)
		.orderBy(asc(memorialChatMessages.createdAt));

	return rows.map(mapMessage);
}

export async function getMemorialChatMessage(
	memorialId: string,
	id: string
): Promise<MemorialChatMessage | null> {
	const db = getDb();
	const [row] = await db
		.select()
		.from(memorialChatMessages)
		.where(and(eq(memorialChatMessages.memorialId, memorialId), eq(memorialChatMessages.id, id)))
		.limit(1);
	return row ? mapMessage(row) : null;
}

/**
 * Timestamp of the sender's most recent message in this memorial's chat, if
 * any — used for a lightweight post-rate throttle. Identified by `userId`
 * for signed-in users or `guestSessionId` for guests.
 */
export async function getLastMessageCreatedAt(
	memorialId: string,
	identity: { userId?: string; guestSessionId?: string }
): Promise<string | null> {
	if (!identity.userId && !identity.guestSessionId) return null;

	const db = getDb();
	const identityCondition = identity.userId
		? eq(memorialChatMessages.userId, identity.userId)
		: eq(memorialChatMessages.guestSessionId, identity.guestSessionId!);

	const [row] = await db
		.select({ createdAt: memorialChatMessages.createdAt })
		.from(memorialChatMessages)
		.where(and(eq(memorialChatMessages.memorialId, memorialId), identityCondition))
		.orderBy(desc(memorialChatMessages.createdAt))
		.limit(1);

	return row?.createdAt ?? null;
}

export async function createMemorialChatMessage(
	input: CreateChatMessageInput
): Promise<MemorialChatMessage> {
	const db = getDb();
	const id = randomUUID();
	const createdAt = new Date().toISOString();

	const row = {
		id,
		memorialId: input.memorialId,
		authorType: input.authorType,
		userId: input.userId ?? null,
		userName: input.userName,
		userRole: input.userRole ?? null,
		guestSessionId: input.guestSessionId ?? null,
		message: input.message,
		isEdited: false,
		editedAt: null,
		isDeleted: false,
		deletedAt: null,
		deletedBy: null,
		flagged: false,
		flagReason: null,
		replyTo: input.replyTo ?? null,
		sourceStreamId: input.sourceStreamId ?? null,
		createdAt
	};

	await db.insert(memorialChatMessages).values(row);

	return mapMessage(row as typeof memorialChatMessages.$inferSelect);
}

export async function editMemorialChatMessage(
	memorialId: string,
	id: string,
	message: string
): Promise<void> {
	const db = getDb();
	await db
		.update(memorialChatMessages)
		.set({ message, isEdited: true, editedAt: new Date().toISOString() })
		.where(and(eq(memorialChatMessages.memorialId, memorialId), eq(memorialChatMessages.id, id)));
}

export async function softDeleteMemorialChatMessage(
	memorialId: string,
	id: string,
	deletedBy: string
): Promise<void> {
	const db = getDb();
	await db
		.update(memorialChatMessages)
		.set({ isDeleted: true, deletedAt: new Date().toISOString(), deletedBy })
		.where(and(eq(memorialChatMessages.memorialId, memorialId), eq(memorialChatMessages.id, id)));
}

/** Total (non-deleted) messages a user has sent, optionally restricted to a set of memorials. */
export async function countMemorialChatMessagesByUser(
	userId: string,
	memorialIds?: string[]
): Promise<number> {
	if (memorialIds && memorialIds.length === 0) return 0;

	const db = getDb();
	const conditions = [eq(memorialChatMessages.userId, userId)];
	if (memorialIds) conditions.push(inArray(memorialChatMessages.memorialId, memorialIds));

	const [row] = await db
		.select({ count: sql<number>`count(*)` })
		.from(memorialChatMessages)
		.where(and(...conditions));

	return row?.count ?? 0;
}

export async function setMemorialChatMessageFlag(
	memorialId: string,
	id: string,
	flagged: boolean,
	flagReason?: string | null
): Promise<void> {
	const db = getDb();
	await db
		.update(memorialChatMessages)
		.set({ flagged, flagReason: flagged ? (flagReason ?? null) : null })
		.where(and(eq(memorialChatMessages.memorialId, memorialId), eq(memorialChatMessages.id, id)));
}
