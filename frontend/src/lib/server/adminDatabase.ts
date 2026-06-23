import admin from 'firebase-admin';
import { error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { AdminService } from '$lib/server/admin';

export type CollectionAccess = 'read-write' | 'read-only';

export interface CollectionConfig {
	id: string;
	label: string;
	description: string;
	access: CollectionAccess;
	softDelete: boolean;
	highRiskFields: string[];
}

export const DATABASE_COLLECTIONS: CollectionConfig[] = [
	{
		id: 'admin_actions',
		label: 'Admin Actions',
		description: 'Basic administrative action log',
		access: 'read-only',
		softDelete: false,
		highRiskFields: []
	},
	{
		id: 'admin_audit_logs',
		label: 'Admin Audit Logs',
		description: 'Detailed admin operation audit trail',
		access: 'read-only',
		softDelete: false,
		highRiskFields: []
	},
	{
		id: 'auditLogs',
		label: 'Audit Logs Legacy',
		description: 'Legacy/camelCase audit log collection',
		access: 'read-only',
		softDelete: false,
		highRiskFields: []
	},
	{
		id: 'audit_logs',
		label: 'Audit Logs',
		description: 'System-wide audit log collection',
		access: 'read-only',
		softDelete: false,
		highRiskFields: []
	},
	{
		id: 'blog',
		label: 'Blog',
		description: 'Blog posts and content records',
		access: 'read-write',
		softDelete: true,
		highRiskFields: ['status', 'slug', 'publishedAt']
	},
	{
		id: 'bookings',
		label: 'Bookings',
		description: 'Booking and calculator state records',
		access: 'read-write',
		softDelete: true,
		highRiskFields: ['paymentStatus', 'ownerUid', 'memorialId']
	},
	{
		id: 'demoSessions',
		label: 'Demo Sessions',
		description: 'Time-boxed demo mode sessions',
		access: 'read-write',
		softDelete: false,
		highRiskFields: ['status', 'expiresAt', 'createdBy']
	},
	{
		id: 'funeral_directors',
		label: 'Funeral Directors',
		description: 'Funeral director business profiles',
		access: 'read-write',
		softDelete: true,
		highRiskFields: ['status', 'uid', 'email']
	},
	{
		id: 'invoices',
		label: 'Invoices',
		description: 'Invoice and payment records',
		access: 'read-write',
		softDelete: true,
		highRiskFields: ['status', 'amount', 'paymentStatus', 'stripePaymentIntentId']
	},
	{
		id: 'livestreamConfigurations',
		label: 'Livestream Configurations',
		description: 'Calculator livestream configuration documents',
		access: 'read-write',
		softDelete: true,
		highRiskFields: ['memorialId', 'paymentStatus', 'isPaid']
	},
	{
		id: 'livestreams',
		label: 'Livestreams',
		description: 'Livestream records',
		access: 'read-write',
		softDelete: true,
		highRiskFields: ['status', 'streamId', 'playbackId', 'muxLiveStreamId']
	},
	{
		id: 'memorials',
		label: 'Memorials',
		description: 'Core memorial page records',
		access: 'read-write',
		softDelete: true,
		highRiskFields: ['role', 'ownerUid', 'creatorEmail', 'fullSlug', 'isPaid', 'paymentStatus']
	},
	{
		id: 'passwordResetTokens',
		label: 'Password Reset Tokens',
		description: 'Server-side password reset workflow tokens',
		access: 'read-only',
		softDelete: false,
		highRiskFields: []
	},
	{
		id: 'stream_events',
		label: 'Stream Events',
		description: 'Stream event telemetry and status history',
		access: 'read-only',
		softDelete: false,
		highRiskFields: []
	},
	{
		id: 'streams',
		label: 'Streams',
		description: 'Stream control and recording documents',
		access: 'read-write',
		softDelete: true,
		highRiskFields: ['status', 'streamId', 'playbackId', 'muxLiveStreamId', 'memorialId']
	},
	{
		id: 'users',
		label: 'Users',
		description: 'User profile and role documents',
		access: 'read-write',
		softDelete: true,
		highRiskFields: ['role', 'isAdmin', 'email', 'uid', 'suspended']
	},
	{
		id: 'wiki_pages',
		label: 'Wiki Pages',
		description: 'Internal admin wiki pages',
		access: 'read-write',
		softDelete: true,
		highRiskFields: ['slug', 'status', 'publishedAt']
	}
];

const COLLECTION_MAP = new Map(DATABASE_COLLECTIONS.map((collection) => [collection.id, collection]));

export function requireAdmin(locals: App.Locals) {
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}
	return locals.user;
}

export function getCollectionConfig(collectionId: string): CollectionConfig {
	const config = COLLECTION_MAP.get(collectionId);
	if (!config) {
		throw error(400, 'Collection is not allowlisted');
	}
	return config;
}

export function assertWritable(config: CollectionConfig) {
	if (config.access !== 'read-write') {
		throw error(403, 'Collection is read-only');
	}
}

export function assertDocumentId(documentId: string) {
	if (!documentId || documentId.includes('/')) {
		throw error(400, 'Invalid document ID');
	}
}

