import { adminDb, toIso } from './_shared';

/**
 * Slideshows live in the `memorials/{memorialId}/slideshows` subcollection.
 * Drafts live in `memorials/{memorialId}/slideshow_drafts/{userId}`.
 */
const PARENT_COLLECTION = 'memorials';
const COLLECTION = 'slideshows';
const DRAFTS_COLLECTION = 'slideshow_drafts';

/** Raw slideshow document with `id` and normalized timestamps. */
export type SlideshowRecord = Record<string, any> & {
	id: string;
	createdAt: string | null;
	updatedAt: string | null;
};

export type SlideshowDraftRecord = Record<string, any> & {
	memorialId: string;
	userId: string;
	photos: any[];
	settings: Record<string, any>;
	createdAt: string | null;
	updatedAt: string | null;
	version: string;
};

export interface SlideshowDraftInput {
	memorialId: string;
	userId: string;
	photos: any[];
	settings: Record<string, any>;
	version: string;
}

function slideshowsRef(memorialId: string) {
	return adminDb.collection(PARENT_COLLECTION).doc(memorialId).collection(COLLECTION);
}

function draftRef(memorialId: string, userId: string) {
	return adminDb
		.collection(PARENT_COLLECTION)
		.doc(memorialId)
		.collection(DRAFTS_COLLECTION)
		.doc(userId);
}

function mapSlideshow(id: string, data: Record<string, any>): SlideshowRecord {
	const record: SlideshowRecord = {
		...data,
		id,
		createdAt: toIso(data.createdAt),
		updatedAt: toIso(data.updatedAt)
	};
	if (data.unpublishedAt !== undefined) record.unpublishedAt = toIso(data.unpublishedAt);
	return record;
}

function mapDraft(data: Record<string, any>): SlideshowDraftRecord {
	return {
		...data,
		memorialId: data.memorialId,
		userId: data.userId,
		photos: data.photos || [],
		settings: data.settings || {},
		createdAt: toIso(data.createdAt),
		updatedAt: toIso(data.updatedAt),
		version: data.version
	};
}

export async function getSlideshow(
	memorialId: string,
	slideshowId: string
): Promise<SlideshowRecord | null> {
	const snap = await slideshowsRef(memorialId).doc(slideshowId).get();
	if (!snap.exists) return null;
	return mapSlideshow(snap.id, snap.data() || {});
}

/** All slideshows for a memorial, newest first (ordered by `createdAt`). */
export async function listSlideshows(memorialId: string): Promise<SlideshowRecord[]> {
	const snap = await slideshowsRef(memorialId).orderBy('createdAt', 'desc').get();
	return snap.docs.map((d) => mapSlideshow(d.id, d.data()));
}

/** All slideshows for a memorial in Firestore's default document order. */
export async function listAllSlideshows(memorialId: string): Promise<SlideshowRecord[]> {
	const snap = await slideshowsRef(memorialId).get();
	return snap.docs.map((d) => mapSlideshow(d.id, d.data()));
}

/** Most recently created slideshow for a memorial, or null. */
export async function getLatestSlideshow(memorialId: string): Promise<SlideshowRecord | null> {
	const snap = await slideshowsRef(memorialId).orderBy('createdAt', 'desc').limit(1).get();
	if (snap.empty) return null;
	return mapSlideshow(snap.docs[0].id, snap.docs[0].data());
}

/** Creates or fully replaces a slideshow document. */
export async function setSlideshow(
	memorialId: string,
	slideshowId: string,
	doc: Record<string, any>
): Promise<void> {
	await slideshowsRef(memorialId).doc(slideshowId).set(doc);
}

export async function updateSlideshowEmbedCode(
	memorialId: string,
	slideshowId: string,
	embedCode: string | null
): Promise<void> {
	await slideshowsRef(memorialId).doc(slideshowId).update({
		embedCode,
		updatedAt: new Date().toISOString()
	});
}

/**
 * Marks every slideshow with status `ready` or `processing` as `unpublished`.
 * Returns the number of slideshows updated (0 when none matched).
 */
export async function unpublishActiveSlideshows(memorialId: string): Promise<number> {
	const snap = await slideshowsRef(memorialId).where('status', 'in', ['ready', 'processing']).get();

	if (snap.empty) return 0;

	const batch = adminDb.batch();
	snap.docs.forEach((doc) => {
		batch.update(doc.ref, {
			status: 'unpublished',
			unpublishedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});
	});
	await batch.commit();

	return snap.docs.length;
}

// ---------------------------------------------------------------------------
// Drafts
// ---------------------------------------------------------------------------

export async function getSlideshowDraft(
	memorialId: string,
	userId: string
): Promise<SlideshowDraftRecord | null> {
	const snap = await draftRef(memorialId, userId).get();
	if (!snap.exists) return null;
	return mapDraft(snap.data() || {});
}

export async function saveSlideshowDraft(input: SlideshowDraftInput): Promise<void> {
	await draftRef(input.memorialId, input.userId).set({
		memorialId: input.memorialId,
		userId: input.userId,
		photos: input.photos,
		settings: input.settings,
		createdAt: new Date(),
		updatedAt: new Date(),
		version: input.version
	});
}

export async function deleteSlideshowDraft(memorialId: string, userId: string): Promise<void> {
	await draftRef(memorialId, userId).delete();
}
