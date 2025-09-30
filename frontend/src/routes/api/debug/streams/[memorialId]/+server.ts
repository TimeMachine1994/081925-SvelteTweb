import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const memorialId = params.memorialId;
    
    console.log('🔍 DEBUG: Checking streams for memorial:', memorialId);
    
    // Get all MVPTwo streams (no filters)
    const allStreamsSnapshot = await adminDb.collection('mvp_two_streams').get();
    const allStreams = allStreamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    // Get streams for this specific memorial
    const memorialStreamsSnapshot = await adminDb.collection('mvp_two_streams')
      .where('memorialId', '==', memorialId)
      .get();
    const memorialStreams = memorialStreamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    // Get visible streams for this memorial
    const visibleStreamsSnapshot = await adminDb.collection('mvp_two_streams')
      .where('memorialId', '==', memorialId)
      .where('isVisible', '==', true)
      .get();
    const visibleStreams = visibleStreamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    console.log('🔍 DEBUG Results:', {
      memorialId,
      totalStreams: allStreams.length,
      memorialStreams: memorialStreams.length,
      visibleStreams: visibleStreams.length
    });
    
    return json({
      memorialId,
      debug: {
        totalStreams: allStreams.length,
        memorialStreams: memorialStreams.length,
        visibleStreams: visibleStreams.length,
        allStreamsData: allStreams.map(s => ({
          id: s.id,
          memorialId: s.memorialId,
          title: s.title,
          status: s.status,
          isVisible: s.isVisible
        })),
        memorialStreamsData: memorialStreams.map(s => ({
          id: s.id,
          memorialId: s.memorialId,
          title: s.title,
          status: s.status,
          isVisible: s.isVisible,
          playbackUrl: s.playbackUrl,
          cloudflareId: s.cloudflareId || s.cloudflareStreamId
        })),
        visibleStreamsData: visibleStreams.map(s => ({
          id: s.id,
          memorialId: s.memorialId,
          title: s.title,
          status: s.status,
          isVisible: s.isVisible,
          // Clean Cloudflare fields only
          cloudflareId: s.cloudflareId,
          playbackUrl: s.playbackUrl,
          streamKey: s.streamKey,
          streamUrl: s.streamUrl,
          recordingPlaybackUrl: s.recordingPlaybackUrl,
          recordingReady: s.recordingReady,
          actualStartTime: s.actualStartTime,
          actualEndTime: s.actualEndTime
        }))
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return json({ error: 'Debug failed', details: (error as Error).message }, { status: 500 });
  }
};
