import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase-admin';
import { requireLivestreamAccess, createMemorialRequest } from '$lib/server/memorialMiddleware';

/**
 * Update livestream archive entry visibility
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	console.log('🔄 Update archive entry:', params.entryId, 'for memorial:', params.memorialId);

	try {
		const { memorialId, entryId } = params;
		const { isVisible } = await request.json();
		
		// Verify access permissions
		const memorialRequest = createMemorialRequest(memorialId, locals);
		const accessResult = await requireLivestreamAccess(memorialRequest);
		
		console.log('✅ Archive update access verified:', accessResult.reason);

		// Get memorial document
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorial = memorialDoc.data();
		const archive = memorial?.livestreamArchive || [];

		// Find and update the specific entry
		const entryIndex = archive.findIndex((entry: any) => entry.id === entryId);
		
		if (entryIndex === -1) {
			return json({ error: 'Archive entry not found' }, { status: 404 });
		}

		// Update the entry
		archive[entryIndex] = {
			...archive[entryIndex],
			isVisible: isVisible,
			updatedAt: new Date()
		};

		// Update the memorial document
		await memorialRef.update({
			livestreamArchive: archive,
			updatedAt: new Date()
		});

		console.log('✅ Archive entry updated:', entryId, 'visibility:', isVisible);

		return json({
			success: true,
			message: 'Archive entry updated successfully'
		});

	} catch (error) {
		console.error('💥 Error updating archive entry:', error);
		return json(
			{ error: 'Failed to update archive entry', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};

/**
 * Delete livestream archive entry
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	console.log('🗑️ Delete archive entry:', params.entryId, 'for memorial:', params.memorialId);

	try {
		const { memorialId, entryId } = params;
		
		// Verify access permissions
		const memorialRequest = createMemorialRequest(memorialId, locals);
		const accessResult = await requireLivestreamAccess(memorialRequest);
		
		console.log('✅ Archive delete access verified:', accessResult.reason);

		// Get memorial document
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorial = memorialDoc.data();
		const archive = memorial?.livestreamArchive || [];

		// Filter out the entry to delete
		const updatedArchive = archive.filter((entry: any) => entry.id !== entryId);

		if (updatedArchive.length === archive.length) {
			return json({ error: 'Archive entry not found' }, { status: 404 });
		}

		// Update the memorial document
		await memorialRef.update({
			livestreamArchive: updatedArchive,
			updatedAt: new Date()
		});

		console.log('✅ Archive entry deleted:', entryId);

		return json({
			success: true,
			message: 'Archive entry deleted successfully'
		});

	} catch (error) {
		console.error('💥 Error deleting archive entry:', error);
		return json(
			{ error: 'Failed to delete archive entry', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