export function serializeFirestoreValue(value: any): any {
	if (value === null || value === undefined) {
		return value ?? null;
	}
	if (value instanceof admin.firestore.Timestamp) {
		return { __type: 'timestamp', value: value.toDate().toISOString() };
	}
	if (value instanceof Date) {
		return { __type: 'date', value: value.toISOString() };
	}
	if (value instanceof admin.firestore.DocumentReference) {
		return { __type: 'reference', path: value.path };
	}
	if (value instanceof admin.firestore.GeoPoint) {
		return { __type: 'geopoint', latitude: value.latitude, longitude: value.longitude };
	}
	if (Array.isArray(value)) {
		return value.map(serializeFirestoreValue);
	}
	if (typeof value === 'object') {
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializeFirestoreValue(item)]));
	}
	return value;
}

export function deserializeEditableValue(value: any): any {
	if (value === null || value === undefined) {
		return value ?? null;
	}
	if (Array.isArray(value)) {
		return value.map(deserializeEditableValue);
	}
	if (typeof value === 'object') {
		if (value.__type === 'timestamp' && typeof value.value === 'string') {
			return admin.firestore.Timestamp.fromDate(new Date(value.value));
		}
		if (value.__type === 'date' && typeof value.value === 'string') {
			return new Date(value.value);
		}
		if (value.__type === 'reference' && typeof value.path === 'string') {
			return adminDb.doc(value.path);
		}
		if (
			value.__type === 'geopoint' &&
			typeof value.latitude === 'number' &&
			typeof value.longitude === 'number'
		) {
			return new admin.firestore.GeoPoint(value.latitude, value.longitude);
		}
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deserializeEditableValue(item)]));
	}
	return value;
}

export async function listDocuments(collectionId: string, limitValue: number) {
	const config = getCollectionConfig(collectionId);
	const cappedLimit = Math.max(1, Math.min(limitValue || 25, 100));
	const snapshot = await adminDb.collection(collectionId).limit(cappedLimit).get();
	return {
		collection: config,
		documents: snapshot.docs.map((doc) => ({
			id: doc.id,
			path: doc.ref.path,
			data: serializeFirestoreValue(doc.data())
		}))
	};
}

/** Fields permitted in an equality query for reference resolution. */
const QUERYABLE_FIELDS = new Set(['email', 'uid', 'memorialId', 'ownerUid', 'fullSlug']);

export async function findDocumentByField(collectionId: string, field: string, value: string) {
	const config = getCollectionConfig(collectionId);
	if (!QUERYABLE_FIELDS.has(field)) {
		throw error(400, 'Field is not queryable');
	}
	if (!value) {
		throw error(400, 'A value is required');
	}
	const snapshot = await adminDb.collection(collectionId).where(field, '==', value).limit(1).get();
	if (snapshot.empty) {
		throw error(404, 'No matching document found');
	}
	const doc = snapshot.docs[0];
	return {
		collection: config,
		document: {
			id: doc.id,
			path: doc.ref.path,
			data: serializeFirestoreValue(doc.data())
		}
	};
}

export async function getDocument(collectionId: string, documentId: string) {
	const config = getCollectionConfig(collectionId);
	assertDocumentId(documentId);
	const doc = await adminDb.collection(collectionId).doc(documentId).get();
	if (!doc.exists) {
		throw error(404, 'Document not found');
	}
	const subcollections = await doc.ref.listCollections();
	return {
		collection: config,
		document: {
			id: doc.id,
			path: doc.ref.path,
			data: serializeFirestoreValue(doc.data())
		},
		subcollections: subcollections.map((collection) => collection.id)
	};
}

export async function createDocument(collectionId: string, documentId: string | undefined, data: any, adminUser: any) {
	const config = getCollectionConfig(collectionId);
	assertWritable(config);
	if (documentId) {
		assertDocumentId(documentId);
	}
	const ref = documentId
		? adminDb.collection(collectionId).doc(documentId)
		: adminDb.collection(collectionId).doc();
	await ref.set({
		...deserializeEditableValue(data),
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
		updatedAt: admin.firestore.FieldValue.serverTimestamp()
	});
	await AdminService.logAdminAction(adminUser.uid, 'database_document_created', collectionId, ref.id, {
		path: ref.path
	});
	return ref.id;
}

export async function updateDocument(collectionId: string, documentId: string, data: any, adminUser: any) {
	const config = getCollectionConfig(collectionId);
	assertWritable(config);
	assertDocumentId(documentId);
	const ref = adminDb.collection(collectionId).doc(documentId);
	await ref.set({
		...deserializeEditableValue(data),
		updatedAt: admin.firestore.FieldValue.serverTimestamp()
	});
	await AdminService.logAdminAction(adminUser.uid, 'database_document_updated', collectionId, documentId, {
		path: ref.path
	});
}

export async function deleteDocument(
	collectionId: string,
	documentId: string,
	mode: 'soft' | 'hard',
	adminUser: any
) {
	const config = getCollectionConfig(collectionId);
	assertWritable(config);
	assertDocumentId(documentId);
	const ref = adminDb.collection(collectionId).doc(documentId);
	if (mode === 'hard' || !config.softDelete) {
		await ref.delete();
	} else {
		await ref.set(
			{
				isDeleted: true,
				deleted: true,
				deletedAt: admin.firestore.FieldValue.serverTimestamp(),
				deletedBy: adminUser.uid,
				updatedAt: admin.firestore.FieldValue.serverTimestamp()
			},
			{ merge: true }
		);
	}
	await AdminService.logAdminAction(adminUser.uid, 'database_document_deleted', collectionId, documentId, {
		path: ref.path,
		mode
	});
}
