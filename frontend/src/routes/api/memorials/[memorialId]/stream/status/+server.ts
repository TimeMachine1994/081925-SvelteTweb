import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

export const POST: RequestHandler = async ({ request, locals, params }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { memorialId } = params;
    const { isLive, streamKey, platform } = await request.json();

    // Get memorial to verify ownership/permissions
    const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
    
    if (!memorialDoc.exists) {
      return json({ error: 'Memorial not found' }, { status: 404 });
    }

    const memorial = memorialDoc.data();
    
    if (!memorial) {
      return json({ error: 'Memorial data not found' }, { status: 404 });
    }

    // Check if user has permission to control stream
    const canControl = memorial.ownerId === locals.user.uid || 
                      memorial.createdBy === locals.user.uid || 
                      memorial.funeralDirectorId === locals.user.uid ||
                      locals.user.role === 'funeral_director';

    if (!canControl) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    // Update memorial stream status
    const updateData: any = {
      isLive,
      lastStreamUpdate: new Date(),
      updatedAt: new Date()
    };

    if (isLive) {
      updateData.streamStartTime = new Date();
      updateData.activeStreamPlatform = platform || 'mobile';
      updateData.currentStreamKey = streamKey;
    } else {
      updateData.streamEndTime = new Date();
      updateData.activeStreamPlatform = null;
    }

    await adminDb.collection('memorials').doc(memorialId).update(updateData);

    // Log stream activity
    await adminDb.collection('streamLogs').add({
      memorialId,
      userId: locals.user.uid,
      action: isLive ? 'stream_started' : 'stream_stopped',
      platform: platform || 'mobile',
      streamKey,
      timestamp: new Date(),
      userRole: locals.user.role
    });

    return json({
      success: true,
      message: isLive ? 'Stream started successfully' : 'Stream stopped successfully',
      isLive,
      memorialId
    });

  } catch (error) {
    console.error('Stream status update error:', error);
    return json({ error: 'Failed to update stream status' }, { status: 500 });
  }
};
