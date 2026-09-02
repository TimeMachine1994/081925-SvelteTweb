import type { WikiPage } from '$lib/types/wiki';
import { adminDb, toIsoOrNow } from './_shared';

const COLLECTION = 'wiki_pages';

export interface WikiPageInput {
	slug: string;
	title: string;
	content: string;
	category: string | null;
	tags: string[];
	userId: string;
	userEmail: string;
}

function mapPage(id: string, data: Record<string, any>): WikiPage {
	return {
		id,
		slug: data.slug,
		title: data.title,
		content: data.content,
		category: data.category || null,
		tags: data.tags || [],
		createdBy: data.createdBy,
		createdByEmail: data.createdByEmail,
		createdAt: toIsoOrNow(data.createdAt),
		updatedBy: data.updatedBy,
		updatedByEmail: data.updatedByEmail,
		updatedAt: toIsoOrNow(data.updatedAt),
		version: data.version || 1,
		viewCount: data.viewCount || 0,
		parentPageId: data.parentPageId || null,
		order: data.order || 0
	};
}

export async function listPages(): Promise<WikiPage[]> {
	const snap = await adminDb.collection(COLLECTION).get();
	return snap.docs
		.map((d) => mapPage(d.id, d.data()))
		.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/** title(lowercase) -> slug, used to resolve [[wiki links]]. */
export async function getTitleSlugMap(): Promise<Record<string, string>> {
	const pages = await listPages();
	return Object.fromEntries(pages.map((p) => [p.title.toLowerCase(), p.slug]));
}

export async function getPageBySlug(slug: string): Promise<WikiPage | null> {
	const snap = await adminDb.collection(COLLECTION).where('slug', '==', slug).limit(1).get();
	if (snap.empty) return null;
	return mapPage(snap.docs[0].id, snap.docs[0].data());
}

export async function slugExists(slug: string): Promise<boolean> {
	const snap = await adminDb.collection(COLLECTION).where('slug', '==', slug).limit(1).get();
	return !snap.empty;
}

export async function createPage(input: WikiPageInput): Promise<string> {
	const now = new Date();
	const ref = await adminDb.collection(COLLECTION).add({
		slug: input.slug,
		title: input.title,
		content: input.content,
		category: input.category,
		tags: input.tags,
		createdBy: input.userId,
		createdByEmail: input.userEmail,
		createdAt: now,
		updatedBy: input.userId,
		updatedByEmail: input.userEmail,
		updatedAt: now,
		version: 1,
		viewCount: 0,
		parentPageId: null,
		order: 0
	});
	return ref.id;
}

export async function updatePage(
	id: string,
	input: WikiPageInput & { version: number }
): Promise<void> {
	await adminDb.collection(COLLECTION).doc(id).update({
		slug: input.slug,
		title: input.title,
		content: input.content,
		category: input.category,
		tags: input.tags,
		updatedBy: input.userId,
		updatedByEmail: input.userEmail,
		updatedAt: new Date(),
		version: input.version
	});
}

export async function incrementViewCount(id: string, current: number): Promise<void> {
	await adminDb
		.collection(COLLECTION)
		.doc(id)
		.update({ viewCount: current + 1 });
}

export async function deletePage(id: string): Promise<void> {
	await adminDb.collection(COLLECTION).doc(id).delete();
}
