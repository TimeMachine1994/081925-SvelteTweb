import type { SerializedChatMessage, StreamChatMessage } from '$lib/types/chat';
import { adminDb, toIso, toIsoOrNow } from './_shared';

/**
 * Two chat stores:
 *  - Stream chat:   `streams/{streamId}/chat_messages`
 *  - Memorial chat: `memorials/{memorialId}/chat`
 */
const STREAM_COLLECTION = 'chat_messages';
const MEMORIAL_COLLECTION = 'chat';

// ---------------------------------------------------------------------------
// Stream chat (`streams/{streamId}/chat_messages`)
// ---------------------------------------------------------------------------

export interface StreamChatPage {
	messages: StreamChatMessage[];
	/** Number of raw documents returned by the query (before deleted filtering). */
	fetched: number;
}

export interface StreamChatMessageUpdate {
	updatedAt: string;
	updatedBy: string;
	deleted?: boolean;
	deletedAt?: string | null;
	deletedBy?: string | null;
	flagged?: boolean;
}

function streamChatRef(streamId: string) {
	return adminDb.collection('streams').doc(streamId).collection(STREAM_COLLECTION);
}

function mapStreamMessage(id: string, data: Record<string, any>): StreamChatMessage {
	return {
		...(data as StreamChatMessage),
		id
	};
}

/**
 * Newest-first page of stream chat messages. When `beforeId` is provided and
 * the referenced message exists, results start after that document.
 */
export async function listStreamChatMessages(
	streamId: string,
	opts: { limit: number; beforeId?: string | null; includeDeleted?: boolean }
): Promise<StreamChatPage> {
	let query = streamChatRef(streamId).orderBy('timestamp', 'desc').limit(opts.limit);

	if (opts.beforeId) {
		const beforeDoc = await streamChatRef(streamId).doc(opts.beforeId).get();
		if (beforeDoc.exists) {
			query = query.startAfter(beforeDoc);
		}
	}

	const snapshot = await query.get();

	const messages: StreamChatMessage[] = [];
	snapshot.forEach((doc) => {
		const data = doc.data() as StreamChatMessage;
		if (opts.includeDeleted || !data.deleted) {
			messages.push(mapStreamMessage(doc.id, data));
		}
	});

	return { messages, fetched: snapshot.size };
}

export async function getStreamChatMessage(
	streamId: string,
	messageId: string
): Promise<StreamChatMessage | null> {
	const snap = await streamChatRef(streamId).doc(messageId).get();
	if (!snap.exists) return null;
	return mapStreamMessage(snap.id, snap.data() || {});
}

export async function createStreamChatMessage(
	streamId: string,
	message: Omit<StreamChatMessage, 'id'>
): Promise<string> {
	const ref = await streamChatRef(streamId).add(message);
	return ref.id;
}

export async function softDeleteStreamChatMessage(
	streamId: string,
	messageId: string,
	deletedBy: string
): Promise<void> {
	await streamChatRef(streamId).doc(messageId).update({
		deleted: true,
		deletedAt: new Date().toISOString(),
		deletedBy
	});
}

export async function deleteStreamChatMessage(streamId: string, messageId: string): Promise<void> {
	await streamChatRef(streamId).doc(messageId).delete();
}

export async function updateStreamChatMessage(
	streamId: string,
	messageId: string,
	updates: StreamChatMessageUpdate
): Promise<void> {
	await streamChatRef(streamId)
		.doc(messageId)
		.update({ ...updates });
}

// ---------------------------------------------------------------------------
// Memorial chat (`memorials/{memorialId}/chat`)
// ---------------------------------------------------------------------------

export interface MemorialChatMessageInput {
	memorialId: string;
	userId: string;
	userName: string;
	userRole: SerializedChatMessage['userRole'];
	message: string;
	replyTo?: string;
}

function memorialChatRef(memorialId: string) {
	return adminDb.collection('memorials').doc(memorialId).collection(MEMORIAL_COLLECTION);
}

function mapMemorialMessage(id: string, data: Record<string, any>): SerializedChatMessage {
	return {
		id,
		memorialId: data.memorialId,
		userId: data.userId,
		userName: data.userName,
		userRole: data.userRole,
		message: data.message,
		timestamp: toIsoOrNow(data.timestamp),
		isEdited: data.isEdited || false,
		editedAt: toIso(data.editedAt) ?? undefined,
		isDeleted: data.isDeleted || false,
		deletedAt: toIso(data.deletedAt) ?? undefined,
		replyTo: data.replyTo
	};
}

/**
 * Newest-first memorial chat messages (including soft-deleted ones; callers
 * filter). If the query fails (e.g. collection not created yet) returns null.
 */
export async function listMemorialChatMessages(
	memorialId: string,
	opts: { limit: number; beforeTimestamp?: string | null }
): Promise<SerializedChatMessage[] | null> {
	let query = memorialChatRef(memorialId).orderBy('timestamp', 'desc').limit(opts.limit);

	if (opts.beforeTimestamp) {
		query = query.startAfter(new Date(opts.beforeTimestamp));
	}

	let snapshot;
	try {
		snapshot = await query.get();
	} catch {
		return null;
	}

	return snapshot.docs.map((doc) => mapMemorialMessage(doc.id, doc.data()));
}

export async function getMemorialChatMessage(
	memorialId: string,
	chatId: string
): Promise<SerializedChatMessage | null> {
	const snap = await memorialChatRef(memorialId).doc(chatId).get();
	if (!snap.exists) return null;
	return mapMemorialMessage(snap.id, snap.data() || {});
}

/** Creates a memorial chat message and returns the stored (serialized) message. */
export async function createMemorialChatMessage(
	input: MemorialChatMessageInput
): Promise<SerializedChatMessage> {
	const timestamp = new Date();
	const doc = {
		memorialId: input.memorialId,
		userId: input.userId,
		userName: input.userName,
		userRole: input.userRole,
		message: input.message,
		timestamp,
		isEdited: false,
		isDeleted: false,
		...(input.replyTo && { replyTo: input.replyTo })
	};

	const ref = await memorialChatRef(input.memorialId).add(doc);

	return {
		id: ref.id,
		...doc,
		timestamp: timestamp.toISOString()
	};
}

export async function editMemorialChatMessage(
	memorialId: string,
	chatId: string,
	message: string
): Promise<void> {
	await memorialChatRef(memorialId).doc(chatId).update({
		message,
		isEdited: true,
		editedAt: new Date()
	});
}

export async function softDeleteMemorialChatMessage(
	memorialId: string,
	chatId: string
): Promise<void> {
	await memorialChatRef(memorialId).doc(chatId).update({
		isDeleted: true,
		deletedAt: new Date(),
		message: '[Message deleted]'
	});
}
