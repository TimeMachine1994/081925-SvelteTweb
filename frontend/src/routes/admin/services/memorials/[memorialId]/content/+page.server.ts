import { listAllSlideshows } from '$lib/server/db/repos/slideshows';
import type { PageServerLoad } from './$types';

/**
 * Content section — the only place slideshows are loaded. Kept out of the
 * shared layout load so Overview/Broadcast/Chat/Billing/Settings don't pay
 * for a subcollection read they never render.
 */
export const load: PageServerLoad = async ({ params }) => {
	const { memorialId } = params;

	const slideshowRecords = await listAllSlideshows(memorialId);

	const slideshows = slideshowRecords.map((data) => ({
		id: data.id,
		title: data.title || 'Untitled Slideshow',
		status: data.status || 'ready',
		playbackUrl: data.playbackUrl || null,
		thumbnailUrl: data.thumbnailUrl || null,
		photos: data.photos || [],
		audio: data.audio || null,
		settings: data.settings || {},
		createdBy: data.createdBy || '',
		createdAt: data.createdAt || null,
		updatedAt: data.updatedAt || null
	}));

	return { slideshows };
};
