import { adminStorage } from '$lib/server/firebase';
import { slugify } from '$lib/utils/calculator';
import { adminDb, toIso, toIsoOrNow } from './_shared';

const COLLECTION = 'blog';

export interface BlogPost {
	id: string;
	title: string;
	slug: string;
	excerpt: string;
	content: string;
	authorName: string;
	authorEmail: string;
	authorBio: string;
	authorAvatar: string;
	featuredImage: string;
	featuredImageAlt: string;
	category: string;
	tags: string[];
	keywords: string[];
	status: string;
	featured: boolean;
	metaTitle: string;
	metaDescription: string;
	viewCount: number;
	readingTime: number;
	/** Legacy field still shown in the admin list. */
	author: string;
	publishedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export type BlogPostInput = Partial<
	Omit<BlogPost, 'id' | 'viewCount' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'author'>
>;

function mapPost(id: string, d: Record<string, any>): BlogPost {
	return {
		id,
		title: d.title || '',
		slug: d.slug || '',
		excerpt: d.excerpt || '',
		content: d.content || '',
		authorName: d.authorName || '',
		authorEmail: d.authorEmail || '',
		authorBio: d.authorBio || '',
		authorAvatar: d.authorAvatar || '',
		featuredImage: d.featuredImage || '',
		featuredImageAlt: d.featuredImageAlt || '',
		category: d.category || '',
		tags: d.tags || [],
		keywords: d.keywords || [],
		status: d.status || 'draft',
		featured: !!d.featured,
		metaTitle: d.metaTitle || '',
		metaDescription: d.metaDescription || '',
		viewCount: d.viewCount || 0,
		readingTime: d.readingTime || 0,
		author: d.author || '',
		publishedAt: toIso(d.publishedAt),
		createdAt: toIsoOrNow(d.createdAt),
		updatedAt: toIsoOrNow(d.updatedAt)
	};
}

/** Resolves a Firebase Storage path to a public URL (passes through full URLs). */
export async function resolveStorageUrl(storagePath: string): Promise<string> {
	if (!storagePath) return '';
	if (storagePath.startsWith('http')) return storagePath;
	try {
		const [url] = await adminStorage
			.bucket()
			.file(storagePath)
			.getSignedUrl({ action: 'read', expires: '03-09-2491' });
		return url;
	} catch (err) {
		console.error('Error getting storage URL for:', storagePath, err);
		// Never return a raw storage path (it would render as a broken relative URL)
		return `https://firebasestorage.googleapis.com/v0/b/${adminStorage.bucket().name}/o/${encodeURIComponent(storagePath)}?alt=media`;
	}
}

/** Normalizes slug and resolves image paths for public rendering. */
export async function preparePublicPost(post: BlogPost): Promise<BlogPost> {
	post.slug = slugify(post.slug || post.title || '');
	if (post.featuredImage) post.featuredImage = await resolveStorageUrl(post.featuredImage);
	if (post.authorAvatar) post.authorAvatar = await resolveStorageUrl(post.authorAvatar);
	return post;
}

export async function getPostById(id: string): Promise<BlogPost | null> {
	const snap = await adminDb.collection(COLLECTION).doc(id).get();
	return snap.exists ? mapPost(snap.id, snap.data() || {}) : null;
}

export async function findPostBySlug(slug: string, publishedOnly = true): Promise<BlogPost | null> {
	let q = adminDb.collection(COLLECTION).where('slug', '==', slug);
	if (publishedOnly) q = q.where('status', '==', 'published');
	const snap = await q.limit(1).get();
	return snap.empty ? null : mapPost(snap.docs[0].id, snap.docs[0].data());
}

/** Returns the id of the post owning `slug`, if any. */
export async function slugOwner(slug: string): Promise<string | null> {
	const snap = await adminDb.collection(COLLECTION).where('slug', '==', slug).limit(1).get();
	return snap.empty ? null : snap.docs[0].id;
}

export async function listPublished(limit = 20): Promise<BlogPost[]> {
	const snap = await adminDb
		.collection(COLLECTION)
		.where('status', '==', 'published')
		.limit(limit)
		.get();
	return snap.docs.map((d) => mapPost(d.id, d.data()));
}

export async function listRelated(
	category: string,
	excludeId: string,
	limit = 3
): Promise<BlogPost[]> {
	const snap = await adminDb
		.collection(COLLECTION)
		.where('status', '==', 'published')
		.where('category', '==', category)
		.orderBy('publishedAt', 'desc')
		.limit(limit + 1)
		.get();
	return snap.docs
		.map((d) => mapPost(d.id, d.data()))
		.filter((p) => p.id !== excludeId)
		.slice(0, limit);
}

export async function listAll(opts: {
	limit: number;
	sortBy: string;
	sortDir: 'asc' | 'desc';
}): Promise<BlogPost[]> {
	const snap = await adminDb
		.collection(COLLECTION)
		.orderBy(opts.sortBy, opts.sortDir)
		.limit(opts.limit)
		.get();
	return snap.docs.map((d) => mapPost(d.id, d.data()));
}

export async function createPost(input: Record<string, unknown>): Promise<string> {
	const ref = await adminDb.collection(COLLECTION).add(input);
	return ref.id;
}

export async function updatePost(id: string, patch: Record<string, unknown>): Promise<void> {
	await adminDb.collection(COLLECTION).doc(id).update(patch);
}

export async function deletePost(id: string): Promise<void> {
	await adminDb.collection(COLLECTION).doc(id).delete();
}
