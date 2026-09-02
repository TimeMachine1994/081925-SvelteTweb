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
