import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, normalizeDoc, stripUndefined } from './_shared';

const COLLECTION = 'users';

/**
 * User profile document, keyed by Firebase Auth UID. The field set has grown
 * organically across registration flows, so the record is intentionally loose;
 * all timestamp-like values are normalized to ISO strings.
 */
export interface UserRecord {
	id: string;
	email?: string | null;
	displayName?: string | null;
	role?: string;
	phone?: string | null;
	createdAt?: string | null;
	updatedAt?: string | null;
	lastLoginAt?: string | null;
	deleted?: boolean;
	suspended?: boolean;
	followedMemorials?: string[];
	[key: string]: unknown;
}

export interface ListUsersOptions {
	role?: string;
	limit?: number;
	sortBy?: string;
	sortDir?: 'asc' | 'desc';
}

function mapUser(id: string, data: Record<string, any>): UserRecord {
	return { id, ...normalizeDoc(data) };
}

export async function getUser(uid: string): Promise<UserRecord | null> {
	const snap = await adminDb.collection(COLLECTION).doc(uid).get();
	return snap.exists ? mapUser(snap.id, snap.data() || {}) : null;
}

export async function userExists(uid: string): Promise<boolean> {
	return (await adminDb.collection(COLLECTION).doc(uid).get()).exists;
}

export async function listUsers(opts: ListUsersOptions = {}): Promise<UserRecord[]> {
	let q: FirebaseFirestore.Query = adminDb.collection(COLLECTION);
	if (opts.role) q = q.where('role', '==', opts.role);
	if (opts.sortBy) q = q.orderBy(opts.sortBy, opts.sortDir ?? 'desc');
	if (opts.limit) q = q.limit(opts.limit);
	const snap = await q.get();
	return snap.docs.map((d) => mapUser(d.id, d.data()));
}

export async function countUsers(opts: { excludeDeleted?: boolean; createdAfter?: Date } = {}): Promise<number> {
	let q: FirebaseFirestore.Query = adminDb.collection(COLLECTION);
	if (opts.createdAfter) q = q.where('createdAt', '>=', opts.createdAfter);
	if (opts.excludeDeleted) q = q.where('deleted', '!=', true);
	if (!opts.createdAfter && !opts.excludeDeleted) return (await q.count().get()).data().count;
	return (await q.get()).size;
}

/** Creates or fully replaces the profile (merge=false) or shallow-merges (merge=true). */
export async function setUser(uid: string, data: Record<string, unknown>, merge = false): Promise<void> {
	await adminDb.collection(COLLECTION).doc(uid).set(stripUndefined(data), { merge });
}

/** Creates a profile with an auto-generated id (legacy AdminService.createUser). */
export async function createUserWithAutoId(data: Record<string, unknown>): Promise<string> {
	const ref = adminDb.collection(COLLECTION).doc();
	await ref.set(stripUndefined(data));
	return ref.id;
}

export async function updateUser(uid: string, patch: Record<string, unknown>): Promise<void> {
	await adminDb.collection(COLLECTION).doc(uid).update(stripUndefined(patch));
}

export async function deleteUser(uid: string): Promise<void> {
	await adminDb.collection(COLLECTION).doc(uid).delete();
}

/** Adds/removes a memorial from the user's followed list (user side of follow). */
export async function setFollowing(uid: string, memorialId: string, following: boolean): Promise<void> {
	await adminDb
		.collection(COLLECTION)
		.doc(uid)
		.update({
			followedMemorials: following ? FieldValue.arrayUnion(memorialId) : FieldValue.arrayRemove(memorialId)
		});
}
