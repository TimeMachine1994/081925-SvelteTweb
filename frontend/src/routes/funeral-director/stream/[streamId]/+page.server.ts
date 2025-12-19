import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/firebase';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirect=/funeral-director/stream');
	}

	if (locals.user.role !== 'funeral_director') {
		throw redirect(303, '/profile?error=funeral-director-only');
	}

	try {
		const streamRef = adminDb.collection('streams').doc(params.streamId);
		const streamDoc = await streamRef.get();

		if (!streamDoc.exists) {
			throw error(404, 'Stream not found');
		}

		const stream = streamDoc.data();

		if (stream.funeralDirectorUid !== locals.user.uid) {
			throw error(403, 'Not authorized to access this stream');
		}

		const memorialRef = adminDb.collection('memorials').doc(stream.memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data();

		return {
			stream: {
				id: params.streamId,
				memorialId: stream.memorialId,
				status: stream.status,
				config: stream.methodConfig,
				playbackUrl: stream.playbackUrl,
				streamTitle: stream.streamTitle,
				createdAt: stream.createdAt?.toDate().toISOString() || new Date().toISOString(),
				startedAt: stream.startedAt?.toDate().toISOString() || null,
				viewerCount: stream.viewerCount || 0,
				peakViewerCount: stream.peakViewerCount || 0
			},
			memorial: {
				id: stream.memorialId,
				lovedOneName: memorial.lovedOneName,
				fullSlug: memorial.fullSlug,
				services: {
					main: {
						location: {
							name: memorial.services?.main?.location?.name || 'Location TBD'
						}
					}
				}
			}
		};
	} catch (err: any) {
		console.error('Error loading stream:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, 'Failed to load stream');
	}
};
