import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export const GET: RequestHandler = async ({ locals, params }) => {
  try {
    const { memorialId, streamId } = params;

    const streamDoc = await adminDb
      .collection('memorials')
      .doc(memorialId)
      .collection('livestreams')
      .doc(streamId)
      .get();

    if (!streamDoc.exists) {
      return json({ error: 'Livestream not found' }, { status: 404 });
    }

    const streamData = { id: streamDoc.id, ...streamDoc.data() };

    // Check if user has permission to view this stream
    if (!streamData.isPublic && locals.user) {
      const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
      const memorial = memorialDoc.data();
      
      const isFuneralDirector = memorial?.funeralDirector?.id === locals.user.uid;
      const isOwner = memorial?.ownerId === locals.user.uid;
      const isAllowedViewer = streamData.allowedViewers?.includes(locals.user.uid);
      
      if (!isFuneralDirector && !isOwner && !isAllowedViewer) {
        return json({ error: 'Permission denied' }, { status: 403 });
      }
    }

    return json(streamData);

  } catch (error) {
    console.error('Error fetching livestream:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { memorialId, streamId } = params;
    const updates = await request.json();

    // Verify permission
    const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
    if (!memorialDoc.exists) {
      return json({ error: 'Memorial not found' }, { status: 404 });
    }

    const memorial = memorialDoc.data();
    const isFuneralDirector = memorial?.funeralDirector?.id === locals.user.uid;
    const isOwner = memorial?.ownerId === locals.user.uid;
    
    if (!isFuneralDirector && !isOwner) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    // Update stream
    const streamRef = adminDb
      .collection('memorials')
      .doc(memorialId)
      .collection('livestreams')
      .doc(streamId);

    const updateData: any = {
      updatedAt: Timestamp.now()
    };

    if (updates.status) {
      updateData.status = updates.status;
      
      if (updates.status === 'ended') {
        updateData.endTime = Timestamp.now();
        
        // Decrease active streams count
        await memorialDoc.ref.update({
          activeStreams: Math.max((memorial.activeStreams || 1) - 1, 0)
        });
      }
    }

    if (updates.analytics) {
      updateData.analytics = updates.analytics;
    }

    await streamRef.update(updateData);

    return json({ success: true, message: 'Livestream updated successfully' });

  } catch (error) {
    console.error('Error updating livestream:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { memorialId, streamId } = params;

    // Verify permission
    const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
    if (!memorialDoc.exists) {
      return json({ error: 'Memorial not found' }, { status: 404 });
    }

    const memorial = memorialDoc.data();
    const isFuneralDirector = memorial?.funeralDirector?.id === locals.user.uid;
    const isOwner = memorial?.ownerId === locals.user.uid;
    
    if (!isFuneralDirector && !isOwner) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    // Delete stream
    await adminDb
      .collection('memorials')
      .doc(memorialId)
      .collection('livestreams')
      .doc(streamId)
      .delete();

    // Decrease active streams count
    await memorialDoc.ref.update({
      activeStreams: Math.max((memorial.activeStreams || 1) - 1, 0)
    });

    return json({ success: true, message: 'Livestream deleted successfully' });

  } catch (error) {
    console.error('Error deleting livestream:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
