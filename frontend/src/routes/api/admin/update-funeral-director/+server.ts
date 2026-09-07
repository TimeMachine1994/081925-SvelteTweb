import { json } from '@sveltejs/kit';
import { getFuneralDirector, updateProfile } from '$lib/server/db/repos/funeralDirectors';

/**
 * UPDATE FUNERAL DIRECTOR
 * Admin endpoint to update funeral director information
 */
export async function POST({ request, locals }: any) {
	console.log('✏️ [ADMIN API] Update funeral director request received');

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
		const { directorId, updates } = await request.json();
		console.log('📝 [ADMIN API] Updating director:', directorId, 'with:', updates);

		if (!directorId) {
			return json({ error: 'Director ID is required' }, { status: 400 });
		}

		if (!updates || Object.keys(updates).length === 0) {
			return json({ error: 'No updates provided' }, { status: 400 });
		}

		// === UPDATE FUNERAL DIRECTOR ===
		const director = await getFuneralDirector(directorId);

		if (!director) {
			console.log('❌ [ADMIN API] Funeral director not found');
			return json({ error: 'Funeral director not found' }, { status: 404 });
		}

		// Update with timestamp
		await updateProfile(directorId, {
			...updates,
			updatedBy: locals.user.email
		});

		console.log('✅ [ADMIN API] Funeral director updated successfully');

		return json({
			success: true,
			message: 'Funeral director updated successfully',
			directorId
		});
	} catch (error: any) {
		console.error('💥 [ADMIN API] Error updating funeral director:', error);
		return json(
			{
				error: 'Failed to update funeral director',
				details: error.message
			},
			{ status: 500 }
		);
	}
}
