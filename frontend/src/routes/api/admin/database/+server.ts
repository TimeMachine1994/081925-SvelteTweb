import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	DATABASE_COLLECTIONS,
	createDocument,
	deleteDocument,
	findDocumentByField,
	getDocument,
	listDocuments,
	requireAdmin,
	updateDocument
} from '$lib/server/adminDatabase';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		requireAdmin(locals);
		const collectionId = url.searchParams.get('collection');
		const documentId = url.searchParams.get('document');
		const field = url.searchParams.get('field');
		const value = url.searchParams.get('value');
		const limit = Number(url.searchParams.get('limit') || '25');

		if (!collectionId) {
			return json({ collections: DATABASE_COLLECTIONS });
		}

		if (field && value !== null) {
			return json(await findDocumentByField(collectionId, field, value));
		}

		if (documentId) {
			return json(await getDocument(collectionId, documentId));
		}

		return json(await listDocuments(collectionId, limit));
	} catch (err: any) {
		const status = err?.status || 500;
		return json({ error: err?.body?.message || err?.message || 'Database request failed' }, { status });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const adminUser = requireAdmin(locals);
		const body = await request.json();
		const documentId = await createDocument(body.collection, body.documentId || undefined, body.data || {}, adminUser);
		return json({ success: true, documentId });
	} catch (err: any) {
		const status = err?.status || 500;
		return json({ error: err?.body?.message || err?.message || 'Document create failed' }, { status });
	}
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	try {
		const adminUser = requireAdmin(locals);
		const body = await request.json();
		await updateDocument(body.collection, body.documentId, body.data || {}, adminUser);
		return json({ success: true });
	} catch (err: any) {
		const status = err?.status || 500;
		return json({ error: err?.body?.message || err?.message || 'Document update failed' }, { status });
	}
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	try {
		const adminUser = requireAdmin(locals);
		const body = await request.json();
		await deleteDocument(body.collection, body.documentId, body.mode === 'hard' ? 'hard' : 'soft', adminUser);
		return json({ success: true });
	} catch (err: any) {
		const status = err?.status || 500;
		return json({ error: err?.body?.message || err?.message || 'Document delete failed' }, { status });
	}
};
