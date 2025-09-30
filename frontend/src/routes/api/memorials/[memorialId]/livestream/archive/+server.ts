import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase-admin';
import { requireLivestreamAccess, createMemorialRequest } from '$lib/server/memorialMiddleware';

/**
 * Get livestream archive for a memorial
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	console.log('📊 Get livestream archive for memorial:', params.memorialId);

	try {
		const { memorialId } = params;
		
		// For archive viewing, we allow broader access than livestream control
		// Public users can view visible archive entries
		const memorialRequest = createMemorialRequest(memorialId, locals);
		
		let hasControlAccess = false;
		try {
			const accessResult = await requireLivestreamAccess(memorialRequest);
			hasControlAccess = true;
			console.log('✅ Full archive access verified:', accessResult.reason);
		} catch {
			// User doesn't have control access, but can still view public archive entries
			console.log('📊 Public archive access - showing visible entries only');
		}

		// Get memorial document for validation
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		// Query streams collection directly instead of reading from livestreamArchive array
		// This prevents document size limit issues and provides real-time data
		let query = adminDb.collection('streams')
			.where('memorialId', '==', memorialId)
			.where('status', '==', 'completed')
			.orderBy('actualStartTime', 'desc');

		const streamsSnapshot = await query.get();
		
		let archive = streamsSnapshot.docs.map(doc => {
			const streamData = doc.data();
			return {
				id: doc.id,
				title: streamData.title,
				description: streamData.description || '',
				cloudflareId: streamData.cloudflareId,
				playbackUrl: streamData.recordingUrl || streamData.playbackUrl,
				startedAt: streamData.actualStartTime || streamData.createdAt,
				endedAt: streamData.endTime,
				duration: streamData.recordingDuration,
				isVisible: streamData.isVisible,
				recordingReady: streamData.recordingReady,
				startedBy: streamData.createdBy,
				viewerCount: streamData.viewerCount || 0,
				createdAt: streamData.createdAt,
				updatedAt: streamData.updatedAt
			};
		});

		// If user doesn't have control access, filter to only visible entries
		if (!hasControlAccess) {
			archive = archive.filter((entry: any) => entry.isVisible === true);
		}

		console.log('📊 Archive entries found:', archive.length, hasControlAccess ? '(all)' : '(visible only)');

		return json({
			success: true,
			archive,
			hasControlAccess
		});

	} catch (error) {
		console.error('💥 Error getting livestream archive:', error);
		return json(
			{ error: 'Failed to get livestream archive', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
