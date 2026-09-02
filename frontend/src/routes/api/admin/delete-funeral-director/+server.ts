import { json } from '@sveltejs/kit';
import { adminDb, adminAuth } from '$lib/server/firebase';
import {
	getFuneralDirector,
	remove as removeFuneralDirector
} from '$lib/server/db/repos/funeralDirectors';

/**
 * DELETE FUNERAL DIRECTOR
 * Admin endpoint to delete funeral director account
 */
export async function POST({ request, locals }: any) {
	console.log('🗑️ [ADMIN API] Delete funeral director request received');

	try {
		// === AUTHENTICATION ===
		if (!locals.user) {
			console.log('🚫 [ADMIN API] No authenticated user');
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		if (locals.user.role !== 'admin') {
			console.log('🚫 [ADMIN API] User lacks admin privileges');
			return json({ error: 'Admin privileges required' }, { status: 403 });
		}

		// === PARSE REQUEST ===
		const { directorId } = await request.json();
		console.log('🗑️ [ADMIN API] Deleting director:', directorId);

		if (!directorId) {
			return json({ error: 'Director ID is required' }, { status: 400 });
		}

		// === GET FUNERAL DIRECTOR DATA ===
		const directorData = await getFuneralDirector(directorId);

		if (!directorData) {
			console.log('❌ [ADMIN API] Funeral director not found');
			return json({ error: 'Funeral director not found' }, { status: 404 });
		}

		// === DELETE FROM FIRESTORE ===
		await removeFuneralDirector(directorId);
		console.log('✅ [ADMIN API] Funeral director document deleted from Firestore');

		// === UPDATE USER ROLE (if user exists) ===
		// Find and update the associated user account to remove funeral_director role
		if (directorData?.email) {
			try {
				const usersQuery = await adminDb
					.collection('users')
					.where('email', '==', directorData.email)
					.limit(1)
					.get();

				if (!usersQuery.empty) {
					const userDoc = usersQuery.docs[0];
					await userDoc.ref.update({
						role: 'owner', // Downgrade to owner
						updatedAt: new Date()
					});

					// Update Firebase Auth custom claims
					try {
						const userRecord = await adminAuth.getUserByEmail(directorData.email);
						await adminAuth.setCustomUserClaims(userRecord.uid, {
							role: 'owner'
						});
						console.log('✅ [ADMIN API] User role downgraded to owner');
					} catch (authError) {
						console.log('⚠️ [ADMIN API] Could not update auth claims:', authError);
					}
				}
			} catch (userError) {
				console.log('⚠️ [ADMIN API] Could not update user role:', userError);
			}
		}

		console.log('✅ [ADMIN API] Funeral director deleted successfully');

		return json({
			success: true,
			message: 'Funeral director deleted successfully',
			directorId
		});
	} catch (error: any) {
		console.error('💥 [ADMIN API] Error deleting funeral director:', error);
		return json(
			{
				error: 'Failed to delete funeral director',
				details: error.message
			},
			{ status: 500 }
		);
	}
}
