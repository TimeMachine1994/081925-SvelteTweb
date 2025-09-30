import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { requireStreamAccess } from '$lib/server/streamMiddleware';

const STREAMS_COLLECTION = 'streams';

/**
 * GET /api/streams/[id]
 * Get a specific stream
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const { id } = params;
    
    const docRef = adminDb.collection(STREAMS_COLLECTION).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return json({ error: 'Stream not found' }, { status: 404 });
    }

    const streamData = doc.data()!;
    
    // Check permissions
    const access = await requireStreamAccess({
      streamId: id,
      stream: streamData,
      user: locals.user,
      action: 'view'
    });

    if (!access.canView) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    const stream = {
      id: doc.id,
      ...streamData,
      createdAt: streamData.createdAt?.toDate(),
      updatedAt: streamData.updatedAt?.toDate(),
      scheduledStartTime: streamData.scheduledStartTime?.toDate(),
      actualStartTime: streamData.actualStartTime?.toDate(),
      endTime: streamData.endTime?.toDate()
    };

    return json(stream);

  } catch (error) {
    console.error('❌ [STREAMS] GET error:', error);
    return json({ error: 'Failed to fetch stream' }, { status: 500 });
  }
};

/**
 * PUT /api/streams/[id]
 * Update a stream
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { id } = params;
    const updates = await request.json();
    
    const docRef = adminDb.collection(STREAMS_COLLECTION).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return json({ error: 'Stream not found' }, { status: 404 });
    }

    const streamData = doc.data()!;
    
    // Check permissions
    const access = await requireStreamAccess({
      streamId: id,
      stream: streamData,
      user: locals.user,
      action: 'edit'
    });

    if (!access.canEdit) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    // Validate updates
    const allowedFields = [
      'title', 'description', 'isVisible', 'isPublic', 'displayOrder',
      'scheduledStartTime', 'allowedUsers'
    ];
    
    const filteredUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'scheduledStartTime' && value) {
          filteredUpdates[key] = new Date(value as string);
        } else {
          filteredUpdates[key] = value;
        }
      }
    }

    // Add update timestamp
    filteredUpdates.updatedAt = new Date();

    await docRef.update(filteredUpdates);
    
    // Return updated stream
    const updatedDoc = await docRef.get();
    const updatedStream = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      createdAt: updatedDoc.data()?.createdAt?.toDate(),
      updatedAt: updatedDoc.data()?.updatedAt?.toDate(),
      scheduledStartTime: updatedDoc.data()?.scheduledStartTime?.toDate(),
      actualStartTime: updatedDoc.data()?.actualStartTime?.toDate(),
      endTime: updatedDoc.data()?.endTime?.toDate()
    };

    console.log('✅ [STREAMS] Updated stream:', id);

    return json(updatedStream);

  } catch (error) {
    console.error('❌ [STREAMS] PUT error:', error);
    return json({ error: 'Failed to update stream' }, { status: 500 });
  }
};

/**
 * DELETE /api/streams/[id]
 * Delete a stream
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { id } = params;
    
    const docRef = adminDb.collection(STREAMS_COLLECTION).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return json({ error: 'Stream not found' }, { status: 404 });
    }

    const streamData = doc.data()!;
    
    // Check permissions
    const access = await requireStreamAccess({
      streamId: id,
      stream: streamData,
      user: locals.user,
      action: 'delete'
    });

    if (!access.canDelete) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    // Don't allow deletion of live streams
    if (streamData.status === 'live') {
      return json({ error: 'Cannot delete live stream. Stop it first.' }, { status: 400 });
    }

    await docRef.delete();

    console.log('✅ [STREAMS] Deleted stream:', id);

    return json({ success: true, message: 'Stream deleted successfully' });

  } catch (error) {
    console.error('❌ [STREAMS] DELETE error:', error);
    return json({ error: 'Failed to delete stream' }, { status: 500 });
  }
};
