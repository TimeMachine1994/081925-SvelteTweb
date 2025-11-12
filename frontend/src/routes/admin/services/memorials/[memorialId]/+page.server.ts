import { error, redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { PageServerLoad } from './$types';

/**
 * Memorial Detail Page Server Load
 * Loads comprehensive data for a single memorial including:
 * - Memorial document
 * - Associated streams
 * - Slideshows (subcollection)
 * - Followers count
 */
export const load: PageServerLoad = async ({ params, locals }) => {
	const { memorialId } = params;

	console.log('🏛️ [MEMORIAL DETAIL] Loading memorial:', memorialId);

	// Check authentication
	if (!locals.user || locals.user.role !== 'admin') {
		console.log('🚫 [MEMORIAL DETAIL] Unauthorized access attempt');
		throw redirect(302, '/admin');
	}

	try {
		// Load all data in parallel for performance
		const [memorialDoc, streamsSnap, slideshowsSnap, followersSnap] = await Promise.all([
			adminDb.collection('memorials').doc(memorialId).get(),
			adminDb.collection('streams').where('memorialId', '==', memorialId).get(),
			adminDb.collection('memorials').doc(memorialId).collection('slideshows').get(),
			adminDb.collection('memorials').doc(memorialId).collection('followers').get()
		]);

		// Check if memorial exists
		if (!memorialDoc.exists) {
			console.log('❌ [MEMORIAL DETAIL] Memorial not found:', memorialId);
			throw error(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();

		// Process memorial data
		const memorial = {
			id: memorialDoc.id,
			lovedOneName: memorialData.lovedOneName || 'Unknown',
			fullSlug: memorialData.fullSlug || '',
			createdBy: memorialData.createdBy || '',
			creatorEmail: memorialData.creatorEmail || '',
			creatorName: memorialData.creatorName || '',
			createdAt: memorialData.createdAt?.toDate?.()?.toISOString() || null,
			updatedAt: memorialData.updatedAt?.toDate?.()?.toISOString() || null,
			
			// Status flags
			isPublic: memorialData.isPublic !== false,
			isComplete: memorialData.isComplete || false,
			isDemo: memorialData.isDemo || false,
			
			// Services (new structure)
			services: memorialData.services || null,
			
			// Legacy service fields
			memorialDate: memorialData.memorialDate || null,
			memorialTime: memorialData.memorialTime || null,
			memorialLocationName: memorialData.memorialLocationName || null,
			memorialLocationAddress: memorialData.memorialLocationAddress || null,
			
			// Livestream legacy field (mostly replaced by streams collection)
			livestream: memorialData.livestream || null,
			
			// Calculator/Payment
			calculatorConfig: memorialData.calculatorConfig || null,
			isPaid: memorialData.isPaid || memorialData.calculatorConfig?.isPaid || false,
			paymentStatus: memorialData.calculatorConfig?.status || 'draft',
			totalPrice: memorialData.calculatorConfig?.totalPrice || 0,
			paymentDate: memorialData.calculatorConfig?.paymentDate?.toDate?.()?.toISOString() || null,
			
			// Demo fields
			demoSessionId: memorialData.demoSessionId || null,
			demoExpiresAt: memorialData.demoExpiresAt || null
		};

		// Process streams
		const streams = streamsSnap.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				title: data.title || 'Untitled Stream',
				description: data.description || '',
				status: data.status || 'scheduled',
				isVisible: data.isVisible !== false,
				scheduledStartTime: data.scheduledStartTime || null,
				startedAt: data.startedAt || null,
				endedAt: data.endedAt || null,
				
				// Streaming config
				streamingMethod: data.streamingMethod || null,
				cloudflareStreamId: data.cloudflareStreamId || null,
				rtmpUrl: data.rtmpUrl || null,
				streamKey: data.streamKey || null,
				playbackUrl: data.playbackUrl || null,
				
				// Phone source (dual stream)
				phoneSourceStreamId: data.phoneSourceStreamId || null,
				phoneSourcePlaybackUrl: data.phoneSourcePlaybackUrl || null,
				phoneSourceWhipUrl: data.phoneSourceWhipUrl || null,
				
				// Recording
				recordingReady: data.recordingReady || false,
				recordingUrl: data.recordingUrl || null,
				recordingPlaybackUrl: data.recordingPlaybackUrl || null,
				recordingDuration: data.recordingDuration || null,
				
				// Analytics
				viewerCount: data.viewerCount || 0,
				peakViewerCount: data.peakViewerCount || 0,
				totalViews: data.totalViews || 0,
				
				// Calculator linking
				calculatorServiceType: data.calculatorServiceType || null,
				calculatorServiceIndex: data.calculatorServiceIndex || null,
				
				createdAt: data.createdAt || null,
				updatedAt: data.updatedAt || null
			};
		});

		// Process slideshows
		const slideshows = slideshowsSnap.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
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
			};
		});

		// Get follower count
		const followerCount = followersSnap.size;

		console.log('✅ [MEMORIAL DETAIL] Data loaded successfully:', {
			memorialId,
			streams: streams.length,
			slideshows: slideshows.length,
			followers: followerCount
		});

		return {
			memorial,
			streams,
			slideshows,
			followerCount,
			adminUser: {
				email: locals.user.email,
				uid: locals.user.uid
			}
		};
	} catch (err: any) {
		console.error('💥 [MEMORIAL DETAIL] Error loading memorial:', {
			error: err.message,
			stack: err.stack,
			memorialId
		});

		// If it's already an error we threw, re-throw it
		if (err.status) {
			throw err;
		}

		// Otherwise return generic error
		throw error(500, `Failed to load memorial: ${err.message}`);
	}
};
