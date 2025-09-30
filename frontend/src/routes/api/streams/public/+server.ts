import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

const STREAMS_COLLECTION = 'streams';

/**
 * GET /api/streams/public
 * Get public streams for discovery (no authentication required)
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    // Extract query parameters
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    console.log('🌐 [PUBLIC_STREAMS] Request:', { status, limit, offset });

    // Build query for public streams only
    let query = adminDb.collection(STREAMS_COLLECTION)
      .where('isPublic', '==', true)
      .where('isVisible', '==', true)
      .orderBy('actualStartTime', 'desc');

    // Apply status filter if provided
    if (status) {
      query = query.where('status', '==', status);
    }

    // Apply pagination
    if (offset > 0) {
      const offsetSnapshot = await query.limit(offset).get();
      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.limit(limit + 1).get(); // +1 to check if there are more

    const streams = snapshot.docs.slice(0, limit).map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        memorialId: data.memorialId,
        memorialName: data.memorialName,
        status: data.status,
        playbackUrl: data.playbackUrl,
        recordingReady: data.recordingReady,
        recordingUrl: data.recordingUrl,
        recordingDuration: data.recordingDuration,
        viewerCount: data.viewerCount || 0,
        actualStartTime: data.actualStartTime?.toDate(),
        endTime: data.endTime?.toDate(),
        createdAt: data.createdAt?.toDate()
      };
    });

    const hasMore = snapshot.docs.length > limit;

    // Group streams by status for easier consumption
    const liveStreams = streams.filter(s => s.status === 'live');
    const scheduledStreams = streams.filter(s => s.status === 'scheduled');
    const recordedStreams = streams.filter(s => s.status === 'completed' && s.recordingReady);

    console.log('✅ [PUBLIC_STREAMS] Returning:', {
      total: streams.length,
      live: liveStreams.length,
      scheduled: scheduledStreams.length,
      recorded: recordedStreams.length
    });

    return json({
      streams,
      liveStreams,
      scheduledStreams,
      recordedStreams,
      total: streams.length,
      hasMore,
      pagination: {
        limit,
        offset,
        nextOffset: hasMore ? offset + limit : null
      }
    });

  } catch (error) {
    console.error('❌ [PUBLIC_STREAMS] Error:', error);
    return json({ error: 'Failed to fetch public streams' }, { status: 500 });
  }
};
