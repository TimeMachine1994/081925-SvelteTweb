import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/firebase-admin';

// GET - List all memorials
export const GET: RequestHandler = async ({ cookies, url }) => {
	console.log('📝 [ADMIN API] GET memorials request');

	try {
		// Verify admin authentication
		const sessionCookie = cookies.get('session');
		if (!sessionCookie) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
		if (!decodedClaims.admin) {
			return json({ error: 'Not authorized' }, { status: 403 });
		}

		// Get pagination parameters
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const search = url.searchParams.get('search') || '';

		// Build query
		let query = adminDb.collection('memorials').orderBy('createdAt', 'desc');

		// Apply search filter if provided
		if (search) {
			query = query.where('lovedOneName', '>=', search)
						 .where('lovedOneName', '<=', search + '\uf8ff');
		}

		// Apply pagination
		const offset = (page - 1) * limit;
		query = query.offset(offset).limit(limit);

		const snapshot = await query.get();
		const memorials = snapshot.docs.map(doc => ({
			id: doc.id,
			...doc.data(),
			createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
		}));

		console.log(`✅ [ADMIN API] Retrieved ${memorials.length} memorials`);

		return json({
			memorials,
			pagination: {
				page,
				limit,
				total: snapshot.size,
				hasMore: snapshot.size === limit
			}
		});

	} catch (error) {
		console.error('❌ [ADMIN API] Error fetching memorials:', error);
		return json({ error: 'Failed to fetch memorials' }, { status: 500 });
	}
};

// POST - Create new memorial
export const POST: RequestHandler = async ({ cookies, request }) => {
	console.log('📝 [ADMIN API] POST memorial request');

	try {
		// Verify admin authentication
		const sessionCookie = cookies.get('session');
		if (!sessionCookie) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
		if (!decodedClaims.admin) {
			return json({ error: 'Not authorized' }, { status: 403 });
		}

		const body = await request.json();
		const { lovedOneName, creatorEmail, creatorName, isPublic = false } = body;

		if (!lovedOneName || !creatorEmail) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Generate slug and fullSlug
		const slug = lovedOneName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
		const fullSlug = `memorial-for-${slug}`;

		// Create memorial document
		const memorialData = {
			lovedOneName,
			creatorEmail,
			creatorName: creatorName || '',
			slug,
			fullSlug,
			isPublic,
			createdAt: new Date(),
			createdByUserId: 'ADMIN_CREATED',
			creatorRole: 'admin',
			adminCreated: true
		};

		const docRef = await adminDb.collection('memorials').add(memorialData);

		console.log('✅ [ADMIN API] Memorial created:', docRef.id);

		return json({
			success: true,
			memorialId: docRef.id,
			memorial: { id: docRef.id, ...memorialData }
		});

	} catch (error) {
		console.error('❌ [ADMIN API] Error creating memorial:', error);
		return json({ error: 'Failed to create memorial' }, { status: 500 });
	}
};

// PUT - Update memorial
export const PUT: RequestHandler = async ({ cookies, request }) => {
	console.log('📝 [ADMIN API] PUT memorial request');

	try {
		// Verify admin authentication
		const sessionCookie = cookies.get('session');
		if (!sessionCookie) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
		if (!decodedClaims.admin) {
			return json({ error: 'Not authorized' }, { status: 403 });
		}

		const body = await request.json();
		const { id, ...updateData } = body;

		if (!id) {
			return json({ error: 'Memorial ID is required' }, { status: 400 });
		}

		// Update memorial document
		await adminDb.collection('memorials').doc(id).update({
			...updateData,
			updatedAt: new Date(),
			updatedBy: decodedClaims.uid
		});

		console.log('✅ [ADMIN API] Memorial updated:', id);

		return json({ success: true, memorialId: id });

	} catch (error) {
		console.error('❌ [ADMIN API] Error updating memorial:', error);
		return json({ error: 'Failed to update memorial' }, { status: 500 });
	}
};

// DELETE - Delete memorial
export const DELETE: RequestHandler = async ({ cookies, url }) => {
	console.log('📝 [ADMIN API] DELETE memorial request');

	try {
		// Verify admin authentication
		const sessionCookie = cookies.get('session');
		if (!sessionCookie) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
		if (!decodedClaims.admin) {
			return json({ error: 'Not authorized' }, { status: 403 });
		}

		const memorialId = url.searchParams.get('id');
		if (!memorialId) {
			return json({ error: 'Memorial ID is required' }, { status: 400 });
		}

		// Delete memorial document
		await adminDb.collection('memorials').doc(memorialId).delete();

		console.log('✅ [ADMIN API] Memorial deleted:', memorialId);

		return json({ success: true, memorialId });

	} catch (error) {
		console.error('❌ [ADMIN API] Error deleting memorial:', error);
		return json({ error: 'Failed to delete memorial' }, { status: 500 });
	}
};
