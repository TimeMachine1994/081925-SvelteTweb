import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/firebase-admin';

// GET - List all users
export const GET: RequestHandler = async ({ cookies, url }) => {
	console.log('👥 [ADMIN API] GET users request');

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
		const role = url.searchParams.get('role') || '';

		// Build query
		let query = adminDb.collection('users').orderBy('createdAt', 'desc');

		// Apply role filter if provided
		if (role) {
			query = query.where('role', '==', role);
		}

		// Apply pagination
		const offset = (page - 1) * limit;
		query = query.offset(offset).limit(limit);

		const snapshot = await query.get();
		const users = snapshot.docs.map(doc => ({
			id: doc.id,
			...doc.data(),
			createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
		}));

		console.log(`✅ [ADMIN API] Retrieved ${users.length} users`);

		return json({
			users,
			pagination: {
				page,
				limit,
				total: snapshot.size,
				hasMore: snapshot.size === limit
			}
		});

	} catch (error) {
		console.error('❌ [ADMIN API] Error fetching users:', error);
		return json({ error: 'Failed to fetch users' }, { status: 500 });
	}
};

// POST - Create new user
export const POST: RequestHandler = async ({ cookies, request }) => {
	console.log('👥 [ADMIN API] POST user request');

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
		const { email, displayName, role = 'viewer', password } = body;

		if (!email || !displayName) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Create Firebase Auth user
		const userRecord = await adminAuth.createUser({
			email,
			displayName,
			password: password || 'TempPassword123!', // Generate temp password if not provided
			emailVerified: true
		});

		// Set custom claims for role
		await adminAuth.setCustomUserClaims(userRecord.uid, { [role]: true });

		// Create user document in Firestore
		const userData = {
			email,
			displayName,
			role,
			createdAt: new Date(),
			createdBy: decodedClaims.uid,
			adminCreated: true,
			isActive: true
		};

		await adminDb.collection('users').doc(userRecord.uid).set(userData);

		console.log('✅ [ADMIN API] User created:', userRecord.uid);

		return json({
			success: true,
			userId: userRecord.uid,
			user: { id: userRecord.uid, ...userData }
		});

	} catch (error) {
		console.error('❌ [ADMIN API] Error creating user:', error);
		return json({ error: 'Failed to create user' }, { status: 500 });
	}
};

// PUT - Update user
export const PUT: RequestHandler = async ({ cookies, request }) => {
	console.log('👥 [ADMIN API] PUT user request');

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
		const { id, email, displayName, role, isActive, ...otherData } = body;

		if (!id) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		// Update Firebase Auth user
		const updateAuthData: any = {};
		if (email) updateAuthData.email = email;
		if (displayName) updateAuthData.displayName = displayName;
		if (isActive !== undefined) updateAuthData.disabled = !isActive;

		if (Object.keys(updateAuthData).length > 0) {
			await adminAuth.updateUser(id, updateAuthData);
		}

		// Update custom claims if role changed
		if (role) {
			const customClaims: any = {};
			customClaims[role] = true;
			await adminAuth.setCustomUserClaims(id, customClaims);
		}

		// Update user document in Firestore
		const updateData = {
			...otherData,
			updatedAt: new Date(),
			updatedBy: decodedClaims.uid
		};

		if (email) updateData.email = email;
		if (displayName) updateData.displayName = displayName;
		if (role) updateData.role = role;
		if (isActive !== undefined) updateData.isActive = isActive;

		await adminDb.collection('users').doc(id).update(updateData);

		console.log('✅ [ADMIN API] User updated:', id);

		return json({ success: true, userId: id });

	} catch (error) {
		console.error('❌ [ADMIN API] Error updating user:', error);
		return json({ error: 'Failed to update user' }, { status: 500 });
	}
};

// DELETE - Delete user
export const DELETE: RequestHandler = async ({ cookies, url }) => {
	console.log('👥 [ADMIN API] DELETE user request');

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

		const userId = url.searchParams.get('id');
		if (!userId) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		// Delete Firebase Auth user
		await adminAuth.deleteUser(userId);

		// Delete user document from Firestore
		await adminDb.collection('users').doc(userId).delete();

		console.log('✅ [ADMIN API] User deleted:', userId);

		return json({ success: true, userId });

	} catch (error) {
		console.error('❌ [ADMIN API] Error deleting user:', error);
		return json({ error: 'Failed to delete user' }, { status: 500 });
	}
};
