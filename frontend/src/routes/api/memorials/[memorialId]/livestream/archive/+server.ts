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

		// Get memorial document
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorial = memorialDoc.data();
		let archive = memorial?.livestreamArchive || [];

		// If user doesn't have control access, filter to only visible entries
		if (!hasControlAccess) {
			archive = archive.filter((entry: any) => entry.isVisible === true);
		}

		console.log('📊 Archive entries found:', archive.length, hasControlAccess ? '(all)' : '(visible only)');

		return json({
			success: true,
			archive: archive.sort((a: any, b: any) => {
				// Sort by startedAt descending (newest first)
				const aTime = a.startedAt?.toDate?.() || new Date(a.startedAt);
				const bTime = b.startedAt?.toDate?.() || new Date(b.startedAt);
				return bTime.getTime() - aTime.getTime();
			}),
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
