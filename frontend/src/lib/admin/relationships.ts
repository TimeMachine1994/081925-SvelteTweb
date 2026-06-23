/**
 * Admin cross-collection relationship registry.
 *
 * Client-safe (no server / firebase-admin imports) so it can be used in both
 * Svelte components and server code. Describes how a field on one Firestore
 * document points at a document in another collection, and how to navigate
 * to that target (either a dedicated admin route or the generic DB browser).
 */

export type ReferenceLookup = 'id' | 'email';

export interface ReferenceTarget {
	/** Allowlisted Firestore collection the field points at. */
	collection: string;
	/** Whether the stored value is the target doc id or a field to query (e.g. email). */
	by: ReferenceLookup;
}

export interface ResolvedReference {
	collection: string;
	by: ReferenceLookup;
	/** The raw value (doc id for `id`, the queried value for `email`). */
	value: string;
	/** Dedicated admin route if one exists (only for direct id lookups). */
	route: string | null;
}

/**
 * Dedicated admin detail routes keyed by collection id. Collections not listed
 * here have no standalone page and are navigated via the DB browser instead.
 */
export const COLLECTION_ROUTES: Record<string, (id: string) => string> = {
	memorials: (id) => `/admin/services/memorials/${id}`,
	users: (id) => `/admin/users/memorial-owners/${id}`,
	blog: (id) => `/admin/content/blog/${id}`
};

/**
 * Field-name -> reference target. Field names follow the conventions observed
 * across the admin server loaders (memorialId, ownerUid, creatorEmail, ...).
 */
export const FIELD_REFERENCES: Record<string, ReferenceTarget> = {
	memorialId: { collection: 'memorials', by: 'id' },
	ownerUid: { collection: 'users', by: 'id' },
	createdBy: { collection: 'users', by: 'id' },
	userId: { collection: 'users', by: 'id' },
	invitedByUid: { collection: 'users', by: 'id' },
	requestedBy: { collection: 'users', by: 'id' },
	adminId: { collection: 'users', by: 'id' },
	deletedBy: { collection: 'users', by: 'id' },
	streamId: { collection: 'streams', by: 'id' },
	creatorEmail: { collection: 'users', by: 'email' },
	ownerEmail: { collection: 'users', by: 'email' }
};

/** Fields that are safe to use in an equality query for `by: 'email'` lookups. */
export const QUERYABLE_FIELDS = new Set(['email']);

/** Path to the generic database browser. */
export const DATABASE_BROWSER_PATH = '/admin/system/database';

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Resolve a conventional foreign-key field into a navigable reference.
 * Returns null when the field is not a known reference or the value is empty.
 */
export function resolveReference(key: string, value: unknown): ResolvedReference | null {
	const target = FIELD_REFERENCES[key];
	if (!target || !isNonEmptyString(value)) {
		return null;
	}

	const trimmed = value.trim();
	const route =
		target.by === 'id' && COLLECTION_ROUTES[target.collection]
			? COLLECTION_ROUTES[target.collection](trimmed)
			: null;

	return {
		collection: target.collection,
		by: target.by,
		value: trimmed,
		route
	};
}

interface SerializedReference {
	__type: 'reference';
	path: string;
}

function isSerializedReference(value: unknown): value is SerializedReference {
	return (
		!!value &&
		typeof value === 'object' &&
		(value as Record<string, unknown>).__type === 'reference' &&
		isNonEmptyString((value as Record<string, unknown>).path)
	);
}

/**
 * Resolve a serialized native Firestore reference value
 * (`{ __type: 'reference', path: 'collection/docId' }`) into a navigable reference.
 */
export function resolveNativeReference(value: unknown): ResolvedReference | null {
	if (!isSerializedReference(value)) {
		return null;
	}

	const segments = value.path.split('/').filter(Boolean);
	if (segments.length < 2) {
		return null;
	}

	// For nested paths take the final collection/doc pair.
	const documentId = segments[segments.length - 1];
	const collection = segments[segments.length - 2];

	return {
		collection,
		by: 'id',
		value: documentId,
		route: COLLECTION_ROUTES[collection] ? COLLECTION_ROUTES[collection](documentId) : null
	};
}

/**
 * Resolve either a conventional FK field or a native reference value.
 */
export function resolveAnyReference(key: string, value: unknown): ResolvedReference | null {
	return resolveNativeReference(value) ?? resolveReference(key, value);
}

/** Build a deep link into the generic DB browser. */
export function databaseDeepLink(
	collection: string,
	opts: { document?: string; field?: string; value?: string } = {}
): string {
	const params = new URLSearchParams({ collection });
	if (opts.document) params.set('document', opts.document);
	if (opts.field) params.set('field', opts.field);
	if (opts.value !== undefined) params.set('value', opts.value);
	return `${DATABASE_BROWSER_PATH}?${params.toString()}`;
}

/**
 * Best navigation target (href) for a resolved reference:
 * - dedicated route when available
 * - otherwise a DB browser deep link (by document id or by field query)
 */
export function referenceHref(ref: ResolvedReference): string {
	if (ref.route) {
		return ref.route;
	}
	if (ref.by === 'email') {
		return databaseDeepLink(ref.collection, { field: 'email', value: ref.value });
	}
	return databaseDeepLink(ref.collection, { document: ref.value });
}
