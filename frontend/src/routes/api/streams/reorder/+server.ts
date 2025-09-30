import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

const STREAMS_COLLECTION = 'streams';

/**
 * PUT /api/streams/reorder
 * Reorder streams by updating displayOrder
 */
export const PUT: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { streamIds, memorialId } = await request.json();
    
    console.log('🔄 [REORDER_STREAMS] Reordering streams:', {
      streamIds: streamIds?.length || 0,
      memorialId,
      userId: locals.user.uid
    });

    // Validate input
    if (!Array.isArray(streamIds) || streamIds.length === 0) {
      return json({ error: 'streamIds array is required' }, { status: 400 });
    }

    // Verify user has permission to reorder these streams
    const batch = adminDb.batch();
    const verificationPromises = streamIds.map(async (streamId: string, index: number) => {
      const streamDoc = await adminDb.collection(STREAMS_COLLECTION).doc(streamId).get();
      
      if (!streamDoc.exists) {
        throw new Error(`Stream ${streamId} not found`);
      }

      const streamData = streamDoc.data()!;
      
      // Check if user can edit this stream
      const canEdit = streamData.createdBy === locals.user.uid || 
                     locals.user.isAdmin ||
                     (memorialId && streamData.memorialId === memorialId);

      if (!canEdit) {
        throw new Error(`Permission denied for stream ${streamId}`);
      }

      // Add to batch update with new displayOrder
      batch.update(streamDoc.ref, {
        displayOrder: index,
        updatedAt: new Date()
      });

      return {
        streamId,
        title: streamData.title,
        oldOrder: streamData.displayOrder || 0,
        newOrder: index
      };
    });

    // Wait for all verifications and prepare batch
    const streamUpdates = await Promise.all(verificationPromises);

    // Execute batch update
    await batch.commit();

    console.log('✅ [REORDER_STREAMS] Successfully reordered streams:', streamUpdates);

    return json({
      success: true,
      message: 'Streams reordered successfully',
      updatedStreams: streamUpdates,
      totalUpdated: streamIds.length
    });

  } catch (error) {
    console.error('❌ [REORDER_STREAMS] Error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return json({ error: error.message }, { status: 404 });
    }
    
    if (error instanceof Error && error.message.includes('Permission denied')) {
      return json({ error: error.message }, { status: 403 });
    }

    return json({ 
      error: 'Failed to reorder streams',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
