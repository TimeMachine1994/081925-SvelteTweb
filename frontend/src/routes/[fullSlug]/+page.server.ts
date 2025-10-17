import { error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { fullSlug } = params;

	console.log('🏠 [MEMORIAL_PAGE] Loading memorial page for slug:', fullSlug);

	// Filter out non-memorial requests (service workers, assets, etc.)
	if (fullSlug.includes('.') || fullSlug.startsWith('_') || fullSlug === 'favicon.ico') {
		console.log('🏠 [MEMORIAL_PAGE] Skipping non-memorial request:', fullSlug);
		throw error(404, 'Not a memorial page');
	}

	try {
		// Find memorial by fullSlug only - no legacy slug fallback
		console.log('🏠 [MEMORIAL_PAGE] Querying memorials collection for fullSlug:', fullSlug);
		const memorialsRef = adminDb.collection('memorials');
		const snapshot = await memorialsRef.where('fullSlug', '==', fullSlug).limit(1).get();
		
		console.log('🏠 [MEMORIAL_PAGE] Memorial query completed, found docs:', snapshot.docs.length);

		if (snapshot.empty) {
			console.log('🏠 [MEMORIAL_PAGE] No memorial found for fullSlug:', fullSlug);
			throw error(404, 'Memorial not found');
		}

		const memorialDoc = snapshot.docs[0];
		const memorialData = memorialDoc.data();
		console.log('🏠 [MEMORIAL_PAGE] Memorial data keys:', Object.keys(memorialData));

		// Check if this is a legacy memorial - has custom_html and minimal structured content
		const isLegacyMemorial = !!(
			memorialData.custom_html && 
			memorialData.createdByUserId === 'MIGRATION_SCRIPT'
		);
		
		console.log('🏠 [MEMORIAL_PAGE] Memorial type:', isLegacyMemorial ? 'Legacy (custom_html)' : 'Standard');
		console.log('🏠 [MEMORIAL_PAGE] Has custom_html:', !!memorialData.custom_html);
		console.log('🏠 [MEMORIAL_PAGE] Created by migration:', memorialData.createdByUserId === 'MIGRATION_SCRIPT');

		// Helper function for defensive timestamp handling
		const convertTimestamp = (timestamp: any) => {
			if (!timestamp) return null;
			if (typeof timestamp === 'string') return timestamp;
			if (timestamp.toDate) return timestamp.toDate().toISOString();
			if (timestamp instanceof Date) return timestamp.toISOString();
			try {
				return new Date(timestamp).toISOString();
			} catch {
				return null;
			}
		};

		// Create memorial object with proper serialization (no Firestore objects)
		const memorial = {
			id: memorialDoc.id,
			lovedOneName: memorialData.lovedOneName || '',
			fullSlug: memorialData.fullSlug || fullSlug,
			content: memorialData.content || '',
			isPublic: memorialData.isPublic || false,
			services: memorialData.services || null,
			imageUrl: memorialData.imageUrl || null,
			birthDate: memorialData.birthDate || null,
			deathDate: memorialData.deathDate || null,
			photos: memorialData.photos || [],
			embeds: memorialData.embeds || [],
			familyContactName: memorialData.familyContactName || null,
			familyContactEmail: memorialData.familyContactEmail || null,
			familyContactPhone: memorialData.familyContactPhone || null,
			familyContactPreference: memorialData.familyContactPreference || null,
			funeralHomeName: memorialData.funeralHomeName || null,
			directorFullName: memorialData.directorFullName || null,
			directorEmail: memorialData.directorEmail || null,
			additionalNotes: memorialData.additionalNotes || null,
			custom_html: memorialData.custom_html || null,
			isLegacy: isLegacyMemorial,
			createdByUserId: memorialData.createdByUserId || null,
			// Convert Firestore timestamps to strings for serialization
			createdAt: convertTimestamp(memorialData.createdAt),
			updatedAt: convertTimestamp(memorialData.updatedAt)
		};

		console.log('🏠 [MEMORIAL_PAGE] Memorial found:', {
			id: memorial.id,
			lovedOneName: memorial.lovedOneName,
			fullSlug: memorial.fullSlug,
			isPublic: memorial.isPublic
		});

		// Load streams for this memorial
		console.log('🎬 [MEMORIAL_PAGE] Loading streams for memorial:', memorial.id);
		const streamsSnapshot = await adminDb
			.collection('streams')
			.where('memorialId', '==', memorial.id)
			.orderBy('createdAt', 'desc')
			.get();

		const streams = streamsSnapshot.docs
			.filter((doc) => {
				const data = doc.data();
				// Filter out hidden streams (isVisible === false)
				return data.isVisible !== false;
			})
			.map((doc) => {
				const data = doc.data();

				return {
					id: doc.id,
					title: data.title || `Stream ${doc.id.slice(-6)}`,
					description: data.description || '',
					memorialId: data.memorialId || memorial.id,

					// Status with fallback logic for legacy data
					status: data.status || (data.isLive ? 'live' : 'ready'),
					isVisible: data.isVisible !== false,

					// Cloudflare integration with multiple field name support
					cloudflareStreamId: data.cloudflareStreamId || data.streamId || null,
					cloudflareInputId: data.cloudflareInputId || data.inputId || null,

					// Legacy playback fields
					playbackUrl: data.playbackUrl || null,
					thumbnailUrl: data.thumbnailUrl || null,

					// Scheduling with proper timestamp conversion
					scheduledStartTime: convertTimestamp(data.scheduledStartTime),
					scheduledEndTime: convertTimestamp(data.scheduledEndTime),
					startedAt: convertTimestamp(data.startedAt),
					endedAt: convertTimestamp(data.endedAt),

					// Recording fields with intelligent fallbacks
					recordingUrl: data.recordingUrl || null, // Legacy field
					recordingPlaybackUrl: data.recordingPlaybackUrl || data.recordingUrl || null,
					recordingReady:
						data.recordingReady ||
						!!data.recordingUrl ||
						!!data.recordingPlaybackUrl ||
						!!data.cloudflareStreamId,
					recordingDuration: data.recordingDuration || null,
					recordingSize: data.recordingSize || null,
					recordingThumbnail: data.recordingThumbnail || data.thumbnailUrl || null,
					recordingProcessedAt: convertTimestamp(data.recordingProcessedAt),
					recordingCount: data.recordingCount || null,
					cloudflareRecordings: Array.isArray(data.cloudflareRecordings)
						? data.cloudflareRecordings
						: [],

					// Analytics with safe defaults
					viewerCount: typeof data.viewerCount === 'number' ? data.viewerCount : null,
					peakViewerCount: typeof data.peakViewerCount === 'number' ? data.peakViewerCount : null,
					totalViews: typeof data.totalViews === 'number' ? data.totalViews : null,

					// Metadata with defensive handling
					createdBy: data.createdBy || '',
					createdAt: convertTimestamp(data.createdAt) || new Date().toISOString(),
					updatedAt: convertTimestamp(data.updatedAt) || new Date().toISOString()
				};
			});

		console.log('🎬 [MEMORIAL_PAGE] Found', streams.length, 'visible streams');

		// Check if user has permission to view private memorial content
		const userId = locals.user?.uid;
		const userRole = locals.user?.role;
		const hasPermission = 
			memorial.isPublic === true || 
			userRole === 'admin' ||
			memorialData.ownerUid === userId ||
			memorialData.funeralDirectorUid === userId;

		console.log('🔒 [MEMORIAL_PAGE] Permission check:', {
			isPublic: memorial.isPublic,
			userId: userId || 'anonymous',
			userRole: userRole || 'none',
			hasPermission
		});

		// Security check: Only show full content to authorized users
		if (!hasPermission) {
			console.log('🔒 [MEMORIAL_PAGE] Memorial is private and user lacks permission, returning basic info only');
			return {
				memorial: {
					id: memorial.id,
					lovedOneName: memorial.lovedOneName,
					fullSlug: memorial.fullSlug,
					content: memorial.content,
					isPublic: false,
					services: null,
					imageUrl: memorial.imageUrl,
					birthDate: memorial.birthDate,
					deathDate: memorial.deathDate,
					createdAt: memorial.createdAt,
					updatedAt: memorial.updatedAt
				},
				streams: [] // No streams for unauthorized users
			};
		}

		// Return full memorial data and streams for authorized users
		return {
			memorial,
			streams
		};
	} catch (err: any) {
		console.error('🏠 [MEMORIAL_PAGE] Error loading memorial:', err);
		console.error('🏠 [MEMORIAL_PAGE] Error details:', {
			message: err?.message,
			code: err?.code,
			stack: err?.stack
		});
		
		// More specific error handling
		if (err?.code === 'permission-denied') {
			console.error('🏠 [MEMORIAL_PAGE] Firebase permission denied - check service account');
			throw error(500, 'Database access denied');
		} else if (err?.code === 'unavailable') {
			console.error('🏠 [MEMORIAL_PAGE] Firebase unavailable - connection issue');
			throw error(500, 'Database temporarily unavailable');
		} else {
			throw error(500, `Failed to load memorial: ${err?.message || 'Unknown error'}`);
		}
	}
};
