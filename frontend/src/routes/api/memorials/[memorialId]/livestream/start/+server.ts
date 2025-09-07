import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export const POST: RequestHandler = async ({ request, locals, params }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { memorialId } = params;
    const data = await request.json();

    // Verify memorial exists and user has permission
    const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
    if (!memorialDoc.exists) {
      return json({ error: 'Memorial not found' }, { status: 404 });
    }

    const memorial = memorialDoc.data();
    
    // Check if user is funeral director for this memorial or owner
    const isFuneralDirector = memorial?.funeralDirector?.id === locals.user.uid;
    const isOwner = memorial?.ownerId === locals.user.uid;
    
    if (!isFuneralDirector && !isOwner) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    // Check if livestreaming is enabled for this memorial
    if (!memorial?.livestreamEnabled) {
      return json({ error: 'Livestreaming not enabled for this memorial' }, { status: 400 });
    }

    // Create livestream session
    const livestreamData = {
      title: data.title,
      description: data.description || '',
      scheduledStartTime: Timestamp.now(),
      actualStartTime: Timestamp.now(),
      
      streamConfig: {
        provider: data.streamProvider || 'custom',
        streamUrl: data.streamUrl || '',
        streamKey: data.streamKey || '',
        embedCode: data.embedCode || '',
        maxViewers: data.maxViewers || 100
      },
      
      status: 'live',
      isPublic: data.isPublic !== false,
      requiresPassword: data.requiresPassword || false,
      password: data.password || '',
      allowedViewers: data.allowedViewers || [],
      
      analytics: {
        peakViewers: 0,
        totalViews: 0,
        averageWatchTime: 0,
        chatMessages: 0
      },
      
      funeralDirectorId: isFuneralDirector ? locals.user.uid : memorial.funeralDirector?.id,
      createdBy: locals.user.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Add livestream to memorial's subcollection
    const livestreamRef = adminDb
      .collection('memorials')
      .doc(memorialId)
      .collection('livestreams')
      .doc();

    await livestreamRef.set(livestreamData);

    // Update memorial's active streams count
    await memorialDoc.ref.update({
      activeStreams: (memorial.activeStreams || 0) + 1,
      updatedAt: Timestamp.now()
    });

    return json({
      success: true,
      streamId: livestreamRef.id,
      message: 'Livestream started successfully'
    });

  } catch (error) {
    console.error('Error starting livestream:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
