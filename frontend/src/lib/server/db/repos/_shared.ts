import { adminDb } from '$lib/server/firebase';
import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase-admin/firestore';

export { adminDb };

/**
 * Normalizes any Firestore/Date/string timestamp to an ISO string, or null.
 * Repos must never leak `Timestamp` objects to callers.
 */
export function toIso(value: unknown): string | null {
	if (!value) return null;
	if (typeof value === 'string') return value;
	if (value instanceof Date) return isNaN(value.getTime()) ? null : value.toISOString();
	const v = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
	if (typeof v.toDate === 'function') return v.toDate().toISOString();
	const seconds = v.seconds ?? v._seconds;
	if (typeof seconds === 'number') return new Date(seconds * 1000).toISOString();
	try {
		const d = new Date(value as string | number);
		return isNaN(d.getTime()) ? null : d.toISOString();
	} catch {
		return null;
	}
}

export function toIsoOrNow(value: unknown): string {
	return toIso(value) ?? new Date().toISOString();
}

function isTimestampLike(v: unknown): v is { toDate: () => Date } {
	return !!v && typeof v === 'object' && typeof (v as { toDate?: unknown }).toDate === 'function';
}

/**
 * Deep-converts every Firestore Timestamp / Date inside a document to an ISO
 * string, leaving all other values untouched. Use for loosely-typed documents
 * whose field set varies by call site (users, memorials legacy fields, ...).
 */
export function normalizeDoc<T = Record<string, any>>(value: unknown): T {
	if (value === null || value === undefined) return value as T;
	if (value instanceof Date || isTimestampLike(value)) return toIso(value) as unknown as T;
	if (Array.isArray(value)) return value.map((v) => normalizeDoc(v)) as unknown as T;
	if (typeof value === 'object') {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = normalizeDoc(v);
		return out as T;
	}
	return value as T;
}

export type Snap = DocumentSnapshot | QueryDocumentSnapshot;

export function docData<T = Record<string, any>>(snap: Snap): (T & { id: string }) | null {
	if (!snap.exists) return null;
	return { id: snap.id, ...(snap.data() as T) };
}

/** Removes `undefined` values so Firestore `set/update` don't reject them. */
export function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
	return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export function newId(): string {
	return adminDb.collection('_ids').doc().id;
}

export const nowIso = () => new Date().toISOString();
