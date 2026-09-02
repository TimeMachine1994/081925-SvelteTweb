import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFuneralDirector, updateProfile } from '$lib/server/db/repos/funeralDirectors';
import type { FuneralDirector } from '$lib/types/funeral-director';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const funeralDirector = (await getFuneralDirector(locals.user.uid)) as FuneralDirector | null;

		if (!funeralDirector) {
			return json({ error: 'Funeral director profile not found' }, { status: 404 });
		}

		return json(funeralDirector);
	} catch (error) {
		console.error('Error fetching funeral director profile:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const updates = await request.json();

		// Remove fields that shouldn't be updated directly
		delete updates.id;
		delete updates.createdAt;
		delete updates.status;
		delete updates.verificationStatus;
		delete updates.permissions;

		// Repo stamps updatedAt
		await updateProfile(locals.user.uid, updates);

		return json({ success: true, message: 'Profile updated successfully' });
	} catch (error) {
		console.error('Error updating funeral director profile:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
