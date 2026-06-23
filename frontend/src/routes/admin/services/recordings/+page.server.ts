import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

/**
 * Standalone Recording Picker page.
 *
 * Lists memorials for selection; when `?memorialId=` is present, also loads that
 * memorial's streams (with Mux recording data) for the RecordingPicker.
 */
export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Unauthorized access');
	}

	const toISO = (val: unknown): string | null => {
		if (!val) return null;
		// Firestore Timestamp
		if (typeof val === 'object' && val !== null && 'toDate' in val) {
			try {
				return (val as { toDate: () => Date }).toDate().toISOString();
			} catch {
				return null;
			}
		}
		if (val instanceof Date) return val.toISOString();
		if (typeof val === 'string') return val;
		return null;
	};

	// Load a bounded set of memorials for the picker (sorted client-side by name).
	const memSnap = await adminDb.collection('memorials').limit(300).get();
	const memorials = memSnap.docs
		.filter((d) => d.data().isDeleted !== true)
		.map((d) => {
			const data = d.data();
			return {
				id: d.id,
				lovedOneName: data.lovedOneName || 'Unknown',
				fullSlug: data.fullSlug || null,
				createdAt: toISO(data.createdAt)
			};
		})
		.sort((a, b) => a.lovedOneName.localeCompare(b.lovedOneName));

	interface Recording {
		assetId: string;
		vodPlaybackId: string;
		duration?: number;
		createdAt: string;
	}

	const selectedId = url.searchParams.get('memorialId');
	let selectedMemorial: { id: string; lovedOneName: string; fullSlug: string | null } | null = null;
	let streams: Array<{
		id: string;
		title: string;
		status: string;
		mux: {
			recordings: Recording[];
			vodPlaybackId: string | null;
			publishedRecordings: string[];
		} | null;
	}> = [];

	if (selectedId) {
		const memDoc = await adminDb.collection('memorials').doc(selectedId).get();
		if (!memDoc.exists) {
			throw error(404, 'Memorial not found');
		}
		const memData = memDoc.data() || {};
		selectedMemorial = {
			id: memDoc.id,
			lovedOneName: memData.lovedOneName || 'Unknown',
			fullSlug: memData.fullSlug || null
		};

		const streamsSnap = await adminDb
			.collection('streams')
			.where('memorialId', '==', selectedId)
			.get();

		streams = streamsSnap.docs
			.filter((d) => d.data().isDeleted !== true)
			.map((d) => {
				const data = d.data();
				const mux = data.mux;
				return {
					id: d.id,
					title: data.title || 'Untitled Stream',
					status: data.status || 'unknown',
					mux: mux
						? {
								recordings: Array.isArray(mux.recordings) ? mux.recordings : [],
								vodPlaybackId: mux.vodPlaybackId || null,
								publishedRecordings: Array.isArray(mux.publishedRecordings)
									? mux.publishedRecordings
									: []
							}
						: null
				};
			});
	}

	return { memorials, selectedMemorial, streams };
};
