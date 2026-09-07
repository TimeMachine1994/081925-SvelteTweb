import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, toIso } from './_shared';

/** Embeds live in the `memorials/{memorialId}/embeds` subcollection. */
const PARENT_COLLECTION = 'memorials';
const COLLECTION = 'embeds';

export type MemorialEmbedRecord = Record<string, any> & {
	id: string;
	title: string;
	type: string;
	embedUrl: string;
	createdAt: string | null;
	updatedAt: string | null;
};

export interface MemorialEmbedInput {
	title: string;
	type: string;
	embedUrl: string;
}

function embedsRef(memorialId: string) {
	return adminDb.collection(PARENT_COLLECTION).doc(memorialId).collection(COLLECTION);
}

function mapEmbed(id: string, data: Record<string, any>): MemorialEmbedRecord {
	return {
		...data,
		id,
		title: data.title,
		type: data.type,
		embedUrl: data.embedUrl,
		createdAt: toIso(data.createdAt),
		updatedAt: toIso(data.updatedAt)
	};
}

/** Creates an embed and returns the stored document. */
export async function createEmbed(
	memorialId: string,
	input: MemorialEmbedInput
): Promise<MemorialEmbedRecord> {
	const ref = await embedsRef(memorialId).add({
		title: input.title,
		type: input.type,
		embedUrl: input.embedUrl,
		createdAt: FieldValue.serverTimestamp(),
		updatedAt: FieldValue.serverTimestamp()
	});
	const snap = await ref.get();
	return mapEmbed(snap.id, snap.data() || {});
}

/** Applies a partial update and returns the stored document. */
export async function updateEmbed(
	memorialId: string,
	embedId: string,
	data: Record<string, any>
): Promise<MemorialEmbedRecord> {
	const ref = embedsRef(memorialId).doc(embedId);
	await ref.update({
		...data,
		updatedAt: FieldValue.serverTimestamp()
	});
	const snap = await ref.get();
	return mapEmbed(snap.id, snap.data() || {});
}

export async function deleteEmbed(memorialId: string, embedId: string): Promise<void> {
	await embedsRef(memorialId).doc(embedId).delete();
}
